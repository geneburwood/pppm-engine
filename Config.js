/**
 * Config.js — CONFIG sheet reader + constants for PPPM Engine.
 */

/** Sheet name mapping — logical keys to actual tab names. */
var SHEETS = {
  API_PORTFOLIOS: "API Portfolios",
  API_PROPERTIES: "API Properties",
  API_UNITS: "API Units",
  API_LEASES: "API Leases",
  API_OWNERS: "API Owners",
  API_TENANTS: "API Tenants",
  API_VENDORS: "API Vendors",

  CONFIG: "CONFIG",
  RUN_LOG: "RUN_LOG",
  TRUTH_META: "TRUTH_META",
  CONTACT_KEYS: "CONTACT_KEYS",

  RC_AVM_SNAPSHOTS: "RC_AVM_SNAPSHOTS",
  RC_MARKET_WEEKLY: "RC_MARKET_WEEKLY",
  RC_LISTINGS_PULSE: "RC_LISTINGS_PULSE",

  GAP_ANALYSIS: "GAP_ANALYSIS"
};

/** Names of RAW sheets populated by API Connector (read-only). */
var RAW_SHEETS = [
  SHEETS.API_PORTFOLIOS,
  SHEETS.API_PROPERTIES,
  SHEETS.API_UNITS,
  SHEETS.API_LEASES,
  SHEETS.API_OWNERS,
  SHEETS.API_TENANTS,
  SHEETS.API_VENDORS
];

/** Contact-type source sheets and their type labels. */
var CONTACT_SOURCES = [
  { sheet: SHEETS.API_OWNERS,  typeName: 'Owner' },
  { sheet: SHEETS.API_TENANTS, typeName: 'Tenant' },
  { sheet: SHEETS.API_VENDORS, typeName: 'Vendor' }
];

/** Default CONFIG values (used when CONFIG sheet key is missing). */
var CONFIG_DEFAULTS = {
  RENEWAL_WINDOW_DAYS: 90,
  UNDERPRICED_THRESHOLD: 10,
  OVERPRICED_THRESHOLD: 10,
  TRACK_ZIPS: '',
  RENTCAST_CALL_BUDGET: 50
};

/**
 * Reads a single config value from the CONFIG sheet.
 * Falls back to CONFIG_DEFAULTS if key not found.
 * Expects CONFIG sheet layout: column A = key, column B = value.
 * @param {string} key
 * @returns {any} The config value.
 */
function getConfig(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= 1) {
      var data = sheet.getRange(1, 1, lastRow, 2).getValues();
      for (var i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === key) {
          return data[i][1];
        }
      }
    }
  }
  return CONFIG_DEFAULTS.hasOwnProperty(key) ? CONFIG_DEFAULTS[key] : null;
}

/**
 * Reads all CONFIG keys into an object.
 * @returns {Object} Key-value map of config settings.
 */
function getAllConfig() {
  var config = {};
  var keys = Object.keys(CONFIG_DEFAULTS);
  for (var i = 0; i < keys.length; i++) {
    config[keys[i]] = getConfig(keys[i]);
  }
  return config;
}
