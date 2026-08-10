var PointService=(function(){
  function awardQuiz(userId,season,quizSession,quizPoint,bonus){
    if(!DatabaseService.getAllRows('PointTransactions').some(function(row){return row.SourceType==='QUIZ'&&row.SourceID===quizSession.SessionID&&row.Status==='VALID';}))DatabaseService.insert('PointTransactions',{PointID:generateId('PNT'),UserID:userId,SeasonID:season.SeasonID,SourceType:'QUIZ',SourceID:quizSession.SessionID,Point:quizPoint,Description:'Challenge '+season.Name,Status:'VALID',CreatedAt:nowIso_(),CreatedBy:'SYSTEM'});
    if(bonus>0&&!DatabaseService.getAllRows('PointTransactions').some(function(row){return row.SourceType==='BONUS'&&row.SourceID===quizSession.SessionID&&row.Status==='VALID';}))DatabaseService.insert('PointTransactions',{PointID:generateId('PNT'),UserID:userId,SeasonID:season.SeasonID,SourceType:'BONUS',SourceID:quizSession.SessionID,Point:bonus,Description:'Bonus nilai sempurna '+season.Name,Status:'VALID',CreatedAt:nowIso_(),CreatedBy:'SYSTEM'});
    return recalculateUserTotalPoint(userId);
  }
  function recalculateUserTotalPoint(userId){var total=DatabaseService.getAllRows('PointTransactions').filter(function(row){return row.UserID===userId&&row.Status==='VALID';}).reduce(function(sum,row){return sum+Number(row.Point||0);},0);DatabaseService.updateById('Users','UserID',userId,{TotalPointCache:total,UpdatedAt:nowIso_()});return total;}
  function getSeasonPoint(userId,seasonId){return DatabaseService.getAllRows('PointTransactions').filter(function(row){return row.UserID===userId&&row.SeasonID===seasonId&&row.Status==='VALID';}).reduce(function(sum,row){return sum+Number(row.Point||0);},0);}
  return Object.freeze({awardQuiz:awardQuiz,recalculateUserTotalPoint:recalculateUserTotalPoint,getSeasonPoint:getSeasonPoint});
})();
