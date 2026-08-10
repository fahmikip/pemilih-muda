var API_ROUTES = Object.freeze({
  health:{method:'GET',handler:function(){return ApiService.health();}},
  getAppStatus:{method:'GET',handler:function(){return ApiService.getAppStatus();}},
  getSchools:{method:'GET',handler:function(){return SchoolService.getPublicSchools();}},
  getActiveSeason:{method:'GET',handler:function(){return ApiService.getActiveSeason();}},
  getPublicLeaderboard:{method:'GET',handler:function(request){return LeaderboardService.getLeaderboard(request.payload);}},
  getLeaderboard:{method:'GET',handler:function(request){return LeaderboardService.getLeaderboard(request.payload);}},
  getLeaderboardSeasons:{method:'GET',handler:function(){return LeaderboardService.getSeasons();}},
  getSchoolLeaderboard:{method:'GET',handler:function(request){return LeaderboardService.getSchoolLeaderboard(request.payload);}},
  getPublishedWinner:{method:'GET',handler:function(request){return WinnerService.getPublished(request.payload);}},
  getWinnerHistory:{method:'GET',handler:function(request){return WinnerService.history(request.payload);}},
  getPublishedMaterials:{method:'GET',handler:function(){return ApiService.getPublishedMaterials();}},
  getPublishedAnnouncements:{method:'GET',handler:function(){return ApiService.getPublishedAnnouncements();}},
  register:{method:'POST',handler:function(request){return AuthService.register(request.payload,request);}},
  login:{method:'POST',handler:function(request){return AuthService.login(request.payload,request);}},
  logout:{method:'POST',handler:function(request){return AuthService.logout(request.token,request);}},
  getProfile:{method:'POST',handler:function(request){return AuthService.getProfile(request.token);}},
  getQuizStatus:{method:'POST',handler:function(request){return QuizService.getStatus(request.token,request.payload);}},
  startQuiz:{method:'POST',handler:function(request){return QuizService.start(request.token,request.payload,request);}},
  getCurrentQuestion:{method:'POST',handler:function(request){return QuizService.getCurrentQuestion(request.token,request.payload);}},
  submitAnswer:{method:'POST',handler:function(request){return QuizService.submitAnswer(request.token,request.payload);}},
  submitQuiz:{method:'POST',handler:function(request){return QuizService.submitQuiz(request.token,request.payload);}},
  finishQuiz:{method:'POST',handler:function(request){return QuizService.finish(request.token,request.payload);}},
  getQuizResult:{method:'POST',handler:function(request){return QuizService.getResult(request.token,request.payload);}},
  getMySeasonStats:{method:'POST',handler:function(request){return QuizService.getMySeasonStats(request.token,request.payload);}},
  getMyRank:{method:'POST',handler:function(request){return LeaderboardService.getMyRank(request.token,request.payload);}},
  adminGetLeaderboard:{method:'POST',handler:function(request){return LeaderboardService.getAdminLeaderboard(request.token,request.payload);}},
  adminPrepareSeasonFinalization:{method:'POST',handler:function(request){return WinnerService.prepare(request.token,request.payload);}},
  adminDisqualifyCandidate:{method:'POST',handler:function(request){return WinnerService.disqualify(request.token,request.payload);}},
  adminFinalizeWinner:{method:'POST',handler:function(request){return WinnerService.finalize(request.token,request.payload);}},
  adminVerifyWinner:{method:'POST',handler:function(request){return WinnerService.verify(request.token,request.payload);}},
  adminUpdateRewardStatus:{method:'POST',handler:function(request){return WinnerService.updateReward(request.token,request.payload);}},
  adminPublishWinner:{method:'POST',handler:function(request){return WinnerService.publish(request.token,request.payload);}},
  adminGetUsers:{method:'POST',handler:function(request){return AdminService.getUsers(request.token);}},
  adminGetSchools:{method:'POST',handler:function(request){return AdminService.getSchools(request.token);}},
  adminCreateSchool:{method:'POST',handler:function(request){return AdminService.createSchool(request.token,request.payload);}},
  adminUpdateSchool:{method:'POST',handler:function(request){return AdminService.updateSchool(request.token,request.payload);}},
  adminDisableSchool:{method:'POST',handler:function(request){return AdminService.disableSchool(request.token,request.payload);}},
  adminCreateSeason:{method:'POST',handler:function(request){return AdminService.createSeason(request.token,request.payload);}},
  adminCreateQuestion:{method:'POST',handler:function(request){return AdminService.createQuestion(request.token,request.payload);}}
  ,adminDashboardStats:{method:'POST',handler:function(r){return AdminControlService.dashboard(r.token,r.payload);}}
  ,adminListUsers:{method:'POST',handler:function(r){return AdminControlService.users(r.token,r.payload);}}
  ,adminGetUser:{method:'POST',handler:function(r){return AdminControlService.userDetail(r.token,r.payload);}}
  ,adminUpdateUser:{method:'POST',handler:function(r){return AdminControlService.updateUser(r.token,r.payload);}}
  ,adminUpdateUserStatus:{method:'POST',handler:function(r){return AdminControlService.userStatus(r.token,r.payload);}}
  ,adminResetUserPassword:{method:'POST',handler:function(r){return AdminControlService.resetPassword(r.token,r.payload);}}
  ,adminListSchools:{method:'POST',handler:function(r){return AdminControlService.schools(r.token,r.payload);}}
  ,adminSaveSchool:{method:'POST',handler:function(r){return AdminControlService.saveSchool(r.token,r.payload);}}
  ,adminChangeSchoolStatus:{method:'POST',handler:function(r){return AdminControlService.schoolStatus(r.token,r.payload);}}
  ,adminGetSeasons:{method:'POST',handler:function(r){return AdminControlService.seasons(r.token,r.payload);}}
  ,adminUpdateSeason:{method:'POST',handler:function(r){return AdminControlService.updateSeason(r.token,r.payload);}}
  ,adminChangeSeasonStatus:{method:'POST',handler:function(r){return AdminControlService.seasonStatus(r.token,r.payload);}}
  ,adminDuplicateSeason:{method:'POST',handler:function(r){return AdminControlService.duplicateSeason(r.token,r.payload);}}
  ,adminGetQuestions:{method:'POST',handler:function(r){return AdminControlService.questions(r.token,r.payload);}}
  ,adminUpdateQuestion:{method:'POST',handler:function(r){return AdminControlService.updateQuestion(r.token,r.payload);}}
  ,adminChangeQuestionStatus:{method:'POST',handler:function(r){return AdminControlService.questionStatus(r.token,r.payload);}}
  ,adminGetQuizSessions:{method:'POST',handler:function(r){return AdminControlService.quizSessions(r.token,r.payload);}}
  ,adminAdjustPoint:{method:'POST',handler:function(r){return AdminControlService.adjustPoint(r.token,r.payload);}}
  ,adminGetMaterials:{method:'POST',handler:function(r){return AdminControlService.contentList(r.token,r.payload,'material');}}
  ,adminSaveMaterial:{method:'POST',handler:function(r){return AdminControlService.saveContent(r.token,r.payload,'material');}}
  ,adminGetAnnouncements:{method:'POST',handler:function(r){return AdminControlService.contentList(r.token,r.payload,'announcement');}}
  ,adminSaveAnnouncement:{method:'POST',handler:function(r){return AdminControlService.saveContent(r.token,r.payload,'announcement');}}
  ,adminGetFraudLogs:{method:'POST',handler:function(r){return AdminControlService.fraud(r.token,r.payload);}}
  ,adminReviewFraud:{method:'POST',handler:function(r){return AdminControlService.reviewFraud(r.token,r.payload);}}
  ,adminGetActivityLogs:{method:'POST',handler:function(r){return AdminControlService.activity(r.token,r.payload);}}
  ,adminGetRewards:{method:'POST',handler:function(r){return AdminControlService.rewards(r.token,r.payload);}}
  ,adminGetSettings:{method:'POST',handler:function(r){return AdminControlService.settings(r.token,r.payload);}}
  ,adminUpdateSetting:{method:'POST',handler:function(r){return AdminControlService.updateSetting(r.token,r.payload);}}
  ,adminGetAdmins:{method:'POST',handler:function(r){return AdminControlService.admins(r.token,r.payload);}}
  ,adminCreateAdmin:{method:'POST',handler:function(r){return AdminControlService.createAdmin(r.token,r.payload);}}
  ,adminUpdateAdmin:{method:'POST',handler:function(r){return AdminControlService.updateAdmin(r.token,r.payload);}}
  ,adminExportReport:{method:'POST',handler:function(r){return AdminControlService.exportReport(r.token,r.payload);}}
});

function routeRequest_(method,e){
  var request;
  try{
    DatabaseService.beginRequest();
    request=parseApiRequest_(method,e); var route=API_ROUTES[request.action];
    if(!route||route.method!==method)throw new AppError('Action API tidak ditemukan.','API_ACTION_NOT_FOUND');
    return jsonResponse(route.handler(request));
  }catch(error){
    var safe=normalizeApiError_(error); logApiError_(request,safe,error); return jsonResponse(errorResponse(safe.message,safe.code));
  }
}
