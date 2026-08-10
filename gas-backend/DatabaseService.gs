var DatabaseService = (function () {
  var lockDepth = 0;
  var spreadsheetCache = null;
  var sheetCache = {};
  var headersCache = {};
  var rowsCache = {};
  function beginRequest() {
    // Row data is request-scoped. GAS may reuse a warm execution context, so
    // explicitly discard it before routing a new HTTP request.
    rowsCache = {};
  }
  function getSpreadsheet() {
    if (spreadsheetCache) return spreadsheetCache;
    var properties = PropertiesService.getScriptProperties();
    var id = properties.getProperty('DATABASE_SPREADSHEET_ID');
    if (id) {
      try { spreadsheetCache = SpreadsheetApp.openById(id); return spreadsheetCache; }
      catch (error) { throw new Error('DATABASE_SPREADSHEET_ID tidak valid atau tidak dapat diakses: ' + error.message); }
    }
    var spreadsheet = SpreadsheetApp.create(APP_CONFIG.NAME + ' Database');
    properties.setProperty('DATABASE_SPREADSHEET_ID', spreadsheet.getId());
    spreadsheetCache = spreadsheet; return spreadsheetCache;
  }

  function getSheet(sheetName) {
    assertKnownSheet_(sheetName);
    if (sheetCache[sheetName]) return sheetCache[sheetName];
    var sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('Sheet belum tersedia: ' + sheetName + '. Jalankan setupApplication().');
    sheetCache[sheetName] = sheet; return sheet;
  }

  function getHeaders(sheetName) {
    if (headersCache[sheetName]) return headersCache[sheetName].slice();
    var sheet = getSheet(sheetName);
    var lastColumn = sheet.getLastColumn();
    if (!lastColumn) return [];
    headersCache[sheetName] = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) { return String(value).trim(); });
    return headersCache[sheetName].slice();
  }

  function getAllRows(sheetName) {
    if (rowsCache[sheetName]) return rowsCache[sheetName].slice();
    var sheet = getSheet(sheetName);
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) { rowsCache[sheetName] = []; return []; }
    var headers = values[0].map(String);
    rowsCache[sheetName] = values.slice(1).filter(function (row) { return row.some(function (value) { return value !== ''; }); })
      .map(function (row) { return rowToObject_(headers, row); });
    return rowsCache[sheetName].slice();
  }

  function refreshRows(sheetName) { delete rowsCache[sheetName]; return getAllRows(sheetName); }

  function findMany(sheetName, field, value) {
    assertField_(sheetName, field);
    return getAllRows(sheetName).filter(function (row) { return comparable_(row[field]) === comparable_(value); });
  }

  function findOne(sheetName, field, value) { return findMany(sheetName, field, value)[0] || null; }
  function findById(sheetName, idField, idValue) { return findOne(sheetName, idField, idValue); }
  function exists(sheetName, field, value) { return findOne(sheetName, field, value) !== null; }

  function insert(sheetName, object) { return insertMany(sheetName, [object])[0]; }

  function insertMany(sheetName, objects) {
    if (!objects || !objects.length) return [];
    return withScriptLock_(function () {
      var sheet = getSheet(sheetName);
      var headers = getHeaders(sheetName);
      var rows = objects.map(function (object) { return headers.map(function (header) { return normalizeCellValue_(object[header]); }); });
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
      if (rowsCache[sheetName]) rowsCache[sheetName] = rowsCache[sheetName].concat(objects);
      return objects;
    });
  }

  function updateById(sheetName, idField, idValue, data) {
    assertField_(sheetName, idField);
    return withScriptLock_(function () {
      var sheet = getSheet(sheetName);
      var values = sheet.getDataRange().getValues();
      if (!values.length) return false;
      var headers = values[0].map(String);
      var idIndex = headers.indexOf(idField);
      for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
        if (comparable_(values[rowIndex][idIndex]) !== comparable_(idValue)) continue;
        Object.keys(data).forEach(function (field) {
          var columnIndex = headers.indexOf(field);
          if (columnIndex >= 0 && field !== idField) values[rowIndex][columnIndex] = normalizeCellValue_(data[field]);
        });
        sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);
        if (rowsCache[sheetName]) rowsCache[sheetName].forEach(function (row) { if (comparable_(row[idField]) === comparable_(idValue)) Object.keys(data).forEach(function (field) { if (field !== idField && headers.indexOf(field) >= 0) row[field] = normalizeCellValue_(data[field]); }); });
        return true;
      }
      return false;
    });
  }

  function deleteById(sheetName, idField, idValue) {
    assertField_(sheetName, idField);
    return withScriptLock_(function () {
      var sheet = getSheet(sheetName);
      var values = sheet.getDataRange().getValues();
      if (values.length < 2) return false;
      var idIndex = values[0].map(String).indexOf(idField);
      var kept = [values[0]];
      var deleted = false;
      values.slice(1).forEach(function (row) {
        if (!deleted && comparable_(row[idIndex]) === comparable_(idValue)) deleted = true;
        else kept.push(row);
      });
      if (!deleted) return false;
      rewriteData_(sheet, kept);
      delete rowsCache[sheetName];
      return true;
    });
  }

  function replaceRows(sheetName, rows) {
    return withScriptLock_(function () {
      var sheet = getSheet(sheetName);
      var headers = getHeaders(sheetName);
      var values = [headers].concat(rows.map(function (object) {
        return headers.map(function (header) { return normalizeCellValue_(object[header]); });
      }));
      rewriteData_(sheet, values);
      rowsCache[sheetName] = rows.slice();
      return rows.length;
    });
  }

  function rewriteData_(sheet, values) {
    var oldRows = Math.max(sheet.getLastRow(), 1);
    var oldColumns = Math.max(sheet.getLastColumn(), values[0].length);
    sheet.getRange(1, 1, oldRows, oldColumns).clearContent();
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }

  function assertKnownSheet_(sheetName) { if (!DATABASE_SCHEMA[sheetName]) throw new Error('Nama sheet tidak diizinkan: ' + sheetName); }
  function assertField_(sheetName, field) { assertKnownSheet_(sheetName); if (DATABASE_SCHEMA[sheetName].indexOf(field) < 0) throw new Error('Field tidak dikenal: ' + sheetName + '.' + field); }
  function rowToObject_(headers, row) { var result = {}; headers.forEach(function (header, index) { if (header) result[header] = row[index]; }); return result; }
  function comparable_(value) { return String(value === null || value === undefined ? '' : value).trim(); }
  function normalizeCellValue_(value) { return value === undefined || value === null ? '' : value; }
  function withScriptLock_(callback) {
    if (lockDepth > 0) return callback();
    var lock = LockService.getScriptLock(); lock.waitLock(30000); lockDepth++;
    try { return callback(); } finally { lockDepth--; lock.releaseLock(); }
  }

  return Object.freeze({beginRequest:beginRequest,getSpreadsheet:getSpreadsheet,getSheet:getSheet,getHeaders:getHeaders,getAllRows:getAllRows,refreshRows:refreshRows,findById:findById,findOne:findOne,findMany:findMany,insert:insert,insertMany:insertMany,updateById:updateById,deleteById:deleteById,exists:exists,replaceRows:replaceRows,withLock:withScriptLock_});
})();
