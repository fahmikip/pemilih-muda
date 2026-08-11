const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const sheetMetrics = { reads: 0, writes: 0, writeSheets: {} };
class Range {
  constructor(sheet, row, col, rows, cols) {
    Object.assign(this, { sheet, row, col, rows, cols });
  }
  getValues() {
    sheetMetrics.reads++;
    const out = [];
    for (let r = 0; r < this.rows; r++) {
      const line = [];
      for (let c = 0; c < this.cols; c++)
        line.push(this.sheet.cells[this.row - 1 + r]?.[this.col - 1 + c] ?? "");
      out.push(line);
    }
    return out;
  }
  setValues(values) {
    sheetMetrics.writes++;
    sheetMetrics.writeSheets[this.sheet.name] =
      (sheetMetrics.writeSheets[this.sheet.name] || 0) + 1;
    for (let r = 0; r < this.rows; r++) {
      this.sheet.cells[this.row - 1 + r] ??= [];
      for (let c = 0; c < this.cols; c++)
        this.sheet.cells[this.row - 1 + r][this.col - 1 + c] = values[r][c];
    }
    return this;
  }
  clearContent() {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.sheet.cells[this.row - 1 + r])
          this.sheet.cells[this.row - 1 + r][this.col - 1 + c] = "";
    return this;
  }
}
class Sheet {
  constructor(name) {
    this.name = name;
    this.cells = [];
  }
  getName() {
    return this.name;
  }
  getLastRow() {
    let last = 0;
    this.cells.forEach((row, i) => {
      if (row.some((v) => v !== "" && v !== undefined)) last = i + 1;
    });
    return last;
  }
  getLastColumn() {
    let last = 0;
    this.cells.forEach((row) =>
      row.forEach((v, i) => {
        if (v !== "" && v !== undefined) last = Math.max(last, i + 1);
      }),
    );
    return last;
  }
  getRange(r, c, rows = 1, cols = 1) {
    return new Range(this, r, c, rows, cols);
  }
  getDataRange() {
    return this.getRange(
      1,
      1,
      Math.max(this.getLastRow(), 1),
      Math.max(this.getLastColumn(), 1),
    );
  }
  setFrozenRows() {}
}
class Spreadsheet {
  constructor(id) {
    this.id = id;
    this.sheets = [new Sheet("Sheet1")];
  }
  getId() {
    return this.id;
  }
  getSheetByName(name) {
    return this.sheets.find((s) => s.name === name) || null;
  }
  insertSheet(name) {
    const s = new Sheet(name);
    this.sheets.push(s);
    return s;
  }
  getSheets() {
    return this.sheets;
  }
  deleteSheet(sheet) {
    this.sheets = this.sheets.filter((s) => s !== sheet);
  }
}
const propertyData = {};
const books = {};
let uuidCounter = 0;
const lock = { waitLock() {}, releaseLock() {} };
const cacheData = {};
const context = {
  console,
  Date,
  JSON,
  Object,
  String,
  Number,
  RegExp,
  Error,
  Math,
  Logger: { log() {} },
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty: (k) => propertyData[k] || null,
        setProperty: (k, v) => (propertyData[k] = String(v)),
        deleteProperty: (k) => delete propertyData[k],
      };
    },
  },
  SpreadsheetApp: {
    create() {
      const id = "db-" + Object.keys(books).length;
      return (books[id] = new Spreadsheet(id));
    },
    openById(id) {
      if (!books[id]) throw Error("not found");
      return books[id];
    },
  },
  LockService: { getScriptLock: () => lock },
  CacheService: {
    getScriptCache() {
      return {
        get: (k) => cacheData[k] || null,
        put: (k, v) => (cacheData[k] = v),
        remove: (k) => delete cacheData[k],
      };
    },
  },
  Utilities: {
    Charset: { UTF_8: "utf8" },
    DigestAlgorithm: { SHA_256: "sha256" },
    getUuid() {
      return (++uuidCounter)
        .toString(16)
        .padEnd(32, "0")
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
    },
    computeDigest(algorithm, value) {
      const input = Array.isArray(value)
        ? Buffer.from(value.map((v) => (v < 0 ? v + 256 : v)))
        : Buffer.from(String(value), "utf8");
      return [...crypto.createHash(algorithm).update(input).digest()].map(
        (v) => (v > 127 ? v - 256 : v),
      );
    },
  },
  ContentService: {
    MimeType: { JSON: "json" },
    createTextOutput(value) {
      return {
        value,
        setMimeType() {
          return this;
        },
      };
    },
  },
};
vm.createContext(context);
const order = [
  "Config.gs",
  "Schema.gs",
  "Utility.gs",
  "ValidationService.gs",
  "SecurityService.gs",
  "DatabaseService.gs",
  "SetupService.gs",
  "DemoDataService.gs",
  "SessionService.gs",
  "AuthService.gs",
  "SchoolService.gs",
  "ApiService.gs",
    "LeaderboardService.gs",
    "WinnerService.gs",
  "PointService.gs",
  "QuizService.gs",
  "AdminService.gs",
  "AdminControlService.gs",
  "EducationContentService.gs",
  "Router.gs",
];
for (const file of order)
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "gas-backend", file), "utf8"),
    context,
    { filename: file },
  );
