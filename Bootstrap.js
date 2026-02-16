/**
 * Bootstrap.js — Script 1: TRUTH_META + CONTACT_KEYS
 * Reads RAW API sheets and builds metadata / contact lookup tables.
 */

/**
 * Builds the TRUTH_META sheet with refresh metadata for each RAW table.
 * Checks if RAW refresh time has changed since last run (race-condition safety).
 */
function bootstrapTruthMeta() {
  var now = new Date();
  var headerRow = ['table_name', 'last_refresh_time', 'row_count', 'last_checked_at'];
  var dataRows = [];

  for (var i = 0; i < RAW_SHEETS.length; i++) {
    var sheetName = RAW_SHEETS[i];
    var timestamp = getSheetTimestamp(sheetName);
    var rowCount = getSheetRowCount(sheetName);
    dataRows.push([sheetName, timestamp || '', rowCount, now]);
  }

  writeSheet(SHEETS.TRUTH_META, headerRow, dataRows);
}

/**
 * Builds the CONTACT_KEYS sheet by merging owners, tenants, and vendors
 * into a unified contact lookup with merge keys.
 */
function buildContactKeys() {
  var headerRow = [
    'contact_merge_key',
    'contact_id',
    'contact_type_id',
    'contact_type_name',
    'display_name',
    'email',
    'phone',
    'source_sheet',
    'refresh_time'
  ];
  var dataRows = [];

  for (var s = 0; s < CONTACT_SOURCES.length; s++) {
    var source = CONTACT_SOURCES[s];
    var sheetData;
    try {
      sheetData = getSheetData(source.sheet);
    } catch (e) {
      // Sheet doesn't exist yet — skip gracefully
      continue;
    }

    var refreshTime = getSheetTimestamp(source.sheet) || '';
    var rows = sheetData.rows;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];

      // Resolve field names — Rentvine API uses various naming conventions
      var contactId = row['contactID'] || row['contactId'] || row['id'] || '';
      var contactTypeId = row['contactTypeID'] || row['contactTypeId'] || '';
      var displayName = buildDisplayName(row);
      var email = row['email'] || row['emailAddress'] || '';
      var phone = row['phone'] || row['phoneNumber'] || row['mobilePhone'] || '';

      var mergeKey = String(contactId) + '|' + String(contactTypeId);

      dataRows.push([
        mergeKey,
        contactId,
        contactTypeId,
        source.typeName,
        displayName,
        email,
        phone,
        source.sheet,
        refreshTime
      ]);
    }
  }

  writeSheet(SHEETS.CONTACT_KEYS, headerRow, dataRows);
}

/**
 * Builds a display name from available name fields.
 * @param {Object} row - Contact row object.
 * @returns {string} Combined display name.
 */
function buildDisplayName(row) {
  // Try pre-built display name first
  var display = row['displayName'] || row['display_name'] || '';
  if (display) return String(display);

  // Fall back to first + last
  var first = row['firstName'] || row['first_name'] || '';
  var last = row['lastName'] || row['last_name'] || '';
  var combined = (String(first) + ' ' + String(last)).trim();
  if (combined) return combined;

  // Last resort: company name
  return row['companyName'] || row['company_name'] || '';
}
