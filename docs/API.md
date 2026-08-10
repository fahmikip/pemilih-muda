# Google Apps Script Backend API

## Base URL dan kompatibilitas browser

Base URL adalah URL deployment Web App yang berakhiran `/exec`, misalnya `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`. GitHub Pages mengirim POST sebagai `application/x-www-form-urlencoded;charset=UTF-8` agar tetap menjadi CORS-safelisted request dan tidak memicu OPTIONS preflight yang tidak dapat ditangani seperti server Express. Jangan menambahkan custom authorization header. Fetch harus mengikuti redirect GAS (`redirect: "follow"`).

JSON (`application/json`) dan `text/plain` dapat diparse oleh backend untuk alat non-browser, tetapi `application/json` dari browser lintas origin umumnya memicu preflight dan bukan strategi frontend utama.

## Request

GET memakai query string:

```text
GET BASE_URL?action=health
GET BASE_URL?action=getSchools
GET BASE_URL?action=getPublicLeaderboard&payload={"limit":10}
```

POST memakai form fields:

```text
action=register
payload={"name":"Siti",...}
token=SESSION_TOKEN_IF_PRIVATE
```

JavaScript:

```js
const body = new URLSearchParams({
  action: "getProfile",
  payload: JSON.stringify({}),
  token: sessionToken
});
const response = await fetch(CONFIG.API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
  body,
  redirect: "follow"
});
const result = await response.json();
```

Token mentah dikirim dalam field `token`, bukan cookie lintas situs. Server menyimpan SHA-256 digest token pada `Sessions.SessionToken`; token mentah hanya dikembalikan saat login.

Frontend menyimpan token dan `expiresAt` saja di `sessionStorage`. Setiap halaman privat tetap memanggil `getProfile`, sehingga role dan data user selalu berasal dari server. Respons `SESSION_INVALID` atau `SESSION_EXPIRED` menghapus session client dan mengarahkan pengguna ke login.

## Response

Sukses: `{"success":true,"message":"Success","data":{}}`. Gagal: `{"success":false,"message":"Pesan aman","code":"ERROR_CODE"}`. ContentService tidak menyediakan kontrol status HTTP seperti framework web biasa, sehingga client wajib membaca `success` dan `code`, bukan mengandalkan status HTTP saja. Stack trace tidak dikirim ke client.

## Endpoints

| Action | Method | Access | Keterangan |
|---|---|---|---|
| health | GET | Public | Status API/database |
| getSchools | GET | Public | Sekolah ACTIVE, field publik saja |
| getActiveSeason | GET | Public | Season ACTIVE dalam rentang tanggal |
| getLeaderboard | GET | Public | Ranking season, pagination, nama dimasking |
| getPublicLeaderboard | GET | Public | Alias kompatibilitas untuk `getLeaderboard` |
| getLeaderboardSeasons | GET | Public | Season ACTIVE/FINISHED/ARCHIVED yang dapat difilter |
| getSchoolLeaderboard | GET | Public | Agregasi total/rata-rata poin dan peserta per sekolah |
| getPublishedMaterials | GET | Public | Materi PUBLISHED |
| getPublishedAnnouncements | GET | Public | Pengumuman ACTIVE dalam tanggal |
| register | POST | Public/rate-limited | Registrasi STUDENT |
| login | POST | Public/rate-limited | Membuat session token |
| getProfile | POST | Session | Profil pemilik akun tanpa FraudScore |
| logout | POST | Session | Mencabut session |
| getQuizStatus | POST | STUDENT | Status attempt/start/resume season aktif |
| startQuiz | POST | STUDENT | Membuat atau melanjutkan snapshot quiz |
| getCurrentQuestion | POST | STUDENT | Mengambil satu soal belum dijawab |
| submitAnswer | POST | STUDENT | Deprecated; kompatibilitas client lama |
| submitQuiz | POST | STUDENT | Validasi dan simpan seluruh draft jawaban dalam satu batch |
| finishQuiz | POST | STUDENT | Finalisasi idempotent dan rekonsiliasi ledger |
| getQuizResult | POST | STUDENT | Hasil quiz completed |
| getMySeasonStats | POST | STUDENT | Poin dan statistik season aktif |
| getMyRank | POST | Session | Ranking pemilik session pada season |
| adminGetLeaderboard | POST | ADMIN/SUPERADMIN | Ranking internal dengan UserID dan status fraud |
| adminGetUsers | POST | ADMIN/SUPERADMIN | Data user tanpa hash/salt |
| adminGetSchools | POST | ADMIN/SUPERADMIN | Data sekolah lengkap |
| adminCreateSchool | POST | ADMIN/SUPERADMIN | Membuat sekolah |
| adminUpdateSchool | POST | ADMIN/SUPERADMIN | Memperbarui sekolah |
| adminDisableSchool | POST | ADMIN/SUPERADMIN | Mengubah status INACTIVE |
| adminCreateSeason | POST | ADMIN/SUPERADMIN | Membuat season |
| adminCreateQuestion | POST | ADMIN/SUPERADMIN | Membuat soal; jawaban tidak dikembalikan |

