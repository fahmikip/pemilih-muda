# Google Sheets Database

## Architecture

Satu spreadsheet menjadi database utama. ID-nya disimpan di Script Property `DATABASE_SPREADSHEET_ID`. Jika property kosong, pemanggilan pertama `setupApplication()` membuat satu spreadsheet dan menyimpan ID tersebut. Jika ID terisi tetapi tidak valid/tidak dapat diakses, setup berhenti agar tidak membuat database kedua secara diam-diam.

`Schema.gs` adalah sumber tunggal nama sheet dan header. Repository membaca posisi kolom dari header, bukan nomor kolom hardcoded. Write memakai `LockService`; multi-row seed memakai satu `setValues()` per kelompok.

## Sheets dan fields

| Sheet | Fields |
|---|---|
| Users | UserID, Name, NIS, SchoolID, Class, BirthDate, WhatsApp, Email, PasswordHash, PasswordSalt, Role, Status, TotalPointCache, FraudScore, CreatedAt, UpdatedAt, LastLogin |
| Schools | SchoolID, SchoolName, NPSN, Type, Address, District, Status, CreatedAt, UpdatedAt |
| Seasons | SeasonID, Name, Theme, Description, StartDate, EndDate, Status, Reward, QuestionCount, PointPerQuestion, MaxAttempt, QuizDuration, ShowExplanation, CreatedAt, UpdatedAt |
| Questions | QuestionID, Category, Question, OptionA–D, CorrectAnswer, Explanation, Difficulty, Point, Status, CreatedAt, UpdatedAt |
| QuizSessions | SessionID, UserID, SeasonID, StartedAt, FinishedAt, QuestionIDs, Correct, Wrong, Score, Bonus, TotalPoint, Duration, Attempt, Status, DeviceID, UserAgent, CreatedAt, UpdatedAt |
| QuizAnswers | AnswerID, SessionID, UserID, QuestionID, SelectedAnswer, IsCorrect, Point, AnsweredAt, ResponseTimeMs, Status |
| PointTransactions | PointID, UserID, SeasonID, SourceType, SourceID, Point, Description, Status, CreatedAt, CreatedBy |
| Achievements | AchievementID, Code, Name, Description, Badge, PointBonus, Status, CreatedAt |
| UserAchievements | UserAchievementID, UserID, AchievementID, SeasonID, EarnedAt, PointAwarded |
| Materials | MaterialID, Title, Category, Thumbnail, Content, VideoURL, Status, PublishedAt, CreatedAt, UpdatedAt |
| Announcements | AnnouncementID, Title, Content, Type, Status, StartDate, EndDate, CreatedAt, UpdatedAt |
| Winners | WinnerID, SeasonID, UserID, Rank, Point, CorrectAnswers, QuizCompleted, AverageScore, Reward, Status, SelectedAt, SelectedBy, Notes |
| Rewards | RewardID, SeasonID, WinnerID, RewardName, Nominal, DestinationNumber, Provider, Status, SentAt, Notes, CreatedAt, UpdatedAt |
| Sessions | SessionToken, UserID, Role, CreatedAt, ExpiredAt, LastActivityAt, Status, UserAgent, DeviceID |
| FraudLogs | FraudLogID, UserID, SessionID, Type, Score, Description, Status, CreatedAt, ReviewedAt, ReviewedBy |
| ActivityLogs | LogID, UserID, Action, Entity, EntityID, Description, Device, CreatedAt |
| Settings | Key, Value, Type, Description, UpdatedAt |

## Enums

