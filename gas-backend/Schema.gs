/** Single source of truth for the Phase 2 spreadsheet schema. */
var DATABASE_SCHEMA = Object.freeze({
  Users: ['UserID','Name','NIS','SchoolID','Class','BirthDate','WhatsApp','Email','PasswordHash','PasswordSalt','Role','Status','TotalPointCache','FraudScore','CreatedAt','UpdatedAt','LastLogin'],
  Schools: ['SchoolID','SchoolName','NPSN','Type','Address','District','Status','CreatedAt','UpdatedAt'],
  Seasons: ['SeasonID','Name','Theme','Description','StartDate','EndDate','Status','Reward','QuestionCount','PointPerQuestion','MaxAttempt','QuizDuration','ShowExplanation','CreatedAt','UpdatedAt'],
  Questions: ['QuestionID','Category','Question','OptionA','OptionB','OptionC','OptionD','CorrectAnswer','Explanation','Difficulty','Point','Status','CreatedAt','UpdatedAt'],
  QuizSessions: ['SessionID','UserID','SeasonID','StartedAt','FinishedAt','QuestionIDs','Correct','Wrong','Score','Bonus','TotalPoint','Duration','Attempt','Status','DeviceID','UserAgent','CreatedAt','UpdatedAt'],
  QuizAnswers: ['AnswerID','SessionID','UserID','QuestionID','SelectedAnswer','IsCorrect','Point','AnsweredAt','ResponseTimeMs','Status'],
  PointTransactions: ['PointID','UserID','SeasonID','SourceType','SourceID','Point','Description','Status','CreatedAt','CreatedBy'],
  Achievements: ['AchievementID','Code','Name','Description','Badge','PointBonus','Status','CreatedAt'],
  UserAchievements: ['UserAchievementID','UserID','AchievementID','SeasonID','EarnedAt','PointAwarded'],
  Materials: ['MaterialID','Title','Category','Thumbnail','Content','VideoURL','Status','PublishedAt','CreatedAt','UpdatedAt'],
  Announcements: ['AnnouncementID','Title','Content','Type','Status','StartDate','EndDate','CreatedAt','UpdatedAt'],
  Winners: ['WinnerID','SeasonID','UserID','Rank','Point','CorrectAnswers','QuizCompleted','AverageScore','Reward','Status','SelectedAt','SelectedBy','Notes'],
  Rewards: ['RewardID','SeasonID','WinnerID','RewardName','Nominal','DestinationNumber','Provider','Status','SentAt','Notes','CreatedAt','UpdatedAt'],
  Sessions: ['SessionToken','UserID','Role','CreatedAt','ExpiredAt','LastActivityAt','Status','UserAgent','DeviceID'],
  FraudLogs: ['FraudLogID','UserID','SessionID','Type','Score','Description','Status','CreatedAt','ReviewedAt','ReviewedBy'],
  ActivityLogs: ['LogID','UserID','Action','Entity','EntityID','Description','Device','CreatedAt'],
  Settings: ['Key','Value','Type','Description','UpdatedAt']
});

var DEFAULT_SETTINGS = Object.freeze([
  {Key:'APP_NAME',Value:'Pemilih Muda',Type:'STRING',Description:'Nama aplikasi'},
  {Key:'APP_VERSION',Value:'1.0.0',Type:'STRING',Description:'Versi aplikasi'},
  {Key:'REGISTRATION_OPEN',Value:true,Type:'BOOLEAN',Description:'Status registrasi peserta'},
  {Key:'DEFAULT_QUESTION_POINT',Value:10,Type:'NUMBER',Description:'Poin default jawaban benar'},
  {Key:'QUIZ_MAX_ATTEMPT',Value:1,Type:'NUMBER',Description:'Percobaan quiz per season'},
  {Key:'QUIZ_TIME_LIMIT',Value:1800,Type:'NUMBER',Description:'Batas quiz dalam detik'},
  {Key:'PERFECT_SCORE_BONUS',Value:50,Type:'NUMBER',Description:'Bonus nilai sempurna'},
  {Key:'SHOW_LEADERBOARD',Value:true,Type:'BOOLEAN',Description:'Tampilkan leaderboard peserta'},
  {Key:'SHOW_SCHOOL_RANK',Value:true,Type:'BOOLEAN',Description:'Tampilkan leaderboard sekolah'},
  {Key:'ENABLE_ACHIEVEMENT',Value:true,Type:'BOOLEAN',Description:'Aktifkan achievement'},
  {Key:'MAINTENANCE_MODE',Value:false,Type:'BOOLEAN',Description:'Mode pemeliharaan'},
  {Key:'FRAUD_REVIEW_THRESHOLD',Value:21,Type:'NUMBER',Description:'Ambang review fraud'},
  {Key:'FRAUD_HIGH_RISK_THRESHOLD',Value:51,Type:'NUMBER',Description:'Ambang risiko tinggi'},
  {Key:'SESSION_TTL_SECONDS',Value:86400,Type:'NUMBER',Description:'Masa berlaku session dalam detik'}
]);

var DATABASE_ENUMS = Object.freeze({
  UserRole:['STUDENT','ADMIN','SUPERADMIN'], UserStatus:['ACTIVE','PENDING','SUSPENDED','BLOCKED'],
  SchoolStatus:['ACTIVE','INACTIVE'], SeasonStatus:['DRAFT','SCHEDULED','ACTIVE','FINISHED','ARCHIVED'],
  Difficulty:['EASY','MEDIUM','HARD'], QuestionStatus:['ACTIVE','INACTIVE'],
  QuizStatus:['STARTED','COMPLETED','EXPIRED','INVALID'], PointSource:['QUIZ','BONUS','ACHIEVEMENT','ADMIN','PENALTY'],
  PointStatus:['VALID','INVALID','REVERSED'], RewardStatus:['WAITING','VERIFIED','SENT','COMPLETED','FAILED'],
  SessionStatus:['ACTIVE','EXPIRED','REVOKED']
});
