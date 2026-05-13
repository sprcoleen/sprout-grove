/**
 * auth.setup.js
 *
 * Signs in via Node.js (no PKCE needed), then calls window.__supabase.auth.setSession()
 * inside the browser — letting the Supabase client handle its own storage format.
 *
 * Why not magic links?  Supabase v2 uses PKCE by default. Magic links redirect
 * with ?code=... which requires a code-verifier already in localStorage — that
 * verifier only exists if the Supabase client initiated the flow in that same
 * browser session. A fresh Playwright browser never has it, so the exchange
 * silently fails and the page stays blank.
 *
 * Why not inject localStorage directly?  @supabase/auth-js changes its storage
 * format between minor versions. Instead, we expose window.__supabase (DEV only)
 * and call setSession() so the client manages its own storage correctly.
 *
 * SETUP REQUIRED (one time):
 *   1. In Supabase dashboard → Authentication → Providers → enable "Email" provider
 *      (you can leave "Confirm email" OFF for test accounts)
 *   2. Add E2E_TEST_PASSWORD to .env.local  (any password you choose)
 *   3. You do NOT need to set a password in the Supabase dashboard — this script
 *      sets it automatically via the admin API on every run.
 */

import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEST_EMAIL        = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD     = process.env.E2E_TEST_PASSWORD || 'E2eTestPass123!'

setup('authenticate test user', async ({ page }) => {
  if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in .env.local')
  if (!TEST_EMAIL)        throw new Error('E2E_TEST_EMAIL not set in .env.local')

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Step 1: find the test user and set a known password ─────────────────
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw new Error(`Could not list users: ${listError.message}`)

  const testUser = listData.users.find(u => u.email === TEST_EMAIL)
  if (!testUser) {
    throw new Error(`User not found: ${TEST_EMAIL}. Create this user in Supabase Auth first.`)
  }

  await admin.auth.admin.updateUserById(testUser.id, { password: TEST_PASSWORD })

  // ── Step 1b: ensure profile is test-ready (approver, no welcome modal) ───
  await admin
    .from('profiles')
    .update({ has_dismissed_welcome: true, is_approver: true })
    .eq('email', TEST_EMAIL)

  // ── Step 1c: clean up any leftover E2E test plants from previous runs ────
  await admin
    .from('projects')
    .delete()
    .eq('name', 'E2E Approver Test Plant')

  // ── Step 2: sign in from Node.js (no browser, no PKCE) ───────────────────
  const nodeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: signInData, error: signInError } = await nodeClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInError) {
    throw new Error(
      `signInWithPassword failed: ${signInError.message}\n` +
      `Make sure "Email" provider is enabled in Supabase Authentication settings.`
    )
  }

  // ── Step 3: load the app and call setSession via window.__supabase ────────
  // src/lib/supabase.js exposes window.__supabase = supabase in DEV mode.
  // setSession() lets the client handle its own localStorage format correctly,
  // regardless of @supabase/auth-js version changes.
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Wait for window.__supabase to be available (app JS must have executed)
  await page.waitForFunction(() => typeof window.__supabase !== 'undefined', { timeout: 15000 })

  const setSessionError = await page.evaluate(async ({ accessToken, refreshToken }) => {
    const { error } = await window.__supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    return error ? error.message : null
  }, { accessToken: signInData.session.access_token, refreshToken: signInData.session.refresh_token })

  if (setSessionError) {
    throw new Error(`setSession failed in browser: ${setSessionError}`)
  }

  // ── Step 4: wait for the app to recognise the session ────────────────────
  // setSession fires onAuthStateChange → app loads profile + data
  const isLoggedIn = await page.getByRole('button', { name: /Add to Garden/i })
    .isVisible({ timeout: 20000 }).catch(() => false)

  if (!isLoggedIn) {
    const info = await page.evaluate(() => ({
      url:  location.href,
      html: document.body.innerHTML.slice(0, 600),
    }))
    throw new Error(
      `App did not reach main view after setSession.\n` +
      `URL: ${info.url}\nHTML: ${info.html}`
    )
  }

  // ── Step 5: save storage state for all tests ─────────────────────────────
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
