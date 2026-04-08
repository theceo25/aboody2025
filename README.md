# عبودي

تطبيق **عبودي** يوفر واجهة محادثة (Chat) جاهزة، بحيث يمكنك ربطها مع أي نموذج AI عبر الخادم.

## التشغيل

```bash
npm install
npm start
```

ثم افتح:

- http://localhost:3000

## ربط OpenAI

اضبط متغيرات البيئة قبل التشغيل:

```bash
export OPENAI_API_KEY="your_api_key"
export OPENAI_MODEL="gpt-4.1-mini"
npm start
```

> إذا لم يتم ضبط `OPENAI_API_KEY`، سيعمل الخادم في وضع تجريبي ويرجع ردًا توضيحيًا.

## الملفات

- `public/index.html`: واجهة المحادثة.
- `public/app.js`: منطق الواجهة وإرسال الرسائل.
- `server.js`: API endpoint (`/api/chat`) وربط OpenAI.
