# 🏪 FabricMarket - E-Ticaret Yönetim Sistemi

Modern, ölçeklenebilir ve tam özellikli e-ticaret admin paneli.

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- PHP 8.2+
- PostgreSQL 16+
- Node.js 18+
- Composer
- npm/yarn

### Backend Kurulum
```bash
cd backend
composer install
cp .env.example .env
# .env dosyasını düzenleyin (DB ayarları)
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend Kurulum
```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local dosyasını düzenleyin
npm run dev
```

### Varsayılan Giriş
- **Email:** admin@demo.com
- **Şifre:** password

---

## ✨ Özellikler

### 📦 Ürün Yönetimi
- Tam CRUD operasyonları
- Varyant sistemi (otomatik + manuel)
- Çoklu görsel yönetimi
- Fiyat ve stok yönetimi
- SEO optimizasyonu

### 📂 Kategori Sistemi
- Normal kategoriler (hiyerarşik)
- Dinamik kategoriler (kural bazlı)
- SEO ve FAQ desteği

### 🎨 Varyant Sistemi
- Global varyasyonlar
- Otomatik kombinasyon
- Varyant bazlı fiyat/stok/görsel

### 🖼️ Medya Yönetimi
- Merkezi medya kütüphanesi
- Drag & drop upload
- Thumbnail oluşturma

### 💰 Vergi ve Para Birimi
- Çoklu vergi sınıfı
- Bölge bazlı vergi oranları
- Çoklu para birimi desteği

### 🌍 Çok Dilli Sistem
- Dinamik çeviri yönetimi
- Fallback desteği

### 📊 Dashboard
- Gerçek zamanlı analytics
- Satış grafikleri
- Performans metrikleri

---

## 📁 Proje Yapısı

```
luq-admin-monorepo/
├── backend/              # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
│
├── frontend/             # Next.js 15 Admin Panel
│   ├── src/
│   │   ├── app/admin/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── public/
│
└── docs/                 # Dokümantasyon
    ├── PROJECT_OVERVIEW.md
    ├── TECHNICAL_ANALYSIS.md
    ├── PROJECT_STATUS.md
    ├── MEDIA_SYSTEM.md
    └── category-system.md
```

---

## 🛠️ Teknoloji Stack

### Backend
- **Framework:** Laravel 11
- **Database:** PostgreSQL 16
- **Auth:** Laravel Sanctum
- **Permissions:** Spatie Laravel Permission

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** Ant Design 5
- **Icons:** Ant Design Icons + Lucide React

---

## 📚 Dokümantasyon

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Genel bakış ve özellikler
- **[TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md)** - Teknik analiz ve durum raporu
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Proje durumu ve yapılanlar
- **[MEDIA_SYSTEM.md](MEDIA_SYSTEM.md)** - Medya sistemi detayları
- **[category-system.md](category-system.md)** - Kategori sistemi spesifikasyonu

---

## 🔧 API Endpoints

### Authentication
```
GET  /sanctum/csrf-cookie
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Products
```
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

### Categories
```
GET    /api/categories
POST   /api/categories
GET    /api/categories/{id}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

[Tüm API endpoints için PROJECT_OVERVIEW.md'ye bakın]

---

## 🎯 Durum

- **Production Ready:** %85
- **Özellik Tamamlanma:** %70
- **Dokümantasyon:** %90
- **Test Coverage:** %0

---

## 🚦 Sıradaki Geliştirmeler

1. **Sipariş Yönetimi** - Sipariş CRUD, durum takibi
2. **Müşteri Yönetimi** - Müşteri profilleri, sipariş geçmişi
3. **Kampanya Sistemi** - Kuponlar, promosyonlar
4. **Raporlama** - Satış, stok, müşteri raporları

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel bir projedir.

---

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Son Güncelleme:** 1 Şubat 2026  
**Versiyon:** 2.0.0  
**Durum:** 🟢 Aktif Geliştirme