- Role: `STUDENT`, `ADMIN`, `SUPERADMIN`; user status: `ACTIVE`, `PENDING`, `SUSPENDED`, `BLOCKED`.
- School: `ACTIVE`, `INACTIVE`.
- Season: `DRAFT`, `SCHEDULED`, `ACTIVE`, `FINISHED`, `ARCHIVED`.
- Question difficulty: `EASY`, `MEDIUM`, `HARD`; status: `ACTIVE`, `INACTIVE`.
- Quiz session: `STARTED`, `COMPLETED`, `EXPIRED`, `INVALID`.
- Point source: `QUIZ`, `BONUS`, `ACHIEVEMENT`, `ADMIN`, `PENALTY`; status: `VALID`, `INVALID`, `REVERSED`.
- Reward: `WAITING`, `VERIFIED`, `SENT`, `COMPLETED`.
- Auth session: `ACTIVE`, `EXPIRED`, `REVOKED`.

## Relationships

`Users.SchoolID → Schools.SchoolID`; quiz sessions belong to user and season; answers belong to quiz session/user/question; point transactions belong to user/season and reference source; user achievements join users, achievements, and optional season; winners belong to season/user; rewards belong to season/winner; auth sessions and fraud/activity logs reference users. Referential integrity is enforced in service code because Sheets has no foreign-key engine.

## IDs

`generateId(prefix)` produces `<PREFIX>_<12 hex characters>` from `Utilities.getUuid()`, for example `USR_a1b2c3d4e5f6`. Prefixes: `USR`, `SCH`, `SEA`, `QUE`, `QZS`, `ANS`, `PNT`, `ACH`, `UAC`, `MAT`, `ANN`, `WIN`, `RWD`, `FRD`, `LOG`. Demo records use recognizable IDs such as `SCH_DEMO_01` and are the only rows eligible for `clearDemoData()`.

## Default settings

Setup inserts only missing keys: `APP_NAME`, `APP_VERSION`, `REGISTRATION_OPEN`, `DEFAULT_QUESTION_POINT`, `QUIZ_MAX_ATTEMPT`, `QUIZ_TIME_LIMIT`, `PERFECT_SCORE_BONUS`, `SHOW_LEADERBOARD`, `SHOW_SCHOOL_RANK`, `ENABLE_ACHIEVEMENT`, `MAINTENANCE_MODE`, `FRAUD_REVIEW_THRESHOLD`, `FRAUD_HIGH_RISK_THRESHOLD`, and `SESSION_TTL_SECONDS`. Existing values are preserved.

## Setup flow

`setupApplication()` obtains a script lock, opens or creates the configured spreadsheet, creates missing sheets, writes headers to empty sheets, appends missing headers without deleting/reordering existing data, inserts missing settings, optionally creates the initial superadmin, validates the result, logs it, and returns a summary. Run twice: the second run must have empty `createdSheets` and `createdSettings`.

`validateDatabaseSchema()` reports missing sheets, missing/duplicate headers, row counts, and required settings. Duplicate headers are reported, not silently deleted, because deleting a column could destroy existing data.

## Demo lifecycle

After setup, `seedDemoData()` inserts five schools, thirty questions, one active season, five materials, and three announcements. Existing demo IDs are skipped. `clearDemoData()` removes only rows whose relevant primary ID matches `^[A-Z]{3}_DEMO_`; production IDs are retained. Do not use demo data as production content.

## Script Properties

| Key | Required | Treatment |
|---|---|---|
| DATABASE_SPREADSHEET_ID | Optional | Existing spreadsheet ID. Automatically created/stored if absent. |
| INITIAL_ADMIN_NAME | Required only to create admin | Display name. |
| INITIAL_ADMIN_EMAIL | Required only to create admin | Normalized lowercase and checked for duplicate. |
| INITIAL_ADMIN_PASSWORD | Required only to create admin | Minimum 12 characters; deleted from Script Properties after successful creation. |
| QUIZ_OPTION_SECRET | Automatic | Secret untuk opaque option ID/order; dibuat otomatis saat quiz pertama dan tidak boleh diekspos. |

Passwords use a random 64-hex-character salt and 1,000 iterative SHA-256 digests available in Apps Script. Hash comparison avoids early exit. This is materially better than plaintext but is not a memory-hard password KDF such as Argon2/bcrypt; access to the spreadsheet and Apps Script project must therefore be tightly restricted. Hash and salt must never enter API responses.