Quiz request hanya mengirim ID session/question/option. Nilai, jumlah benar/salah, poin, UserID, attempt, dan status tidak diterima sebagai nilai terpercaya. `QuestionIDs` menjadi snapshot session. Opsi diacak stabil menggunakan mapping server yang diberi secret dari Script Properties; response soal tidak memuat `CorrectAnswer` atau mapping asli.

Flow aktif halaman quiz: satu `startQuiz` → navigasi dan draft lokal → review → satu `submitQuiz`. `startQuiz` dan resume mengembalikan paket seluruh soal dari snapshot session yang sama; bila attempt sudah selesai, endpoint yang sama mengembalikan hasil existing. Frontend tidak memanggil API saat memilih jawaban, membuka navigator, previous/next, atau review. Timer berasal dari `StartedAt` dan `QuizDuration` server. `getQuizStatus` tetap digunakan dashboard, sedangkan `submitAnswer` dan `getCurrentQuestion` menjadi endpoint deprecated untuk client lama dan tidak digunakan frontend v1.4.0.

Respons submit non-final:

```json
{"success":true,"data":{"completed":false,"result":{"accepted":true,"isCorrect":true,"point":10},"progress":{"answered":5,"total":25,"percent":20},"nextQuestion":{"questionId":"QUE_xxx","question":"...","options":[]}}}
```

`nextQuestion` tidak pernah memuat `CorrectAnswer`, status benar, atau penjelasan. Penjelasan jawaban saat ini hanya dikirim bila `ShowExplanation` aktif. Jika `completed=true`, `result` berisi hasil final dan `nextQuestion` bernilai `null`.

Paket `startQuiz` berisi `quizSessionId`, season publik, `startedAt`, `expiresAt`, `remainingSeconds`, dan `questions[]`. Setiap pertanyaan hanya berisi ID, nomor, teks, kategori, serta opsi `{id,label,text}`. ID opsi bersifat opaque dan mapping ke A–D asli hanya dapat diselesaikan server.

Payload batch:

```json
{"quizSessionId":"QZS_xxx","answers":[{"questionId":"QUE_xxx","selectedOptionId":"opt_xxx"}]}
```

Jawaban kosong boleh tidak dimasukkan dan dihitung salah. `submitQuiz` menolak question di luar snapshot, option ID modifikasi, dan question duplikat. Semua jawaban ditulis dengan satu `setValues`; score, poin, bonus, ledger, dan total poin dihitung server-side. Retry setelah session COMPLETED mengembalikan hasil yang sudah ada tanpa menggandakan jawaban atau poin.

## Contoh payload

- Register: `{"name":"Siti Aminah","nis":"1234567890","schoolId":"SCH_xxx","class":"XII","birthDate":"2008-01-02","whatsapp":"081234567890","email":"siti@example.com","password":"rahasia-ku"}`.
- Login: `{"identifier":"siti@example.com","password":"rahasia-ku"}`. Identifier juga menerima NIS.
- Profile/logout: payload `{}` dan field form `token` wajib.
- Schools/health: GET tanpa token.

Role, status, poin, FraudScore, hash, dan salt dari payload registrasi diabaikan. Login hanya mengembalikan `UserID`, `Name`, `SchoolID`, `Role`, dan `Status` serta token/expiry.

## Error codes

`INVALID_REQUEST`, `VALIDATION_ERROR`, `USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `USER_BLOCKED`, `USER_SUSPENDED`, `DUPLICATE_NIS`, `DUPLICATE_EMAIL`, `SCHOOL_NOT_FOUND`, `SESSION_INVALID`, `SESSION_EXPIRED`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `REGISTRATION_CLOSED`, `NO_ACTIVE_SEASON`, `SEASON_NOT_STARTED`, `SEASON_ENDED`, `QUIZ_NOT_AVAILABLE`, `MAX_ATTEMPT_REACHED`, `QUIZ_SESSION_NOT_FOUND`, `QUIZ_SESSION_EXPIRED`, `QUIZ_ALREADY_COMPLETED`, `QUESTION_NOT_FOUND`, `QUESTION_NOT_IN_SESSION`, `QUESTION_ALREADY_ANSWERED`, `INVALID_OPTION`, `INSUFFICIENT_QUESTIONS`, `API_ACTION_NOT_FOUND`, `DATABASE_ERROR`, `INTERNAL_ERROR`.

## Manual test functions

Set `API_TEST_PASSWORD` (minimal 12 karakter), lalu jalankan `testHealth`, `testRegister`, `testLogin`, `testInvalidLogin`, `testSession`, `testGetSchools`, dan `testGetActiveSeason` dari editor GAS. Data yang dibuat memakai sekolah `SCH_TEST_API`, email domain `.invalid`, dan device `TEST`. Setelah selesai jalankan `clearApiTestData()`. Jangan menjalankan test berulang cepat karena login/register rate limit adalah 10 request per identifier per 5 menit.
