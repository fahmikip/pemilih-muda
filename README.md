# Pemilih Muda

Platform edukasi dan kuis pemilih pemula yang netral, nonpartisan, dan mobile-first.

## Arsitektur

- GitHub Pages: frontend HTML, CSS, dan Vanilla JavaScript.
- Google Apps Script Web App: API, authentication, authorization, dan business logic.
- Google Sheets: database utama.

## Status

Phase 1–5 selesai: foundation, database, backend API, authentication, season, Quiz Engine, resume, timer server, hasil, dan ledger poin idempotent. Leaderboard dan Winner Engine belum dimulai.

## Konfigurasi deployment

Edit `js/config.js`:

```js
API_URL: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec",
BASE_PATH: "/pemilih-muda/",
DEBUG: false
```

Jangan commit secret, password admin, spreadsheet ID privat, atau token session. Credential bootstrap GAS harus disimpan melalui Script Properties.

Dokumentasi teknis tersedia di [`docs/README.md`](docs/README.md), termasuk database, API, keamanan, dan deployment.