propertyData.INITIAL_ADMIN_NAME = "Admin Demo";
propertyData.INITIAL_ADMIN_EMAIL = "admin@example.test";
propertyData.INITIAL_ADMIN_PASSWORD = "SangatRahasia123!";
const first = context.setupApplication();
assert.equal(first.success, true);
assert.equal(first.createdSheets.length, 17);
assert.equal(first.createdSettings.length, 14);
assert.ok(propertyData.DATABASE_SPREADSHEET_ID);
assert.equal(propertyData.INITIAL_ADMIN_PASSWORD, undefined);
assert.equal(context.DatabaseService.getAllRows("Users").length, 1);
assert.notEqual(
  context.DatabaseService.getAllRows("Users")[0].PasswordHash,
  "SangatRahasia123!",
);
const firstId = first.spreadsheetId;
const second = context.setupApplication();
assert.equal(second.success, true);
assert.equal(second.spreadsheetId, firstId);
assert.equal(second.createdSheets.length, 0);
assert.equal(second.createdSettings.length, 0);
assert.equal(context.DatabaseService.getAllRows("Users").length, 1);
const seeded = context.seedDemoData();
assert.deepEqual(JSON.parse(JSON.stringify(seeded.created)), {
  Schools: 5,
  Questions: 30,
  Seasons: 1,
  Materials: 5,
  Announcements: 3,
});
const reseeded = context.seedDemoData();
assert.ok(Object.values(reseeded.created).every((v) => v === 0));
assert.equal(context.validateDatabaseSchema().valid, true);
context.DatabaseService.insert("Schools", {
  SchoolID: "SCH_production01",
  SchoolName: "Production",
});
const cleared = context.clearDemoData();
assert.equal(cleared.removed.Questions, 30);
assert.equal(context.DatabaseService.getAllRows("Schools").length, 1);
assert.equal(
  context.DatabaseService.getAllRows("Schools")[0].SchoolID,
  "SCH_production01",
);
const salt = context.generateSalt(),
  hash = context.hashPassword("password-ku", salt);
