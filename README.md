# دليل مراكز التكلفة

تطبيق ويب بسيط لعرض بيانات مراكز التكلفة مع إمكانية البحث الذكي وعرض ملخصات سريعة.

## التشغيل المحلي

```bash
cd cost_center_search_app
python -m http.server 8000
```

ثم افتح العنوان التالي في المتصفح:

```text
http://localhost:8000
```

## المزايا

- عرض جميع السجلات في جدول منظم
- بحث ذكي حسب: رقم الحجز، مركز التكلفة، التفاصيل، والملاحظات
- فلترة حسب السجلات التي تحتاج مراجعة
- ملخصات إحصائية سريعة

## رفع المشروع إلى GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

> إذا كنت تريد، يمكنني أيضاً تجهيز ملف GitHub Actions أو إعداد发布 تلقائي إلى GitHub Pages.
