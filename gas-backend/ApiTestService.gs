/** Manual GAS tests. Requires API_TEST_PASSWORD Script Property; all created IDs contain _TEST_. */
function testHealth(){return ApiService.health();}
function testGetSchools(){return SchoolService.getPublicSchools();}
function testGetActiveSeason(){return ApiService.getActiveSeason();}

function testRegister(){
  var password=requireApiTestPassword_();var schoolId='SCH_TEST_API';
  if(!DatabaseService.findById('Schools','SchoolID',schoolId))DatabaseService.insert('Schools',{SchoolID:schoolId,SchoolName:'Sekolah API Test',NPSN:'99999998',Type:'SMA',Address:'Data test',District:'Test',Status:'ACTIVE',CreatedAt:nowIso_(),UpdatedAt:nowIso_()});
  var existing=DatabaseService.findOne('Users','Email','api.test@pemilihmuda.invalid');if(existing)return successResponse(safeUser_(existing),'User test sudah tersedia.');
  return AuthService.register({name:'API Test User',nis:'1234500001',schoolId:schoolId,'class':'XII',birthDate:'2008-01-01',whatsapp:'081234567899',email:'api.test@pemilihmuda.invalid',password:password},{identifier:'api.test@pemilihmuda.invalid',userAgent:'GAS manual test',deviceId:'TEST'});
}

function testLogin(){testRegister();return AuthService.login({identifier:'api.test@pemilihmuda.invalid',password:requireApiTestPassword_()},{userAgent:'GAS manual test',deviceId:'TEST'});}
function testInvalidLogin(){try{return AuthService.login({identifier:'api.test@pemilihmuda.invalid',password:'definitely-wrong-password'},{userAgent:'GAS manual test',deviceId:'TEST'});}catch(error){var safe=normalizeApiError_(error);return errorResponse(safe.message,safe.code);}}
function testSession(){var login=testLogin();var auth=requireAuth(login.data.token);SessionService.revokeSession(login.data.token);return successResponse({validatedUserId:auth.user.UserID,revoked:true},'Session test berhasil.');}

function clearApiTestData(){return DatabaseService.withLock(function(){
  var testUsers=DatabaseService.getAllRows('Users').filter(function(row){return String(row.Email).indexOf('api.test@pemilihmuda.invalid')>=0||String(row.UserID).indexOf('_TEST_')>=0;});var userIds=testUsers.map(function(row){return row.UserID;});var removed={};
  removed.Sessions=filterApiTestRows_('Sessions',function(row){return userIds.indexOf(row.UserID)<0;});
  removed.ActivityLogs=filterApiTestRows_('ActivityLogs',function(row){return userIds.indexOf(row.UserID)<0&&String(row.Device)!=='GAS manual test';});
  removed.Users=filterApiTestRows_('Users',function(row){return userIds.indexOf(row.UserID)<0;});
  removed.Schools=filterApiTestRows_('Schools',function(row){return String(row.SchoolID).indexOf('SCH_TEST_')!==0;});
  return successResponse(removed,'Data API test dibersihkan.');
});}

function filterApiTestRows_(sheetName,predicate){var rows=DatabaseService.getAllRows(sheetName),kept=rows.filter(predicate),removed=rows.length-kept.length;if(removed)DatabaseService.replaceRows(sheetName,kept);return removed;}
function requireApiTestPassword_(){var value=PropertiesService.getScriptProperties().getProperty('API_TEST_PASSWORD');if(!value||value.length<12)throw new Error('API_TEST_PASSWORD Script Property minimal 12 karakter diperlukan.');return value;}
