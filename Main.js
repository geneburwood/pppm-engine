/**
 * Main.js — Entry points + trigger setup for PPPM Market Intelligence Engine.
 *
 * These are the functions to call from the Apps Script editor or triggers.
 */

/**
 * Entry point: Runs Bootstrap (Script 1).
 * Builds TRUTH_META and CONTACT_KEYS from RAW API sheets.
 */
function runBootstrap() {
  try {
    bootstrapTruthMeta();
    buildContactKeys();
    logRun('runBootstrap', 'SUCCESS', 'TRUTH_META and CONTACT_KEYS updated.');
  } catch (e) {
    logRun('runBootstrap', 'ERROR', e.message);
    throw e;
  }
}

/**
 * Entry point: Runs Gap Analysis (Scripts 2 + 3).
 * Normalizes rent data and builds the GAP_ANALYSIS sheet.
 */
function runGapAnalysis() {
  try {
    buildGapAnalysis();
    logRun('runGapAnalysis', 'SUCCESS', 'GAP_ANALYSIS updated.');
  } catch (e) {
    logRun('runGapAnalysis', 'ERROR', e.message);
    throw e;
  }
}

/**
 * Entry point: Runs RentCast snapshot fetch (Script 4 — stub).
 */
function runRentCast() {
  try {
    appendRentCastSnapshots();
  } catch (e) {
    logRun('runRentCast', 'ERROR', e.message);
    throw e;
  }
}

/**
 * Entry point: Runs the full pipeline (Bootstrap → Gap Analysis).
 */
function runAll() {
  runBootstrap();
  runGapAnalysis();
}

/**
 * Creates time-based triggers for automated daily runs.
 * Deletes existing PPPM triggers before creating new ones to avoid duplicates.
 *
 * Schedule (adjust times to run 10-15 min after API Connector refresh):
 * - runBootstrap: daily at 6:15 AM
 * - runGapAnalysis: daily at 6:30 AM
 */
function setupTriggers() {
  // Remove existing triggers for our functions to avoid duplicates
  var functionNames = ['runBootstrap', 'runGapAnalysis', 'runRentCast'];
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    var handlerName = allTriggers[i].getHandlerFunction();
    if (functionNames.indexOf(handlerName) !== -1) {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }

  // Create new daily triggers
  ScriptApp.newTrigger('runBootstrap')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .nearMinute(15)
    .create();

  ScriptApp.newTrigger('runGapAnalysis')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .nearMinute(30)
    .create();

  logRun('setupTriggers', 'SUCCESS', 'Daily triggers created for runBootstrap (6:15) and runGapAnalysis (6:30).');
}
