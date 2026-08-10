var ValidationService = Object.freeze({
  validateRequired:function (value, field) { if (value === null || value === undefined || String(value).trim() === '') throw new Error((field || 'Field') + ' wajib diisi.'); return true; },
  validateEmail:function (value) { this.validateRequired(value, 'Email'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) throw new Error('Format email tidak valid.'); return true; },
  validateNIS:function (value) { this.validateRequired(value, 'NIS/NISN'); if (!/^\d{5,20}$/.test(String(value).trim())) throw new Error('NIS/NISN harus 5–20 digit.'); return true; },
  validatePhone:function (value) { this.validateRequired(value, 'Nomor WhatsApp'); var normalized=String(value).replace(/[\s()-]/g,''); if (!/^(?:\+62|62|0)8\d{7,12}$/.test(normalized)) throw new Error('Nomor WhatsApp tidak valid.'); return true; },
  validateEnum:function (value, allowed, field) { if (allowed.indexOf(value) < 0) throw new Error((field || 'Nilai') + ' tidak valid.'); return true; },
  validateDate:function (value, field) { this.validateRequired(value, field || 'Tanggal'); var date=value instanceof Date?value:new Date(value); if (isNaN(date.getTime())) throw new Error((field || 'Tanggal') + ' tidak valid.'); return true; }
});
