# 🔧 Dashboard Analytics - Hata Giderme Kılavuzu

**Tarih:** 2026-02-08 03:20  
**Durum:** Debugging - API Fetch Error

---

## 🐛 Mevcut Hata

```
Error: [useAnalytics] Error: {}
```

---

## ✅ Yapılan İyileştirmeler

1. ✅ **useAnalytics Hook** - Daha iyi error handling
   - Detaylı console logging eklendi
   - Error message extraction iyileştirildi
   - Endpoint ve params loglanıyor

2. ✅ **Date Format** - ISO format kullanımı
   - `dayjs().toISOString()` formatına geçildi
   - Backend ile uyumluluk sağlandı

3. ✅ **TypeScript Errors** - Düzeltildi
   - Metrics'e `trend` property eklendi
   - Type safety iyileştirildi

---

## 🔍 Hata Ayıklama Adımları

### 1. Browser Console'u Kontrol Edin

Şimdi console'da şu bilgileri göreceksiniz:

```javascript
[useAnalytics] Fetching: /api/analytics/dashboard?startDate=2026-02-08T00:00:00.000Z&endDate=2026-02-08T03:20:00.000Z&compareWith=yesterday&interval=hour

[useAnalytics] Error: {
  message: "...",
  status: 401 | 500 | 0,
  details: {...},
  endpoint: "/api/analytics/dashboard",
  params: {...}
}
```

### 2. Olası Hatalar ve Çözümleri

#### A) **401 Unauthorized** (En Muhtemel)
**Sebep:** Admin token eksik veya geçersiz

**Çözüm:**
1. Admin paneline giriş yapın: `http://localhost:3000/admin/login`
2. Giriş yaptıktan sonra dashboard'u yenileyin
3. `localStorage` kontrol edin:
   ```javascript
   localStorage.getItem('admin_token')
   ```

#### B) **500 Internal Server Error**
**Sebep:** Backend hatası

**Çözüm:**
1. Laravel logs kontrol edin:
   ```bash
   tail -f backend/storage/logs/laravel.log
   ```
2. Muhtemelen:
   - Database bağlantı hatası
   - AnalyticsService hatası
   - Missing dependency

#### C) **0 Network Error**
**Sebep:** Backend çalışmıyor veya CORS hatası

**Çözüm:**
1. Backend'in çalıştığını kontrol edin:
   ```bash
   curl http://localhost:8000/api/health
   ```
2. Laravel server'ı başlatın:
   ```bash
   cd backend
   php artisan serve
   ```

#### D) **404 Not Found**
**Sebep:** Route bulunamadı

**Çözüm:**
1. Route cache'i temizleyin:
   ```bash
   php artisan route:clear
   php artisan route:cache
   ```
2. Routes'u kontrol edin:
   ```bash
   php artisan route:list --path=analytics
   ```

---

## 🧪 Manuel Test

### Test 1: Route Kontrolü
```bash
cd backend
php artisan route:list --path=analytics
```

**Beklenen Çıktı:**
```
GET|HEAD  api/analytics/dashboard     Api\AnalyticsController@dashboard
GET|HEAD  api/analytics/top-products  Api\AnalyticsController@topProducts
GET|HEAD  api/analytics/top-brands    Api\AnalyticsController@topBrands
GET|HEAD  api/analytics/top-categories Api\AnalyticsController@topCategories
```

### Test 2: Direct API Call (Postman/Insomnia)
```
GET http://localhost:8000/api/analytics/dashboard
Headers:
  Accept: application/json
  Authorization: Bearer YOUR_ADMIN_TOKEN
Query Params:
  start_date: 2026-02-08
  end_date: 2026-02-08
  interval: hour
```

### Test 3: Browser DevTools Network Tab
1. Dashboard sayfasını açın
2. DevTools > Network tab
3. `/api/analytics/dashboard` isteğini bulun
4. Request/Response headers kontrol edin
5. Response body'yi inceleyin

---

## 📋 Checklist

Sırayla kontrol edin:

- [ ] Backend çalışıyor mu? (`php artisan serve`)
- [ ] Database bağlantısı var mı? (`php artisan migrate:status`)
- [ ] Analytics migrations çalıştı mı? (6 tablo olmalı)
- [ ] Routes kayıtlı mı? (`php artisan route:list --path=analytics`)
- [ ] Admin olarak giriş yaptınız mı?
- [ ] `localStorage.getItem('admin_token')` dolu mu?
- [ ] CORS ayarları doğru mu? (`config/cors.php`)
- [ ] Frontend dev server çalışıyor mu? (`npm run dev`)

---

## 🔧 Hızlı Düzeltmeler

### Düzeltme 1: Token Eksikse
```javascript
// Browser console'da
localStorage.setItem('admin_token', 'YOUR_TOKEN_HERE')
location.reload()
```

### Düzeltme 2: Backend Yeniden Başlat
```bash
cd backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan serve
```

### Düzeltme 3: Frontend Yeniden Başlat
```bash
# Terminal'de Ctrl+C
npm run dev
```

---

## 📊 Beklenen API Response

Başarılı olduğunda şu response gelecek:

```json
{
  "metrics": {
    "total_revenue": 0,
    "total_orders": 0,
    "avg_order_value": 0,
    "total_refunds": 0,
    "refund_count": 0,
    "refund_rate": 0,
    "conversion_rate": 0,
    "total_sessions": 0
  },
  "chart_data": {
    "revenue": [
      { "label": "00:00", "value": 0 },
      { "label": "01:00", "value": 0 },
      ...
    ],
    "orders": [...]
  },
  "traffic_sources": [...],
  "top_products": [],
  "growth_metrics": {
    "refund_rate": 0,
    "repeat_purchase_rate": 0
  }
}
```

---

## 🎯 Sonraki Adım

Console'daki detaylı hata mesajını paylaşın:

```javascript
// Browser console'da göreceksiniz:
[useAnalytics] Fetching: ...
[useAnalytics] Error: {
  message: "...",  // ← Bu mesajı paylaşın
  status: ...,     // ← Bu status code'u paylaşın
  details: ...     // ← Bu detayları paylaşın
}
```

Bu bilgilerle sorunu hızlıca çözebiliriz! 🚀
