# Bilimdon — adabiyotdan jonli bellashuv

Next.js 15 da yozilgan jonli viktorina sayti (o'zbek / rus tillarida). Ishlashi Kahoot uslubida.

- **Jonli o'yin:** istalgan odam xona yaratadi va 6 xonali kod hamda QR oladi. Ishtirokchilar telefonidan kod, ism va avatar bilan kiradi. Savollar taymer bilan beriladi: tez va to'g'ri javob ko'proq ball oladi, ketma-ket to'g'ri javoblar uchun bonus ham bor. Har savoldan keyin javoblar statistikasi, eng tez javob bergan o'yinchi va reyting ko'rsatiladi. Oxirida g'oliblar shohsupasi chiqadi.
- **Javob tugmalari ikki uslubda:** klassik (qizil uchburchak, ko'k romb, sariq doira, yashil kvadrat) yoki kosmos (Oy, Quyosh, Saturn, Yer). Standart uslub admin panelda tanlanadi, xona yaratishda ham o'zgartirsa bo'ladi.
- **Mustaqil mashq:** o'quvchi kitobni tanlab, yolg'iz o'zi mashq qiladi.
- **Admin panel** (`/admin`): bo'limlar (kitoblar) va savollarni qo'shish, tahrirlash, o'chirish va tartibini o'zgartirish. Savolni bitta tilda yozsangiz, ikkinchi tilga avtomatik tarjima qilinadi. "Tarjima qilish" tugmasi bilan tarjimani saqlashdan oldin ko'rib, tuzatish mumkin.
- Avatarlar [DiceBear](https://www.dicebear.com) dan, QR kod esa `api.qrserver.com` dan olinadi.
- Dizayn Material 3 (Expressive) uslubida, yorug' va qorong'i rejimlar bilan.

## Lokal ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda http://localhost:3000 ni oching. Admin panel: http://localhost:3000/admin (standart parol `admin123`).
Lokal rejimda ma'lumotlar `.data/db.json` fayliga yoziladi.

> Node.js 20.12 yoki undan yangi versiya kerak.

## Vercel'ga joylash

1. Loyihani GitHub'ga yuklang va Vercel'da **New Project** orqali import qiling.
2. Vercel loyihasida **Storage → Marketplace → Upstash for Redis** ni tanlab, bepul bazani loyihaga ulang.
   Ulanganda `KV_REST_API_URL` va `KV_REST_API_TOKEN` o'zgaruvchilari avtomatik qo'shiladi.
3. **Settings → Environment Variables** bo'limiga `ADMIN_PASSWORD` ni (o'z parolingizni) qo'shing.
   Xohlasangiz `AUTH_SECRET` ga ham tasodifiy uzun matn yozing.
4. **Redeploy** tugmasini bosing.

Redis ulanmasa, sayt vaqtinchalik xotirada ishlaydi. Vercel'da bu holatda ma'lumotlar saqlanmaydi va admin panelda ogohlantirish chiqadi.

## Texnik tuzilma

| Qism | Fayl |
| --- | --- |
| O'yin mantig'i (xona, javob, ball, reyting) | `src/lib/game.ts` |
| Bo'lim va savollar | `src/lib/content.ts`, boshlang'ich savollar `src/lib/seed.ts` |
| Saqlash (Upstash Redis yoki lokal fayl) | `src/lib/store.ts` |
| Avtomatik tarjima | `src/lib/translate.ts` |
| Tarjimalar (UZ/RU interfeys) | `src/lib/i18n.ts` |
| Host ekrani | `src/app/host/[code]/page.tsx` |
| O'yinchi ekrani | `src/app/play/[code]/page.tsx` |
| Admin panel | `src/app/admin/` |

Vercel serverless'da WebSocket ishlamaydi. Shuning uchun real vaqt rejimi har ~1 soniyada so'rov yuborish (polling) orqali ishlaydi. Bu bitta sinf yoki guruh (o'nlab, bir necha yuzgacha o'yinchi) uchun yetarli.

Ball formulasi: `ball × (1 − javob_vaqti / savol_vaqti / 2)` + ketma-ket to'g'ri javob uchun bonus (har biri +100, ko'pi bilan +500).
