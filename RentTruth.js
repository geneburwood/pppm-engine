/**
 * RentTruth.js — Script 2: Rent normalization logic.
 * Joins API_UNITS with API_LEASES to determine current rent per unit.
 */

/**
 * Builds normalized rent-truth records for all units.
 * For each unit, finds the active lease (start <= today <= end).
 * If multiple active leases exist, picks the one with the latest start date.
 * Falls back to unit-level rent if no active lease found.
 *
 * @returns {Object[]} Array of normalized unit records with rent info.
 */
function buildRentTruth() {
  var unitsData = getSheetData(SHEETS.API_UNITS);
  var leasesData = getSheetData(SHEETS.API_LEASES);
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Index leases by unitID for fast lookup
  var leasesByUnit = {};
  for (var i = 0; i < leasesData.rows.length; i++) {
    var lease = leasesData.rows[i];
    var unitId = String(lease['lease.unitID'] || lease['unitID'] || lease['unitId'] || lease['unit_id'] || '');
    if (!unitId) continue;

    if (!leasesByUnit[unitId]) {
      leasesByUnit[unitId] = [];
    }
    leasesByUnit[unitId].push(lease);
  }

  var results = [];

  for (var u = 0; u < unitsData.rows.length; u++) {
    var unit = unitsData.rows[u];
    var unitId = String(unit['unit.unitID'] || unit['unitID'] || unit['unitId'] || unit['id'] || '');
    var propertyId = String(unit['unit.propertyID'] || unit['propertyID'] || unit['propertyId'] || unit['property_id'] || '');
    var unitName = unit['unit.name'] || unit['name'] || unit['unitName'] || unit['unit_name'] || '';
    var unitRent = parseFloat(unit['unit.rent'] || unit['rent'] || unit['marketRent'] || unit['market_rent'] || 0);

    // Find active lease for this unit
    var activeLease = findActiveLease(leasesByUnit[unitId] || [], today);

    var currentRent, rentSource, leaseId, leaseStart, leaseEnd;
    if (activeLease) {
      currentRent = parseFloat(activeLease['unit.rent'] || activeLease['rent'] || activeLease['unitRent'] || activeLease['unit_rent'] || 0);
      rentSource = 'lease';
      leaseId = activeLease['lease.leaseID'] || activeLease['leaseID'] || activeLease['leaseId'] || activeLease['id'] || '';
      leaseStart = activeLease['lease.startDate'] || activeLease['leaseStartDate'] || activeLease['startDate'] || activeLease['start_date'] || '';
      leaseEnd = activeLease['lease.endDate'] || activeLease['leaseEndDate'] || activeLease['endDate'] || activeLease['end_date'] || '';
    } else {
      currentRent = unitRent;
      rentSource = 'unit';
      leaseId = '';
      leaseStart = '';
      leaseEnd = '';
    }

    results.push({
      unit_id: unitId,
      property_id: propertyId,
      unit_name: unitName,
      current_rent: currentRent,
      rent_source: rentSource,
      lease_id: leaseId,
      lease_start: leaseStart,
      lease_end: leaseEnd,
      unit_rent_fallback: unitRent
    });
  }

  return results;
}

/**
 * Finds the active lease for a unit as of a given date.
 * Active = leaseStartDate <= date AND (leaseEndDate >= date OR leaseEndDate is blank).
 * If multiple active leases, picks the one with the latest start date.
 *
 * @param {Object[]} leases - Array of lease row objects.
 * @param {Date} asOfDate - Date to check against.
 * @returns {Object|null} The active lease, or null.
 */
function findActiveLease(leases, asOfDate) {
  var active = [];

  for (var i = 0; i < leases.length; i++) {
    var lease = leases[i];
    var startRaw = lease['lease.startDate'] || lease['leaseStartDate'] || lease['startDate'] || lease['start_date'] || '';
    var endRaw = lease['lease.endDate'] || lease['leaseEndDate'] || lease['endDate'] || lease['end_date'] || '';

    var startDate = parseDate(startRaw);
    var endDate = parseDate(endRaw);

    if (!startDate) continue;

    // Blank/null endDate means ongoing lease (no end date set)
    if (startDate <= asOfDate && (!endDate || endDate >= asOfDate)) {
      active.push({ lease: lease, startDate: startDate });
    }
  }

  if (active.length === 0) return null;

  // Pick latest start date
  active.sort(function(a, b) { return b.startDate - a.startDate; });
  return active[0].lease;
}

/**
 * Parses a value into a Date object.
 * Handles Date objects, ISO strings, and common date formats.
 * @param {any} val
 * @returns {Date|null}
 */
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  var d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}