assert.equal(context.verifyPassword("password-ku", salt, hash), true);
assert.equal(context.verifyPassword("salah", salt, hash), false);
console.log("Phase 2 tests passed.");
function call(method, action, payload = {}, token = "") {
  const e = {
    parameter: { action, payload: JSON.stringify(payload), token },
    postData: { type: "application/x-www-form-urlencoded", contents: "" },
  };
  return JSON.parse(context.routeRequest_(method, e).value);
}
const health = call("GET", "health");
assert.equal(health.success, true);
assert.equal(health.data.database, true);
const adminLogin = call("POST", "login", {
  identifier: "admin@example.test",
  password: "SangatRahasia123!",
});
assert.equal(adminLogin.success, true);
assert.ok(adminLogin.data.token);
assert.equal(JSON.stringify(adminLogin).includes("PasswordHash"), false);
const adminToken = adminLogin.data.token;
const school = call(
  "POST",
  "adminCreateSchool",
  {
    schoolName: "SMAN API Test",
    npsn: "99123456",
    type: "SMA",
    district: "Test",
  },
  adminToken,
);
assert.equal(school.success, true);
const registration = call("POST", "register", {
  name: "Siswa Test",
  nis: "1234567890",
  schoolId: school.data.SchoolID,
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567890",
  email: "siswa@example.test",
  password: "Rahasia123!",
});
assert.equal(registration.success, true);
assert.equal(registration.data.Role, "STUDENT");
const duplicate = call("POST", "register", {
  name: "Duplikat",
  nis: "1234567890",
  schoolId: school.data.SchoolID,
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567890",
  email: "beda@example.test",
  password: "Rahasia123!",
});
assert.equal(duplicate.code, "DUPLICATE_NIS");
const studentLogin = call("POST", "login", {
  identifier: "siswa@example.test",
  password: "Rahasia123!",
});
assert.equal(studentLogin.success, true);
const studentToken = studentLogin.data.token;
const profile = call("POST", "getProfile", {}, studentToken);
assert.equal(profile.success, true);
assert.equal(
  Object.prototype.hasOwnProperty.call(profile.data, "FraudScore"),
  false,
);
assert.equal(JSON.stringify(profile).includes("PasswordSalt"), false);
const forbidden = call("POST", "adminGetUsers", {}, studentToken);
assert.equal(forbidden.code, "FORBIDDEN", JSON.stringify(forbidden));
const users = call("POST", "adminGetUsers", {}, adminToken);
assert.equal(users.success, true);
assert.equal(JSON.stringify(users).includes("PasswordHash"), false);
context.seedDemoData();
context.DatabaseService.updateById("Seasons", "SeasonID", "SEA_DEMO_202608", {
  QuestionCount: 31,
  MaxAttempt: 1,
  QuizDuration: 1800,
  ShowExplanation: true,
});
assert.equal(
  call("POST", "startQuiz", { seasonId: "SEA_DEMO_202608" }, studentToken).code,
  "INSUFFICIENT_QUESTIONS",
);
context.DatabaseService.updateById("Seasons", "SeasonID", "SEA_DEMO_202608", {
  QuestionCount: 5,
});
const quizStatus = call(
  "POST",
  "getQuizStatus",
  { seasonId: "SEA_DEMO_202608" },
  studentToken,
);
assert.equal(quizStatus.data.canStart, true);
const started = call(
  "POST",
  "startQuiz",
  { seasonId: "SEA_DEMO_202608" },
  studentToken,
);
assert.equal(started.success, true);
assert.equal(started.data.totalQuestions, 5);
assert.equal(JSON.stringify(started).includes("CorrectAnswer"), false);
const quizId = started.data.quizSessionId;
const resumed = call(
  "POST",
  "startQuiz",
  { seasonId: "SEA_DEMO_202608" },
  studentToken,
);
assert.equal(resumed.data.quizSessionId, quizId);
assert.equal(
  context.DatabaseService.getAllRows("QuizSessions").filter(
    (r) => r.UserID === registration.data.UserID,
  ).length,
  1,
);
assert.deepEqual(resumed.data.questions, started.data.questions);
assert.equal(
  call(
    "POST",
    "submitAnswer",
    {
      quizSessionId: quizId,
      questionId: "QUE_NOT_IN_SESSION",
      selectedOption: "fake",
      point: 999999,
    },
    studentToken,
  ).code,
  "QUESTION_NOT_IN_SESSION",
);
let current = started.data.question;
assert.equal(
  call(
    "POST",
    "submitAnswer",
    {
      quizSessionId: quizId,
      questionId: current.questionId,
      selectedOption: "opt_manipulated",
    },
    studentToken,
  ).code,
  "INVALID_OPTION",
);
let firstOption = current.options[0].id;
let answer = call(
  "POST",
  "submitAnswer",
  {
    quizSessionId: quizId,
    questionId: current.questionId,
    selectedOption: firstOption,
    point: 999999,
    correct: 999,
  },
  studentToken,
);
assert.equal(answer.success, true);
assert.equal(
  call(
    "POST",
    "submitAnswer",
    {
      quizSessionId: quizId,
      questionId: current.questionId,
      selectedOption: firstOption,
    },
    studentToken,
  ).code,
  "QUESTION_ALREADY_ANSWERED",
);
while (!answer.data.completed) {
  current = answer.data.nextQuestion;
  assert.ok(current);
  answer = call(
    "POST",
    "submitAnswer",
    {
      quizSessionId: quizId,
      questionId: current.questionId,
      selectedOption: current.options[0].id,
      totalPoint: 999999,
    },
    studentToken,
  );
}
const quizResult = answer.data.result;
assert.equal(quizResult.correct + quizResult.wrong, 5);
assert.ok(quizResult.point <= 100);
context.DatabaseService.replaceRows(
  "PointTransactions",
  context.DatabaseService.getAllRows("PointTransactions").filter(
    (r) => r.SourceID !== quizId,
  ),
);
context.PointService.recalculateUserTotalPoint(registration.data.UserID);
const finishAgain = call(
  "POST",
  "finishQuiz",
  { quizSessionId: quizId, score: 100, totalPoint: 999999 },
  studentToken,
);
assert.equal(finishAgain.success, true);
assert.equal(finishAgain.data.point, quizResult.point);
assert.equal(
  context.DatabaseService.getAllRows("PointTransactions").filter(
    (r) =>
      r.SourceType === "QUIZ" && r.SourceID === quizId && r.Status === "VALID",
  ).length,
  1,
);
const finishThird = call(
  "POST",
  "finishQuiz",
  { quizSessionId: quizId },
  studentToken,
);
assert.equal(finishThird.success, true);
assert.equal(
  context.DatabaseService.getAllRows("PointTransactions").filter(
    (r) =>
      r.SourceType === "QUIZ" && r.SourceID === quizId && r.Status === "VALID",
  ).length,
  1,
);
const stats = call(
  "POST",
  "getMySeasonStats",
  { seasonId: "SEA_DEMO_202608" },
  studentToken,
);
assert.equal(stats.data.quizCompleted, 1);
assert.equal(stats.data.seasonPoint, quizResult.point);
const completedStart = call(
  "POST",
  "startQuiz",
  { seasonId: "SEA_DEMO_202608" },
  studentToken,
);
assert.equal(completedStart.success, true);
assert.equal(completedStart.data.completed, true);
assert.equal(completedStart.data.result.quizSessionId, quizId);
const registration2 = call("POST", "register", {
  name: "Siswa Expired",
  nis: "1234567891",
  schoolId: "SCH_DEMO_01",
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567891",
  email: "expired@example.test",
  password: "Rahasia123!",
});
const login2 = call("POST", "login", {
  identifier: "expired@example.test",
  password: "Rahasia123!",
});
const token2 = login2.data.token;
context.DatabaseService.updateById("Seasons", "SeasonID", "SEA_DEMO_202608", {
  ShowExplanation: false,
});
const started2 = call(
  "POST",
  "startQuiz",
  { seasonId: "SEA_DEMO_202608" },
  token2,
);
const hiddenFeedback = call(
  "POST",
  "submitAnswer",
  {
    quizSessionId: started2.data.quizSessionId,
    questionId: started2.data.question.questionId,
    selectedOption: started2.data.question.options[0].id,
  },
  token2,
);
assert.equal(
  Object.prototype.hasOwnProperty.call(hiddenFeedback.data.result, "isCorrect"),
  false,
);
assert.equal(
  Object.prototype.hasOwnProperty.call(
    hiddenFeedback.data.result,
    "correctAnswer",
  ),
  false,
);
assert.ok(hiddenFeedback.data.nextQuestion);
context.DatabaseService.updateById(
  "QuizSessions",
  "SessionID",
  started2.data.quizSessionId,
  { StartedAt: new Date(Date.now() - 1900 * 1000).toISOString() },
);
assert.equal(
  call(
    "POST",
    "getCurrentQuestion",
    { quizSessionId: started2.data.quizSessionId },
    token2,
  ).code,
  "QUIZ_SESSION_EXPIRED",
);
assert.equal(
  context.DatabaseService.findById(
    "QuizSessions",
    "SessionID",
    started2.data.quizSessionId,
  ).Status,
  "EXPIRED",
);
context.DatabaseService.updateById("Seasons", "SeasonID", "SEA_DEMO_202608", {
  QuestionCount: 25,
  ShowExplanation: true,
  QuizDuration: 1800,
});
call("POST", "register", {
  name: "Siswa Performance",
  nis: "1234567892",
  schoolId: "SCH_DEMO_01",
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567892",
  email: "performance@example.test",
  password: "Rahasia123!",
});
const performanceLogin = call("POST", "login", {
    identifier: "performance@example.test",
    password: "Rahasia123!",
  }),
  performanceToken = performanceLogin.data.token,
  performanceStart = call(
    "POST",
    "startQuiz",
    { seasonId: "SEA_DEMO_202608" },
    performanceToken,
  );
