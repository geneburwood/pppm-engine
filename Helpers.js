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
  var hasRefreshTime = (headers[0] === 'Refresh Time');
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];

    // API Connector leaves Refresh Time empty on merged rows, shifting data left.
    // Detect: if first header is "Refresh Time" but first value is not a date
    // and not empty, the row is shifted — re-align by inserting blank at position 0.
    if (hasRefreshTime && !isDateValue(rowData[0]) && rowData[0] !== '' && rowData[0] !== null) {
      rowData = [''].concat(rowData.slice(0, rowData.length - 1));
    }

    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = rowData[j];
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

/**
 * Checks if a value is a date — either a Date object or an ISO date string.
 * Used to detect valid Refresh Time values vs shifted data.
 * @param {any} val
 * @returns {boolean}
 */
function isDateValue(val) {
  if (val instanceof Date) return true;
  if (typeof val === 'string' && val.length > 0) {
    // Match ISO dates like "2026-02-16T21:52:06.527Z" or "2026-02-16"
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return true;
    // Match dates like "2/16/2026" or "02/16/2026 6:00:00"
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) return true;
  }
  return false;
}
