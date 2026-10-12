/**
 * Grove Daily Health Check — Google Apps Script
 *
 * Setup:
 *  1. Go to https://script.google.com → New project
 *  2. Paste this file → save
 *  3. In Project Settings → Script Properties, add:
 *       GROVE_URL  = https://grove.sprout.solutions
 *       GC_WEBHOOK = <your Google Chat webhook URL>
 *  4. Run setupDailyTrigger() once to register the time-based trigger
 *  5. Authorize when prompted
 *
 * Runs groveHealthCheck() every day at 8am Manila time.
 * Results are always posted to Google Chat.
 */

function groveHealthCheck() {
  var props = PropertiesService.getScriptProperties();
  var GROVE_URL  = props.getProperty('GROVE_URL');
  var GC_WEBHOOK = props.getProperty('GC_WEBHOOK');

  var results = [];
  var allOk = true;

  // Check 1: Health endpoint (also keeps Supabase active)
  try {
    var r1 = UrlFetchApp.fetch(GROVE_URL + '/api/health', { muteHttpExceptions: true });
    var body1 = JSON.parse(r1.getContentText());
    var pass1 = r1.getResponseCode() === 200 && body1.ok === true;
    results.push({ check: 'Health / Supabase ping', pass: pass1, status: r1.getResponseCode(), detail: JSON.stringify(body1) });
    if (!pass1) allOk = false;
  } catch (e) {
    results.push({ check: 'Health / Supabase ping', pass: false, status: 'error', detail: e.message });
    allOk = false;
  }

  // Check 2: Main app page
  try {
    var r2 = UrlFetchApp.fetch(GROVE_URL + '/', { muteHttpExceptions: true });
    var pass2 = r2.getResponseCode() === 200;
    results.push({ check: 'Main app page', pass: pass2, status: r2.getResponseCode(), detail: '' });
    if (!pass2) allOk = false;
  } catch (e) {
    results.push({ check: 'Main app page', pass: false, status: 'error', detail: e.message });
    allOk = false;
  }

  // Check 3: Jira tickets API
  try {
    var r3 = UrlFetchApp.fetch(GROVE_URL + '/api/get-jira-tickets', { muteHttpExceptions: true });
    var pass3 = r3.getResponseCode() === 200;
    results.push({ check: 'Jira tickets API', pass: pass3, status: r3.getResponseCode(), detail: '' });
    if (!pass3) allOk = false;
  } catch (e) {
    results.push({ check: 'Jira tickets API', pass: false, status: 'error', detail: e.message });
    allOk = false;
  }

  // Log results
  var timestamp = new Date().toISOString();
  var lines = results.map(function(r) {
    return (r.pass ? 'PASS' : 'FAIL') + ' - ' + r.check + ' [HTTP ' + r.status + ']' + (r.detail ? ' - ' + r.detail : '');
  });
  Logger.log('[' + timestamp + '] Grove health check\n' + lines.join('\n'));

  // Always notify Google Chat
  var status = allOk ? 'All checks passed' : 'ISSUES DETECTED';
  var msg = '*Grove Daily Health Check — ' + status + '*\n' + new Date().toDateString() + '\n\n' + lines.join('\n') + '\n\n' + GROVE_URL;
  UrlFetchApp.fetch(GC_WEBHOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: msg }),
    muteHttpExceptions: true
  });
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'groveHealthCheck') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('groveHealthCheck')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  Logger.log('Daily trigger registered.');
}