let performanceQuestion = performanceStart.data.question,
  performanceAnswer = null,
  latencies = [];
sheetMetrics.reads = 0;
sheetMetrics.writes = 0;
for (let i = 0; i < 25; i++) {
  const before = Date.now();
  performanceAnswer = call(
    "POST",
    "submitAnswer",
    {
      quizSessionId: performanceStart.data.quizSessionId,
      questionId: performanceQuestion.questionId,
      selectedOption: performanceQuestion.options[0].id,
    },
    performanceToken,
  );
  latencies.push(Date.now() - before);
  if (i < 24) {
    assert.ok(performanceAnswer.data.nextQuestion);
    performanceQuestion = performanceAnswer.data.nextQuestion;
  }
}
assert.equal(performanceAnswer.data.completed, true);
assert.equal(
  context.DatabaseService.getAllRows("QuizAnswers").filter(
    (r) => r.SessionID === performanceStart.data.quizSessionId,
  ).length,
  25,
);
const average = Math.round(
  latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
);
console.log(
  `Phase 5 performance (mock, 25 submits): avg=${average}ms min=${Math.min(...latencies)}ms max=${Math.max(...latencies)}ms sheetReads=${sheetMetrics.reads} sheetWrites=${sheetMetrics.writes}`,
);
console.log("Phase 5 quiz engine tests passed.");
context.DatabaseService.updateById("Seasons", "SeasonID", "SEA_DEMO_202608", {
  QuestionCount: 25,
  ShowExplanation: true,
  QuizDuration: 1800,
  MaxAttempt: 1,
});
call("POST", "register", {
  name: "Siswa Batch",
  nis: "1234567893",
  schoolId: "SCH_DEMO_01",
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567893",
  email: "batch@example.test",
  password: "Rahasia123!",
});
const batchLogin = call("POST", "login", {
    identifier: "batch@example.test",
    password: "Rahasia123!",
  }),
  batchToken = batchLogin.data.token,
  batchStart = call(
    "POST",
    "startQuiz",
    { seasonId: "SEA_DEMO_202608" },
    batchToken,
  ),
  batchId = batchStart.data.quizSessionId;
