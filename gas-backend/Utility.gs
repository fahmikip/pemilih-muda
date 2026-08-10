function jsonResponse(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function successResponse(data,message){return{success:true,message:message||'Success',data:data===undefined?{}:data};}
function errorResponse(message,code){return{success:false,message:message||'Terjadi kesalahan.',code:code||'INTERNAL_ERROR'};}
function jsonOutput_(value){return jsonResponse(value);}

function AppError(message,code){this.name='AppError';this.message=message;this.code=code||'INTERNAL_ERROR';}
AppError.prototype=Object.create(Error.prototype);AppError.prototype.constructor=AppError;

function normalizeApiError_(error){
  if(error&&error.name==='AppError')return{message:error.message,code:error.code};
  var message=String(error&&error.message||'');
  if(/wajib|tidak valid|maksimal|minimal|harus/i.test(message))return{message:message,code:'VALIDATION_ERROR'};
  if(/sheet|spreadsheet|database/i.test(message))return{message:'Database tidak tersedia.','code':'DATABASE_ERROR'};
  return{message:'Terjadi kesalahan pada server.',code:'INTERNAL_ERROR'};
}

function parseApiRequest_(method,e){
  var parameters=(e&&e.parameter)||{};var raw={};
  if(method==='POST'&&e&&e.postData&&e.postData.contents){
    var type=String(e.postData.type||'').toLowerCase();
    if(type.indexOf('application/json')>=0||type.indexOf('text/plain')>=0){try{raw=JSON.parse(e.postData.contents)||{};}catch(ignore){throw new AppError('Body JSON tidak valid.','INVALID_REQUEST');}}
  }
  var action=sanitizeText_(parameters.action||raw.action||'',64,'action');
  if(!action)throw new AppError('Parameter action wajib diisi.','INVALID_REQUEST');
  var payload=raw.payload||parameters.payload||{};
  if(typeof payload==='string'){if(payload.length>APP_CONFIG.MAX_BODY_LENGTH)throw new AppError('Payload terlalu besar.','INVALID_REQUEST');try{payload=JSON.parse(payload)||{};}catch(ignore2){throw new AppError('Payload JSON tidak valid.','INVALID_REQUEST');}}
  if(Object.prototype.toString.call(payload)!=='[object Object]')throw new AppError('Payload harus berupa object.','INVALID_REQUEST');
  return{method:method,action:action,payload:payload,token:String(parameters.token||raw.token||payload.token||'').trim(),identifier:sanitizeText_(parameters.identifier||raw.identifier||'',160,'identifier'),userAgent:sanitizeText_((e&&e.parameter&&e.parameter.userAgent)||payload.userAgent||'',500,'userAgent'),deviceId:sanitizeText_(payload.deviceId||'',120,'deviceId')};
}

function sanitizeText_(value,maxLength,field){var text=String(value===undefined||value===null?'':value).replace(/[\u0000-\u001F\u007F]/g,'').trim();if(text.length>(maxLength||500))throw new AppError((field||'Input')+' melebihi panjang maksimal.','VALIDATION_ERROR');return text;}
function rejectFormula_(value,maxLength,field){var text=sanitizeText_(value,maxLength||5000,field);if(/^[=+\-@]/.test(text))throw new AppError((field||'Input')+' tidak valid.','VALIDATION_ERROR');return text;}
function nowIso_(){return new Date().toISOString();}
function getSetting_(key,fallback){var row=DatabaseService.findOne('Settings','Key',key);if(!row)return fallback;if(row.Type==='BOOLEAN')return row.Value===true||String(row.Value).toLowerCase()==='true';if(row.Type==='NUMBER')return Number(row.Value);return row.Value;}

function rateLimit_(scope,identifier,maxRequests,windowSeconds){var key='rate:'+scope+':'+sha256Hex_(String(identifier).toLowerCase()).slice(0,24);var cache=CacheService.getScriptCache();var count=Number(cache.get(key)||0);if(count>=maxRequests)throw new AppError('Terlalu banyak permintaan. Coba lagi beberapa menit.','RATE_LIMITED');cache.put(key,String(count+1),windowSeconds);}
function sha256Hex_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(function(byte){var v=byte<0?byte+256:byte;return('0'+v.toString(16)).slice(-2);}).join('');}
function safeUser_(user){return{UserID:user.UserID,Name:user.Name,SchoolID:user.SchoolID,Role:user.Role,Status:user.Status};}
function logActivity_(userId,action,entity,entityId,description,device){try{DatabaseService.insert('ActivityLogs',{LogID:generateId('LOG'),UserID:userId||'',Action:action,Entity:entity||'',EntityID:entityId||'',Description:sanitizeText_(description||'',500,'description'),Device:sanitizeText_(device||'',500,'device'),CreatedAt:nowIso_()});}catch(error){console.error('Activity log failed: '+error.message);}}
function logApiError_(request,safe,original){console.error('API error ['+safe.code+']: '+String(original&&original.message||safe.message));if(request)logActivity_('','API_ERROR','API',request.action,safe.code,'');}

function generateId(prefix) {
  if (!/^[A-Z]{3}$/.test(String(prefix))) throw new Error('Prefix ID harus tiga huruf kapital.');
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}
