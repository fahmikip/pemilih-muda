var API_ROUTES = Object.freeze({
  health:{method:'GET',handler:function(){return ApiService.health();}},
  getSchools:{method:'GET',handler:function(){return SchoolService.getPublicSchools();}},
  getActiveSeason:{method:'GET',handler:function(){return ApiService.getActiveSeason();}},
  getPublicLeaderboard:{method:'GET',handler:function(request){return ApiService.getPublicLeaderboard(request);}},
  getPublishedMaterials:{method:'GET',handler:function(){return ApiService.getPublishedMaterials();}},
  getPublishedAnnouncements:{method:'GET',handler:function(){return ApiService.getPublishedAnnouncements();}},
  register:{method:'POST',handler:function(request){return AuthService.register(request.payload,request);}},
  login:{method:'POST',handler:function(request){return AuthService.login(request.payload,request);}},
  logout:{method:'POST',handler:function(request){return AuthService.logout(request.token,request);}},
  getProfile:{method:'POST',handler:function(request){return AuthService.getProfile(request.token);}},
  adminGetUsers:{method:'POST',handler:function(request){return AdminService.getUsers(request.token);}},
  adminGetSchools:{method:'POST',handler:function(request){return AdminService.getSchools(request.token);}},
  adminCreateSchool:{method:'POST',handler:function(request){return AdminService.createSchool(request.token,request.payload);}},
  adminUpdateSchool:{method:'POST',handler:function(request){return AdminService.updateSchool(request.token,request.payload);}},
  adminDisableSchool:{method:'POST',handler:function(request){return AdminService.disableSchool(request.token,request.payload);}},
  adminCreateSeason:{method:'POST',handler:function(request){return AdminService.createSeason(request.token,request.payload);}},
  adminCreateQuestion:{method:'POST',handler:function(request){return AdminService.createQuestion(request.token,request.payload);}},
  startQuiz:{method:'POST',handler:notImplemented_},submitAnswer:{method:'POST',handler:notImplemented_},finishQuiz:{method:'POST',handler:notImplemented_}
});

function routeRequest_(method,e){
  var request;
  try{
    request=parseApiRequest_(method,e); var route=API_ROUTES[request.action];
    if(!route||route.method!==method)throw new AppError('Action API tidak ditemukan.','API_ACTION_NOT_FOUND');
    return jsonResponse(route.handler(request));
  }catch(error){
    var safe=normalizeApiError_(error); logApiError_(request,safe,error); return jsonResponse(errorResponse(safe.message,safe.code));
  }
}

function notImplemented_(){throw new AppError('Endpoint belum tersedia pada fase ini.','API_ACTION_NOT_FOUND');}
