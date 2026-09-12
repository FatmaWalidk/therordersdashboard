# جُهد — دليل الإعداد / Setup guide

لوحة عربية (RTL) لإدارة الطلبات، بياناتها تُحفظ في جدول Google الخاص بصاحب العمل — بدون خادم.

## 1. Google OAuth client

1. افتح <https://console.cloud.google.com/apis/credentials>
2. فعّل **Google Sheets API** و **Google Drive API** في المشروع.
3. أنشئ **OAuth client ID → Web application**.
4. في *Authorized JavaScript origins* أضف عنوان موقعك (مثال: `https://USERNAME.github.io`) و `http://localhost:8080` للتجربة.
5. في شاشة الموافقة (OAuth consent screen) أضف حسابك كـ *Test user* أثناء التطوير.
6. انسخ الـ Client ID إلى `VITE_GOOGLE_CLIENT_ID`.

النطاقات المستخدمة: `spreadsheets`, `drive.file`, `userinfo.email`, `userinfo.profile`.

## 2. جدول البيانات

عند أول تسجيل دخول يبحث التطبيق في Drive عن جدول باسم `OrderDashboard-Data`،
وإن لم يجده ينشئه تلقائياً بثلاث صفحات:

- `Customers`: id, name, contact, notes
- `Orders`: id, customer_id, product_description, customization_details, image_url, price, payment_status, order_status, created_at, due_date
- `Index`: shard_name, date_range_start, date_range_end, sheet_id (للمرحلة الثانية)

## 3. نموذج الطلب العام (`/order`)

1. افتح الجدول → Extensions → Apps Script.
2. الصق محتوى `apps-script/Code.gs`.
3. غيّر `SHARED_SECRET` إلى قيمة سرية، وضع نفس القيمة في `VITE_INTAKE_TOKEN`.
4. Deploy → New deployment → Web app، مع: Execute as **Me**، Who has access **Anyone**.
5. انسخ رابط النشر إلى `VITE_APPS_SCRIPT_URL`.

## 4. متغيرات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم. عند البناء للنشر، مرّرها كـ
GitHub Actions secrets بنفس الأسماء.

## 5. ملاحظة عن الاستضافة

المشروع مبني على TanStack Start. للحصول على ملفات ثابتة صالحة لـ GitHub Pages
سيحتاج البناء إلى وضع prerender/static؛ كل منطق البيانات هنا يعمل في المتصفح فقط
(لا يوجد أي كود خادم)، لذلك الترحيل إلى أي استضافة ثابتة لا يتطلب تغيير المنطق.
