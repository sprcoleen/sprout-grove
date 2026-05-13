/**
 * approver.spec.js
 *
 * E2E tests for the approver role flow:
 *   Add plant → Submit to Nursery → Approve → appears in My Plants
 *
 * Prereqs:
 * - E2E_TEST_EMAIL must have is_approver = true in the profiles table
 * - Run auth setup first (handled automatically by playwright.config.js project setup)
 * - auth.setup.js deletes any existing plant named PLANT_NAME before tests run
 */

import { test, expect } from '@playwright/test'

// Reuse the saved session from auth.setup.js
test.use({ storageState: 'e2e/.auth/user.json' })

// Fixed name so all tests in this suite reference the same plant,
// even when Playwright creates new workers on retry.
const PLANT_NAME = 'E2E Approver Test Plant'

/** Helper: go to '/' and wait for the app to fully load */
async function goHome(page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // Dismiss welcome modal with a short timeout — don't burn 30s if it's gone
  await page.locator('button:has-text("Take me in")').click({ timeout: 2000 }).catch(() => {})
}

test.describe('Approver role — add and approve a plant', () => {

  test('approver can add a plant and see it in My Plants', async ({ page }) => {
    await goHome(page)

    // Click "Add to Garden"
    await page.getByRole('button', { name: /Add to Garden/i }).click()

    // Fill in the form
    await page.getByPlaceholder(/project name/i).fill(PLANT_NAME)

    // Pick a tool (required)
    await page.getByText('ChatGPT').click()

    // Submit
    await page.getByRole('button', { name: /Add Plant|Add to Garden|Save/i }).last().click()

    // Dismiss modal if still open
    await page.keyboard.press('Escape')

    // Open My Corner (right panel)
    await page.getByText('My Corner').click().catch(() => {})

    // "My Plants" section in Panel B for approvers
    await expect(page.getByText(PLANT_NAME)).toBeVisible({ timeout: 8000 })
  })

  test('approver sees nursery queue when a plant is submitted', async ({ page }) => {
    await goHome(page)

    // Click the test plant to open detail panel
    await page.getByText(PLANT_NAME).first().click()

    // Fill prototype link (required to submit)
    const protoInput = page.getByPlaceholder(/prototype|demo link/i)
    if (await protoInput.isVisible()) {
      await protoInput.fill('https://example.com/demo')
    }

    // Submit to Nursery
    await page.getByRole('button', { name: /Submit.*Nursery|Submit for Review/i }).click()

    // Nursery Queue (Panel A for approvers) should now show the plant
    await expect(page.getByText('Nursery Queue')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(PLANT_NAME)).toBeVisible({ timeout: 8000 })
  })

  test('approver can approve a nursery plant — stage moves to Sprout', async ({ page }) => {
    await goHome(page)

    // Open the plant from the nursery queue or garden
    await page.getByText(PLANT_NAME).first().click()

    // Click Approve
    await page.getByRole('button', { name: /Approve/i }).click()

    // Stage badge should now show "Sprout"
    await expect(page.getByText('Sprout').first()).toBeVisible({ timeout: 8000 })
  })

  test('approved plant still appears in approver My Plants', async ({ page }) => {
    await goHome(page)

    // My Plants section (Panel B for approvers) should still list the plant
    // after it moved to Sprout
    await expect(page.getByText(PLANT_NAME)).toBeVisible({ timeout: 8000 })
  })

  test('normal user cannot see Approve button', async ({ page }) => {
    // This test only works if you have a second saved session for a normal user.
    // Skip for now — uncomment when you set up a second test account.
    test.skip(true, 'Requires a second saved session for a normal user role')
  })
})
