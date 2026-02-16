/**
 * Helpers.js — Shared utilities for PPPM Market Intelligence Engine
 * Sheet I/O, logging, and common functions.
 */

/**
 * Reads a sheet and returns an object with headers and row data.
 * Each row is an object keyed by header name.
 * @param {string} sheetName - Name of the sheet to read.
 * @returns {{ headers: string[], rows: Object[] }} Parsed sheet data.
 */
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return { headers: [], rows: [] };
  }
  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return { headers: headers, rows: rows };
}

/**
 * Reads raw 2D values from a sheet (no object mapping).
 * @param {string} sheetName
 * @returns {any[][]} Raw 2D array including header row.
 */
function getSheetRawValues(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return [];
  }
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

/**
 * Atomic clear + write to a sheet.
 * Creates the sheet if it doesn't exist.
 * @param {string} sheetName - Target sheet name.
 * @param {string[]} headerRow - Array of column headers.
 * @param {any[][]} dataRows - 2D array of data rows.
 */
function writeSheet(sheetName, headerRow, dataRows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();

  var allRows = [headerRow].concat(dataRows);
  if (allRows.length > 0 && allRows[0].length > 0) {
    sheet.getRange(1, 1, allRows.length, allRows[0].length).setValues(allRows);
  }
}

/**
 * Appends a run-log entry to the RUN_LOG sheet.
 * Creates the sheet + header if it doesn't exist.
 * @param {string} scriptName - Name of the script that ran.
 * @param {string} status - "SUCCESS" or "ERROR".
 * @param {string} message - Descriptive message.
 */
function logRun(scriptName, status, message) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.RUN_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.RUN_LOG);
    sheet.getRange(1, 1, 1, 4).setValues([['timestamp', 'script_name', 'status', 'message']]);
  }
  sheet.appendRow([new Date(), scriptName, status, message]);
}

/**
 * Returns the column-A value from row 2 of a sheet (the API Connector timestamp).
 * @param {string} sheetName
 * @returns {any} The timestamp value, or null if unavailable.
 */
function getSheetTimestamp(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }
  return sheet.getRange(2, 1).getValue();
}

/**
 * Returns the data-row count of a sheet (total rows minus header).
 * @param {string} sheetName
 * @returns {number}
 */
function getSheetRowCount(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  return Math.max(0, sheet.getLastRow() - 1);
}
