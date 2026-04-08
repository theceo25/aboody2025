# عبودي

نسخة جاهزة من تطبيق محادثة AI باسم **عبودي**، مع:

- محادثة مع النموذج عبر `/api/chat`
- تدريب بسيط محلي عبر `/api/train` (إضافة سؤال/جواب إلى قاعدة المعرفة)
- استرجاع أفضل المراجع المحلية (RAG بسيط) قبل إرسال السؤال للنموذج

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

> إذا لم يتم ضبط `OPENAI_API_KEY`، سيعمل الخادم في وضع تجريبي ويعطي ردًا من المعرفة المحلية إن وُجدت.

## API

### 1) محادثة

`POST /api/chat`

Body:

```json
{
  "messages": [
    { "role": "user", "content": "سؤالك" }
  ]
}
```

### 2) تدريب بسيط (إضافة معرفة)

`POST /api/train`

Body:

```json
{
  "question": "سؤال",
  "answer": "جواب",
  "tags": "اختياري"
}
```

### 3) عرض المعرفة

`GET /api/knowledge`

## الملفات

- `public/index.html`: واجهة المحادثة + نموذج إضافة المعرفة.
- `public/app.js`: منطق المحادثة والتدريب من الواجهة.
- `server.js`: APIs للمحادثة والتدريب والاسترجاع.
- `data/knowledge.json`: قاعدة المعرفة المحلية.


## تجربة سريعة (Demo)

1) شغّل التطبيق:

```bash
npm install
npm start
```

2) افتح المتصفح على:

- `http://localhost:3000`

3) تأكد من حالة التطبيق:

- `GET http://localhost:3000/api/health`

إذا `OPENAI_API_KEY` غير موجود، التطبيق يشتغل بوضع تجريبي (`demo`) ويرد من المعرفة المحلية.

## خطة التنزيل على App Store (iOS)

حتى ننزلها على App Store بشكل صحيح، هذه الخطوات المطلوبة بعد النسخة التجريبية:

1. **تحويل الواجهة إلى تطبيق iOS** عبر React Native/Expo أو Capacitor.
2. **إضافة تسجيل دخول** (Apple Sign-In أو بريد).
3. **سياسة خصوصية + Terms** لأن التطبيق يجمع رسائل مستخدم.
4. **فلترة محتوى** + زر تبليغ داخل التطبيق.
5. **اشتراك/In-App Purchase** إذا تريد ميزة مدفوعة.
6. **رفع TestFlight** ثم مراجعة ملاحظات التجربة.
7. بعدها **Submit to App Store Review**.

> إذا تريد، الخطوة الجاية مباشرة: أسويلك هيكل Expo جاهز بنفس واجهة عبودي حتى نبدأ TestFlight.
