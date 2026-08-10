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
| getPublicLeaderboard | GET | Public | Maksimal 50, nama dimasking, poin VALID |
| getPublishedMaterials | GET | Public | Materi PUBLISHED |
| getPublishedAnnouncements | GET | Public | Pengumuman ACTIVE dalam tanggal |
| register | POST | Public/rate-limited | Registrasi STUDENT |
| login | POST | Public/rate-limited | Membuat session token |
| getProfile | POST | Session | Profil pemilik akun tanpa FraudScore |
| logout | POST | Session | Mencabut session |
| adminGetUsers | POST | ADMIN/SUPERADMIN | Data user tanpa hash/salt |
| adminGetSchools | POST | ADMIN/SUPERADMIN | Data sekolah lengkap |
| adminCreateSchool | POST | ADMIN/SUPERADMIN | Membuat sekolah |
| adminUpdateSchool | POST | ADMIN/SUPERADMIN | Memperbarui sekolah |
| adminDisableSchool | POST | ADMIN/SUPERADMIN | Mengubah status INACTIVE |
| adminCreateSeason | POST | ADMIN/SUPERADMIN | Membuat season |
| adminCreateQuestion | POST | ADMIN/SUPERADMIN | Membuat soal; jawaban tidak dikembalikan |

`startQuiz`, `submitAnswer`, dan `finishQuiz` sudah dicadangkan di router tetapi sengaja mengembalikan `API_ACTION_NOT_FOUND` sampai Quiz Engine dibuat.

## Contoh payload

- Register: `{"name":"Siti Aminah","nis":"1234567890","schoolId":"SCH_xxx","class":"XII","birthDate":"2008-01-02","whatsapp":"081234567890","email":"siti@example.com","password":"rahasia-ku"}`.
- Login: `{"identifier":"siti@example.com","password":"rahasia-ku"}`. Identifier juga menerima NIS.
- Profile/logout: payload `{}` dan field form `token` wajib.
- Schools/health: GET tanpa token.

Role, status, poin, FraudScore, hash, dan salt dari payload registrasi diabaikan. Login hanya mengembalikan `UserID`, `Name`, `SchoolID`, `Role`, dan `Status` serta token/expiry.

## Error codes

`INVALID_REQUEST`, `VALIDATION_ERROR`, `USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `USER_BLOCKED`, `USER_SUSPENDED`, `DUPLICATE_NIS`, `DUPLICATE_EMAIL`, `SCHOOL_NOT_FOUND`, `SESSION_INVALID`, `SESSION_EXPIRED`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `REGISTRATION_CLOSED`, `API_ACTION_NOT_FOUND`, `DATABASE_ERROR`, `INTERNAL_ERROR`.

## Manual test functions

Set `API_TEST_PASSWORD` (minimal 12 karakter), lalu jalankan `testHealth`, `testRegister`, `testLogin`, `testInvalidLogin`, `testSession`, `testGetSchools`, dan `testGetActiveSeason` dari editor GAS. Data yang dibuat memakai sekolah `SCH_TEST_API`, email domain `.invalid`, dan device `TEST`. Setelah selesai jalankan `clearApiTestData()`. Jangan menjalankan test berulang cepat karena login/register rate limit adalah 10 request per identifier per 5 menit.