assert.equal(batchStart.data.questions.length, 25);
assert.equal(
  JSON.stringify(batchStart.data.questions).includes("CorrectAnswer"),
  false,
);
assert.equal(
  JSON.stringify(batchStart.data.questions).includes("Explanation"),
  false,
);
assert.ok(
  batchStart.data.questions.every((q) =>
    q.options.every(
      (o) =>
        /^opt_[a-f0-9]{16}$/.test(o.id) &&
        !Object.prototype.hasOwnProperty.call(o, "letter"),
    ),
  ),
);
const batchPayload = batchStart.data.questions.map((q) => ({
  questionId: q.questionId,
  selectedOptionId: q.options[0].id,
}));
assert.equal(
  call(
    "POST",
    "submitQuiz",
    {
      quizSessionId: batchId,
      answers: [{ questionId: "QUE_OUTSIDE", selectedOptionId: "opt_fake" }],
    },
    batchToken,
  ).code,
  "QUESTION_NOT_IN_SESSION",
);
assert.equal(
  call(
    "POST",
    "submitQuiz",
    {
      quizSessionId: batchId,
      answers: [
        {
          questionId: batchPayload[0].questionId,
          selectedOptionId: "opt_modified",
        },
      ],
    },
    batchToken,
  ).code,
  "INVALID_OPTION",
);
assert.equal(
  call(
    "POST",
    "submitQuiz",
    { quizSessionId: batchId, answers: [batchPayload[0], batchPayload[0]] },
    batchToken,
  ).code,
  "DUPLICATE_ANSWER",
);
assert.equal(
  call(
    "POST",
    "submitQuiz",
    { quizSessionId: batchId, answers: batchPayload },
    token2,
  ).code,
  "QUIZ_SESSION_NOT_FOUND",
);
sheetMetrics.reads = 0;
sheetMetrics.writes = 0;
sheetMetrics.writeSheets = {};
const batchBefore = Date.now(),
  batchSubmit = call(
    "POST",
    "submitQuiz",
    {
      quizSessionId: batchId,
      answers: batchPayload,
      score: 100,
      point: 999999,
      totalPoint: 999999,
    },
    batchToken,
  ),
  batchLatency = Date.now() - batchBefore;
assert.equal(batchSubmit.success, true);
assert.equal(batchSubmit.data.completed, true);
assert.equal(
  batchSubmit.data.result.correct + batchSubmit.data.result.wrong,
  25,
);
assert.equal(sheetMetrics.writeSheets.QuizAnswers, 1);
assert.equal(
  context.DatabaseService.getAllRows("QuizAnswers").filter(
    (r) => r.SessionID === batchId,
  ).length,
  25,
);
const batchTransactions = context.DatabaseService.getAllRows(
  "PointTransactions",
).filter(
  (r) =>
    r.SourceType === "QUIZ" && r.SourceID === batchId && r.Status === "VALID",
).length;
const batchAgain = call(
  "POST",
  "submitQuiz",
  { quizSessionId: batchId, answers: batchPayload },
  batchToken,
);
assert.equal(batchAgain.success, true);
assert.equal(
  context.DatabaseService.getAllRows("QuizAnswers").filter(
    (r) => r.SessionID === batchId,
  ).length,
  25,
);
assert.equal(
  context.DatabaseService.getAllRows("PointTransactions").filter(
    (r) =>
      r.SourceType === "QUIZ" && r.SourceID === batchId && r.Status === "VALID",
  ).length,
  batchTransactions,
);
console.log(
  `Phase 6 batch quiz (25 answers): ${batchLatency}ms sheetReads=${sheetMetrics.reads} sheetWrites=${sheetMetrics.writes}`,
);
call("POST", "register", {
  name: "Siswa Kosong",
  nis: "1234567894",
  schoolId: "SCH_DEMO_01",
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567894",
  email: "blank@example.test",
  password: "Rahasia123!",
});
const blankToken = call("POST", "login", {
    identifier: "blank@example.test",
    password: "Rahasia123!",
  }).data.token,
  blankStart = call(
    "POST",
    "startQuiz",
    { seasonId: "SEA_DEMO_202608" },
    blankToken,
  ),
  blankSubmit = call(
    "POST",
    "submitQuiz",
    { quizSessionId: blankStart.data.quizSessionId, answers: [] },
    blankToken,
  );
assert.equal(blankSubmit.success, true);
assert.equal(blankSubmit.data.result.correct, 0);
assert.equal(blankSubmit.data.result.wrong, 25);
call("POST", "register", {
  name: "Siswa Batch Expired",
  nis: "1234567895",
  schoolId: "SCH_DEMO_01",
  class: "XII",
  birthDate: "2008-01-02",
  whatsapp: "081234567895",
  email: "batch-expired@example.test",
  password: "Rahasia123!",
});
const batchExpiredToken = call("POST", "login", {
    identifier: "batch-expired@example.test",
    password: "Rahasia123!",
  }).data.token,
  batchExpiredStart = call(
    "POST",
    "startQuiz",
    { seasonId: "SEA_DEMO_202608" },
    batchExpiredToken,
  );
