# eTaklif — Elektron taklifnomalar va shaxsiy xatlar platformasi

To‘y, islomiy nikoh, xatna to‘y, tug‘ilgan kun, sevgi maktubi, interaktiv sevgi testi, kechirim so‘rash va boshqa shaxsiy xatlar uchun zamonaviy veb-platforma (O‘zbek va Rus tillarida).

## Imkoniyatlar
- **13 ta dizayn mavzusi** va **117 ta rang palitrasi**
- **3D muhrlangan konvert** ochilish animatsiyasi va interaktiv effektlar
- **Jonli konstruktor** (Telefon / Keng ekran preview, rasm yuklash, QR-kod)
- **Interaktiv Sevgi testi**, **Kechirim so‘rash** va **Virtual quchoq** vidjetlari
- **Express + SQLite (`node:sqlite`)** backend, foydalanuvchi kabineti, RSVP nazorati va Excel (CSV) eksport

## Ishga tushirish (Local)
```bash
npm install
npm run build
npm start
```
Sayt `http://localhost:3000` manzilida ochiladi.

## Deploy (Railway / Render / Docker)
1. Loyihani GitHub orqali **Railway** yoki **Render** ga ulang (avtomatik `Dockerfile` ishlatiladi).
2. Doimiy disk (**Volume**) qo‘shib `/app/data` manziliga ulang (SQLite baza va yuklangan rasmlar saqlanishi uchun).
