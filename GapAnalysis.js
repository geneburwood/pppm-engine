/**
 * GapAnalysis.js — Script 3: GAP_ANALYSIS builder.
 * Combines rent truth with property addresses and market data
 * to identify underpriced/overpriced units.
 */

/**
 * Builds the GAP_ANALYSIS sheet.
 * Joins rent-truth data with property addresses and RentCast market estimates.
 */
function buildGapAnalysis() {
  var rentTruth = buildRentTruth();

  // Index properties by ID for address lookup
  var propsData = getSheetData(SHEETS.API_PROPERTIES);
  var propsById = {};
  for (var p = 0; p < propsData.rows.length; p++) {
    var prop = propsData.rows[p];
    var propId = String(prop['property.propertyID'] || prop['propertyID'] || prop['propertyId'] || prop['id'] || '');
    if (propId) {
      propsById[propId] = prop;
    }
  }

  // Load RentCast AVM snapshots if available — index latest per unit
  var avmByUnit = loadLatestAvm();

  // Read thresholds from CONFIG
  var underpricedThreshold = Number(getConfig('UNDERPRICED_THRESHOLD')) || 10;
  var overpricedThreshold = Number(getConfig('OVERPRICED_THRESHOLD')) || 10;

  var headerRow = [
    'unit_id',
    'property_id',
    'unit_name',
    'address',
    'city',
    'state',
    'zip',
    'current_rent',
    'rent_source',
    'lease_id',
    'lease_start',
    'lease_end',
    'market_rent_estimate',
    'avm_date',
    'rent_gap_dollar',
    'rent_gap_percent',
    'pricing_status'
  ];

  var dataRows = [];

  for (var i = 0; i < rentTruth.length; i++) {
    var unit = rentTruth[i];
    var prop = propsById[unit.property_id] || {};

    var address = prop['property.address'] || prop['address'] || prop['streetAddress'] || prop['street_address'] || '';
    var city = prop['property.city'] || prop['city'] || '';
    var state = prop['property.stateID'] || prop['state'] || '';
    var zip = prop['property.postalCode'] || prop['zip'] || prop['zipCode'] || prop['zip_code'] || prop['postalCode'] || '';

    // Market rent from RentCast AVM (if available)
    var avm = avmByUnit[unit.unit_id] || null;
    var marketRent = avm ? parseFloat(avm.rentEstimate || 0) : '';
    var avmDate = avm ? (avm.snapshotDate || '') : '';

    // Gap calculations
    var gapDollar = '';
    var gapPercent = '';
    var pricingStatus = '';

    if (marketRent !== '' && marketRent > 0 && unit.current_rent > 0) {
      gapDollar = marketRent - unit.current_rent;
      gapPercent = (gapDollar / marketRent) * 100;
      gapPercent = Math.round(gapPercent * 100) / 100; // round to 2 decimals

      if (gapPercent > underpricedThreshold) {
        pricingStatus = 'UNDERPRICED';
      } else if (gapPercent < -overpricedThreshold) {
        pricingStatus = 'OVERPRICED';
      } else {
        pricingStatus = 'FAIR';
      }
    }

    dataRows.push([
      unit.unit_id,
      unit.property_id,
      unit.unit_name,
      address,
      city,
      state,
      zip,
      unit.current_rent,
      unit.rent_source,
      unit.lease_id,
      unit.lease_start,
      unit.lease_end,
      marketRent,
      avmDate,
      gapDollar,
      gapPercent,
      pricingStatus
    ]);
  }

  writeSheet(SHEETS.GAP_ANALYSIS, headerRow, dataRows);
}

/**
 * Loads the latest RentCast AVM snapshot per unit from RC_AVM_SNAPSHOTS.
 * Returns an object keyed by unit_id.
 * Gracefully returns empty if sheet doesn't exist yet.
 *
 * @returns {Object} Map of unit_id -> { rentEstimate, snapshotDate }
 */
function loadLatestAvm() {
  var avmByUnit = {};

  try {
    var avmData = getSheetData(SHEETS.RC_AVM_SNAPSHOTS);
  } catch (e) {
    // Sheet doesn't exist yet — expected before RentCast integration
    return avmByUnit;
  }

  for (var i = 0; i < avmData.rows.length; i++) {
    var row = avmData.rows[i];
    var unitId = String(row['unit_id'] || row['unitID'] || row['unitId'] || '');
    var rentEstimate = parseFloat(row['rent_estimate'] || row['rentEstimate'] || 0);
    var snapshotDate = row['snapshot_date'] || row['snapshotDate'] || row['created_at'] || '';

    if (!unitId) continue;

    var existing = avmByUnit[unitId];
    if (!existing || parseDate(snapshotDate) > parseDate(existing.snapshotDate)) {
      avmByUnit[unitId] = {
        rentEstimate: rentEstimate,
        snapshotDate: snapshotDate
      };
    }
  }

  return avmByUnit;
}