context.DatabaseService.updateById(
  "QuizSessions",
  "SessionID",
  batchExpiredStart.data.quizSessionId,
  { StartedAt: new Date(Date.now() - 2000 * 1000).toISOString() },
);
assert.equal(
  call(
    "POST",
    "submitQuiz",
    { quizSessionId: batchExpiredStart.data.quizSessionId, answers: [] },
    batchExpiredToken,
  ).code,
  "QUIZ_SESSION_EXPIRED",
);
console.log("Phase 6 batch quiz tests passed.");
{
  context.DatabaseService.updateById(
    "Users",
    "UserID",
    registration.data.UserID,
    { Name: "Udin Saputra" },
  );
  const rankSeason = {
    SeasonID: "SEA_RANK_TEST",
    Name: "Season Ranking Test",
    Theme: "Ranking",
    Description: "",
    StartDate: "2026-06-01",
    EndDate: "2026-06-30",
    Status: "FINISHED",
    Reward: "",
    QuestionCount: 10,
    PointPerQuestion: 10,
    MaxAttempt: 1,
    QuizDuration: 1800,
    ShowExplanation: false,
    CreatedAt: context.nowIso_(),
    UpdatedAt: context.nowIso_(),
  };
  context.DatabaseService.insert("Seasons", rankSeason);
  const rankA = registration.data.UserID,
    rankB = "USR_RANK_B",
    rankC = "USR_RANK_C",
    rankSuspended = "USR_RANK_S",
    rankZero = "USR_RANK_Z";
  context.DatabaseService.insertMany("Users", [
    {
      UserID: rankB,
      Name: "Budi Santoso",
      NIS: "9000000002",
      SchoolID: "SCH_DEMO_01",
      Role: "STUDENT",
      Status: "ACTIVE",
      TotalPointCache: 0,
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
    {
      UserID: rankC,
      Name: "Siti Aminah",
      NIS: "9000000003",
      SchoolID: "SCH_DEMO_02",
      Role: "STUDENT",
      Status: "ACTIVE",
      TotalPointCache: 0,
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
    {
      UserID: rankSuspended,
      Name: "Suspended User",
      NIS: "9000000004",
      SchoolID: "SCH_DEMO_01",
      Role: "STUDENT",
      Status: "SUSPENDED",
      TotalPointCache: 0,
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
    {
      UserID: rankZero,
      Name: "Zero Point",
      NIS: "9000000005",
      SchoolID: "SCH_DEMO_01",
      Role: "STUDENT",
      Status: "ACTIVE",
      TotalPointCache: 0,
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
  ]);
  const budiToken = "budi-rank-session-token";
  context.DatabaseService.insert("Sessions", {
    SessionToken: context.sha256Hex_(budiToken),
    UserID: rankB,
    Role: "STUDENT",
    CreatedAt: context.nowIso_(),
    ExpiredAt: new Date(Date.now() + 3600000).toISOString(),
    LastActivityAt: context.nowIso_(),
    Status: "ACTIVE",
  });
  context.DatabaseService.insertMany("PointTransactions", [
    {
      PointID: "PNT_RANK_A",
      UserID: rankA,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "RANK_A",
      Point: 40,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_RANK_B",
      UserID: rankB,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "RANK_B",
      Point: 70,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_RANK_C",
      UserID: rankC,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "RANK_C",
      Point: 30,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_RANK_INVALID",
      UserID: rankA,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "INVALID",
      Point: 999,
      Status: "INVALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_RANK_S",
      UserID: rankSuspended,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "SUSPENDED",
      Point: 500,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_RANK_Z",
      UserID: rankZero,
      SeasonID: rankSeason.SeasonID,
      SourceType: "ADMIN",
      SourceID: "ZERO",
      Point: 0,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
    {
      PointID: "PNT_OTHER_SEASON",
      UserID: rankA,
      SeasonID: "SEA_DEMO_202608",
      SourceType: "ADMIN",
      SourceID: "OTHER",
      Point: 800,
      Status: "VALID",
      CreatedAt: context.nowIso_(),
      CreatedBy: "SYSTEM",
    },
  ]);
  context.DatabaseService.insertMany("QuizSessions", [
    {
      SessionID: "QZS_RANK_A",
      UserID: rankA,
      SeasonID: rankSeason.SeasonID,
      StartedAt: "2026-06-01T00:00:00.000Z",
      FinishedAt: "2026-06-01T00:10:00.000Z",
      QuestionIDs: "[]",
      Correct: 8,
      Wrong: 2,
      Score: 80,
      Bonus: 0,
      TotalPoint: 40,
      Attempt: 1,
      Status: "COMPLETED",
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
    {
      SessionID: "QZS_RANK_B",
      UserID: rankB,
      SeasonID: rankSeason.SeasonID,
      StartedAt: "2026-06-01T00:00:00.000Z",
      FinishedAt: "2026-06-01T00:10:00.000Z",
      QuestionIDs: "[]",
      Correct: 7,
      Wrong: 3,
      Score: 70,
      Bonus: 0,
      TotalPoint: 70,
      Attempt: 1,
      Status: "COMPLETED",
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
    {
      SessionID: "QZS_RANK_C",
      UserID: rankC,
      SeasonID: rankSeason.SeasonID,
      StartedAt: "2026-06-01T00:00:00.000Z",
      FinishedAt: "2026-06-01T00:10:00.000Z",
      QuestionIDs: "[]",
      Correct: 9,
      Wrong: 1,
      Score: 90,
      Bonus: 0,
      TotalPoint: 40,
      Attempt: 1,
      Status: "COMPLETED",
      CreatedAt: context.nowIso_(),
      UpdatedAt: context.nowIso_(),
    },
  ]);
  context.invalidateLeaderboardCache_(rankSeason.SeasonID);
  sheetMetrics.reads = 0;
  const publicRank = call("GET", "getLeaderboard", {
    seasonId: rankSeason.SeasonID,
    limit: 50,
    offset: 0,
  });
  const initialLeaderboardReads = sheetMetrics.reads;
  assert.equal(publicRank.success, true);
  assert.ok(initialLeaderboardReads <= 6, `Leaderboard melakukan ${initialLeaderboardReads} sheet reads`);
  assert.equal(publicRank.data.totalParticipants, 3);
  assert.deepEqual(
    publicRank.data.entries.map((row) => row.point),
    [70, 40, 30],
  );
  assert.deepEqual(
    publicRank.data.entries.map((row) => row.name),
    ["Budi S.", "Udin S.", "Siti A."],
  );
  assert.equal(JSON.stringify(publicRank).includes("USR_RANK"), false);
  assert.equal(
    /"(?:NIS|Email|WhatsApp|BirthDate|FraudScore|SessionToken)"\s*:/.test(
      JSON.stringify(publicRank),
    ),
    false,
  );
  const pagedRank = call("GET", "getLeaderboard", {
    seasonId: rankSeason.SeasonID,
    limit: 1,
    offset: 1,
  });
  assert.equal(pagedRank.data.entries[0].rank, 2);
  const myRank = call(
    "POST",
    "getMyRank",
    { seasonId: rankSeason.SeasonID },
    studentToken,
  );
  assert.equal(myRank.data.rank, 2);
  assert.equal(myRank.data.seasonPoint, 40);
  assert.equal(myRank.data.distanceToTop, 30);
  assert.equal(myRank.data.totalParticipants, 3);
  assert.equal(myRank.data.seasonId, rankSeason.SeasonID);
  assert.equal(myRank.data.seasonName, rankSeason.Name);
  const budiRank = call(
    "POST",
    "getMyRank",
    { seasonId: rankSeason.SeasonID },
    budiToken,
  );
  assert.equal(budiRank.data.rank, 1);
  assert.equal(budiRank.data.seasonPoint, 70);
  assert.equal(budiRank.data.totalParticipants, 3);
  const schoolRank = call("GET", "getSchoolLeaderboard", {
    seasonId: rankSeason.SeasonID,
  });
  assert.equal(schoolRank.success, true);
  assert.ok(schoolRank.data.entries.length >= 1);
  context.PointService.awardQuiz(
    rankA,
    rankSeason,
    { SessionID: "QZS_RANK_CACHE" },
    60,
    0,
  );
  const refreshedRank = call("GET", "getLeaderboard", {
    seasonId: rankSeason.SeasonID,
  });
  assert.equal(refreshedRank.data.entries[0].point, 100);
  assert.equal(refreshedRank.data.entries[0].name, "Udin S.");
  const adminToken = call("POST", "login", {
      identifier: "admin@example.test",
      password: "SangatRahasia123!",
    }).data.token,
    adminRank = call(
      "POST",
      "adminGetLeaderboard",
      { seasonId: rankSeason.SeasonID },
      adminToken,
    );
  assert.equal(adminRank.success, true);
  assert.ok(adminRank.data.entries[0].userId);
  assert.equal(JSON.stringify(adminRank).includes("PasswordHash"), false);
  console.log(`Phase 7 leaderboard tests passed (${initialLeaderboardReads} initial sheet reads).`);
  assert.equal(call("POST","adminPrepareSeasonFinalization",{seasonId:rankSeason.SeasonID},studentToken).code,"FORBIDDEN");
  const winnerPreview=call("POST","adminPrepareSeasonFinalization",{seasonId:rankSeason.SeasonID},adminToken);assert.equal(winnerPreview.success,true);assert.equal(winnerPreview.data.candidate.userId,rankA);assert.equal(winnerPreview.data.candidate.point,100);assert.equal(winnerPreview.data.status,"NORMAL");
  const disqualified=call("POST","adminDisqualifyCandidate",{seasonId:rankSeason.SeasonID,userId:rankA,reason:"Pelanggaran terverifikasi"},adminToken);assert.equal(disqualified.success,true);assert.equal(disqualified.data.next.candidate.userId,rankB);
  const finalized=call("POST","adminFinalizeWinner",{seasonId:rankSeason.SeasonID,userId:rankB},adminToken);assert.equal(finalized.success,true);assert.equal(finalized.data.winner.userId,rankB);assert.equal(finalized.data.reward.Status,"WAITING");const winnerId=finalized.data.winner.winnerId,rewardId=finalized.data.reward.RewardID;
  const finalizedAgain=call("POST","adminFinalizeWinner",{seasonId:rankSeason.SeasonID,userId:rankB},adminToken);assert.equal(finalizedAgain.success,true);assert.equal(finalizedAgain.data.winner.winnerId,winnerId);assert.equal(context.DatabaseService.getAllRows("Winners").filter(row=>row.SeasonID===rankSeason.SeasonID&&["PENDING_REVIEW","VALIDATED","PUBLISHED"].includes(row.Status)).length,1);assert.equal(context.DatabaseService.getAllRows("Rewards").filter(row=>row.WinnerID===winnerId).length,1);
  const verified=call("POST","adminVerifyWinner",{winnerId,destinationNumber:"081200000002",provider:"Telco",notes:"Identitas sesuai"},adminToken);assert.equal(verified.success,true);assert.equal(verified.data.winner.status,"VALIDATED");assert.equal(verified.data.reward.Status,"VERIFIED");assert.equal(call("POST","adminUpdateRewardStatus",{rewardId,status:"SENT",notes:"Dikirim manual"},adminToken).data.Status,"SENT");assert.equal(call("POST","adminUpdateRewardStatus",{rewardId,status:"COMPLETED",notes:"Diterima peserta"},adminToken).data.Status,"COMPLETED");assert.equal(call("POST","adminUpdateRewardStatus",{rewardId,status:"WAITING"},adminToken).code,"INVALID_REWARD_TRANSITION");
  const published=call("POST","adminPublishWinner",{winnerId},adminToken);assert.equal(published.success,true);const publicWinner=call("GET","getPublishedWinner",{seasonId:rankSeason.SeasonID});assert.equal(publicWinner.data.winnerName,"Budi S.");assert.equal(publicWinner.data.point,70);assert.equal(/DestinationNumber|WhatsApp|Email|NIS|FraudScore/.test(JSON.stringify(publicWinner)),false);assert.equal(call("GET","getWinnerHistory").data.length,1);
  const tieSeason={...rankSeason,SeasonID:"SEA_WIN_TIE",Name:"Season Full Tie"};context.DatabaseService.insert("Seasons",tieSeason);context.DatabaseService.insertMany("PointTransactions",[{PointID:"PNT_TIE_B",UserID:rankB,SeasonID:tieSeason.SeasonID,SourceType:"ADMIN",SourceID:"TIE_B",Point:100,Status:"VALID",CreatedAt:context.nowIso_(),CreatedBy:"SYSTEM"},{PointID:"PNT_TIE_C",UserID:rankC,SeasonID:tieSeason.SeasonID,SourceType:"ADMIN",SourceID:"TIE_C",Point:100,Status:"VALID",CreatedAt:context.nowIso_(),CreatedBy:"SYSTEM"}]);context.DatabaseService.insertMany("QuizSessions",[{SessionID:"QZS_TIE_B",UserID:rankB,SeasonID:tieSeason.SeasonID,Correct:20,Score:80,Attempt:1,Status:"COMPLETED",QuestionIDs:"[]",CreatedAt:context.nowIso_(),UpdatedAt:context.nowIso_()},{SessionID:"QZS_TIE_C",UserID:rankC,SeasonID:tieSeason.SeasonID,Correct:20,Score:80,Attempt:1,Status:"COMPLETED",QuestionIDs:"[]",CreatedAt:context.nowIso_(),UpdatedAt:context.nowIso_()}]);context.invalidateLeaderboardCache_(tieSeason.SeasonID);const tiePreview=call("POST","adminPrepareSeasonFinalization",{seasonId:tieSeason.SeasonID},adminToken);assert.equal(tiePreview.data.status,"NEED_REVIEW");assert.equal(tiePreview.data.candidates.length,2);assert.equal(call("POST","adminFinalizeWinner",{seasonId:tieSeason.SeasonID,userId:rankB},adminToken).code,"VALIDATION_ERROR");
  const emptySeason={...rankSeason,SeasonID:"SEA_WIN_EMPTY",Name:"Season Empty"};context.DatabaseService.insert("Seasons",emptySeason);assert.equal(call("POST","adminPrepareSeasonFinalization",{seasonId:emptySeason.SeasonID},adminToken).data.status,"NO_VALID_WINNER");assert.equal(call("POST","adminPrepareSeasonFinalization",{seasonId:"SEA_DEMO_202608"},adminToken).code,"SEASON_NOT_FINISHED");
  const auditActions=context.DatabaseService.getAllRows("ActivityLogs").map(row=>row.Action);["PREPARE_FINALIZATION","DISQUALIFY_CANDIDATE","FINALIZE_WINNER","VERIFY_WINNER","UPDATE_REWARD","PUBLISH_WINNER"].forEach(action=>assert.ok(auditActions.includes(action)));console.log("Phase 8 winner and reward tests passed.");
}
assert.equal(call("POST", "logout", {}, studentToken).success, true);
assert.equal(
  call("POST", "getProfile", {}, studentToken).code,
  "SESSION_INVALID",
);
assert.equal(call("GET", "unknown").code, "API_ACTION_NOT_FOUND");
console.log("Phase 3 API tests passed.");
