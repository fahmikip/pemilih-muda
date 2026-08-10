function setupApplication() {
  return DatabaseService.withLock(function () {
    var summary = {success:false,spreadsheetId:'',createdSheets:[],existingSheets:[],createdSettings:[],warnings:[]};
    var spreadsheet = DatabaseService.getSpreadsheet();
    summary.spreadsheetId = spreadsheet.getId();
    Object.keys(DATABASE_SCHEMA).forEach(function (sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) { sheet=spreadsheet.insertSheet(sheetName); summary.createdSheets.push(sheetName); }
      else summary.existingSheets.push(sheetName);
      ensureHeaders_(sheet, DATABASE_SCHEMA[sheetName], summary.warnings);
    });
    removeEmptyDefaultSheet_(spreadsheet);
    summary.createdSettings = setupDefaultSettings_();
    var adminResult = createInitialAdmin();
    if (adminResult.warning) summary.warnings.push(adminResult.warning);
    var validation = validateDatabaseSchema();
    summary.warnings = summary.warnings.concat(validation.warnings);
    summary.success = validation.valid;
    Logger.log(JSON.stringify(summary, null, 2));
    return summary;
  });
}

function ensureHeaders_(sheet, requiredHeaders, warnings) {
  var lastColumn = sheet.getLastColumn();
  var existing = lastColumn ? sheet.getRange(1,1,1,lastColumn).getValues()[0].map(function (v) { return String(v).trim(); }) : [];
  while (existing.length && existing[existing.length-1] === '') existing.pop();
  var duplicates = existing.filter(function (value,index,array) { return value && array.indexOf(value)!==index; });
  if (duplicates.length) warnings.push(sheet.getName()+': duplicate header ditemukan: '+unique_(duplicates).join(', '));
  var missing = requiredHeaders.filter(function (header) { return existing.indexOf(header)<0; });
  if (!existing.length) sheet.getRange(1,1,1,requiredHeaders.length).setValues([requiredHeaders]);
  else if (missing.length) sheet.getRange(1,existing.length+1,1,missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
}

function setupDefaultSettings_() {
  var existing = DatabaseService.getAllRows('Settings');
  var keys = {};
  existing.forEach(function (row) { keys[String(row.Key)] = true; });
  var now = new Date().toISOString();
  var missing = DEFAULT_SETTINGS.filter(function (setting) { return !keys[setting.Key]; }).map(function (setting) {
    return {Key:setting.Key,Value:setting.Value,Type:setting.Type,Description:setting.Description,UpdatedAt:now};
  });
  if (missing.length) DatabaseService.insertMany('Settings', missing);
  return missing.map(function (setting) { return setting.Key; });
}

function createInitialAdmin() {
  var properties=PropertiesService.getScriptProperties();
  var name=properties.getProperty('INITIAL_ADMIN_NAME');
  var email=properties.getProperty('INITIAL_ADMIN_EMAIL');
  var password=properties.getProperty('INITIAL_ADMIN_PASSWORD');
  if (!name || !email || !password) return {created:false,warning:'Admin awal dilewati: lengkapi INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, dan INITIAL_ADMIN_PASSWORD.'};
  ValidationService.validateEmail(email);
  if (password.length < 12) throw new Error('INITIAL_ADMIN_PASSWORD minimal 12 karakter.');
  if (DatabaseService.findOne('Users','Email',email.toLowerCase())) { properties.deleteProperty('INITIAL_ADMIN_PASSWORD'); return {created:false,reason:'EMAIL_EXISTS'}; }
  var salt=generateSalt(); var now=new Date().toISOString();
  DatabaseService.insert('Users',{UserID:generateId('USR'),Name:name,NIS:'',SchoolID:'',Class:'',BirthDate:'',WhatsApp:'',Email:email.toLowerCase(),PasswordHash:hashPassword(password,salt),PasswordSalt:salt,Role:'SUPERADMIN',Status:'ACTIVE',TotalPointCache:0,FraudScore:0,CreatedAt:now,UpdatedAt:now,LastLogin:''});
  properties.deleteProperty('INITIAL_ADMIN_PASSWORD');
  return {created:true};
}

function validateDatabaseSchema() {
  var report={valid:true,spreadsheetId:'',sheets:{},missingSheets:[],missingSettings:[],warnings:[]};
  var spreadsheet;
  try { spreadsheet=DatabaseService.getSpreadsheet(); report.spreadsheetId=spreadsheet.getId(); }
  catch(error){ report.valid=false; report.warnings.push(error.message); return report; }
  Object.keys(DATABASE_SCHEMA).forEach(function (name) {
    var sheet=spreadsheet.getSheetByName(name);
    if(!sheet){report.valid=false;report.missingSheets.push(name);return;}
    var headers=DatabaseService.getHeaders(name).filter(String);
    var missing=DATABASE_SCHEMA[name].filter(function(h){return headers.indexOf(h)<0;});
    var duplicate=unique_(headers.filter(function(h,i,a){return a.indexOf(h)!==i;}));
    if(missing.length||duplicate.length) report.valid=false;
    report.sheets[name]={valid:!missing.length&&!duplicate.length,missingHeaders:missing,duplicateHeaders:duplicate,rowCount:Math.max(sheet.getLastRow()-1,0)};
  });
  if(!report.missingSheets.length){
    var settingRows=DatabaseService.getAllRows('Settings'); var settingKeys=settingRows.map(function(row){return String(row.Key);});
    report.missingSettings=DEFAULT_SETTINGS.map(function(setting){return setting.Key;}).filter(function(key){return settingKeys.indexOf(key)<0;});
    if(report.missingSettings.length){report.valid=false;report.warnings.push('Default setting tidak lengkap: '+report.missingSettings.join(', '));}
  }
  Logger.log(JSON.stringify(report,null,2));
  return report;
}

function removeEmptyDefaultSheet_(spreadsheet){var sheet=spreadsheet.getSheetByName('Sheet1');if(sheet&&spreadsheet.getSheets().length>1&&sheet.getLastRow()===0)spreadsheet.deleteSheet(sheet);}
function unique_(values){return values.filter(function(value,index,array){return array.indexOf(value)===index;});}
