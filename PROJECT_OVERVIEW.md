# 🏪 FabricMarket - Luq Admin Monorepo

## 📋 Proje Özeti

**FabricMarket**, modern e-ticaret yönetimi için geliştirilmiş, tam özellikli bir admin paneli ve backend API sistemidir. Laravel 11 + PostgreSQL backend ile Next.js 15 + TypeScript + Ant Design 5 frontend teknolojilerini kullanarak kurumsal düzeyde bir çözüm sunar.

### 🎯 Temel Hedefler
- ✅ **Kurumsal E-Ticaret Yönetimi**: Ürün, kategori, marka, varyant, stok, fiyat yönetimi
- ✅ **Gelişmiş Varyant Sistemi**: Global varyasyonlar + manuel varyantlar
- ✅ **Medya Yönetimi**: Ürün ve varyant görselleri, merkezi medya kütüphanesi
- ✅ **Çok Dilli Destek**: Dinamik çeviri sistemi
- ✅ **SEO Optimizasyonu**: Her varlık için meta bilgileri
- ✅ **Vergi ve Para Birimi**: Çoklu vergi sınıfı ve para birimi desteği
- ✅ **Premium UX**: Ikas benzeri modern, responsive tasarım

---

## 🏗️ Mimari

### Backend (Laravel 11)
```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── ProductController.php      # Ürün CRUD + varyant yönetimi
│   │   ├── CategoryController.php     # Normal + Dinamik kategoriler
│   │   ├── BrandController.php        # Marka yönetimi
│   │   ├── MediaController.php        # Medya upload/yönetim
│   │   ├── OptionController.php       # Global varyasyon seçenekleri
│   │   ├── VariationController.php    # Varyasyon değerleri
│   │   ├── TaxController.php          # Vergi oranları
│   │   ├── CurrencyController.php     # Para birimleri
│   │   ├── TranslationController.php  # Çeviri yönetimi
│   │   └── ...
│   ├── Models/
│   │   ├── Product.php               # Ürün modeli (ilişkiler, accessor'lar)
│   │   ├── ProductVariant.php        # Varyant modeli
│   │   ├── Category.php              # Kategori (normal + dinamik)
│   │   ├── DynamicCategoryRule.php   # Dinamik kategori kuralları
│   │   ├── Media.php                 # Medya dosyaları
│   │   ├── Option.php                # Global varyasyon seçenekleri
│   │   ├── OptionValue.php           # Varyasyon değerleri
│   │   ├── TaxClass.php              # Vergi sınıfları
│   │   ├── TaxRate.php               # Vergi oranları
│   │   ├── Currency.php              # Para birimleri
│   │   └── ...
│   └── Policies/
│       └── ProductPolicy.php         # Yetkilendirme
├── database/
│   ├── migrations/                   # 45+ migration dosyası
│   └── seeders/                      # Örnek veriler
└── routes/
    └── api.php                       # API rotaları
```

### Frontend (Next.js 15 App Router)
```
frontend/
├── src/
│   ├── app/admin/
│   │   ├── page.tsx                  # Dashboard (analytics, grafikler)
│   │   ├── products/page.tsx         # Ürün listesi
│   │   ├── product/
│   │   │   ├── new/page.tsx          # Yeni ürün
│   │   │   └── edit/[id]/page.tsx    # Ürün düzenleme
│   │   ├── categories/
│   │   │   ├── page.tsx              # Kategori listesi
│   │   │   ├── new/page.tsx          # Yeni kategori
│   │   │   └── [id]/edit/page.tsx    # Kategori düzenleme
│   │   ├── brands/page.tsx           # Marka yönetimi
│   │   ├── tags/page.tsx             # Etiket yönetimi
│   │   ├── units/page.tsx            # Birim yönetimi
│   │   ├── media/page.tsx            # Medya kütüphanesi
│   │   ├── options/page.tsx          # Varyasyon seçenekleri
│   │   ├── products/variations/page.tsx  # Global varyasyonlar
│   │   └── settings/
│   │       ├── general/page.tsx      # Genel ayarlar
│   │       ├── tax/page.tsx          # Vergi ayarları
│   │       ├── currencies/page.tsx   # Para birimi ayarları
│   │       ├── translations/page.tsx # Çeviri yönetimi
│   │       ├── users/page.tsx        # Kullanıcı yönetimi
│   │       └── roles/page.tsx        # Rol ve izinler
│   ├── components/admin/
│   │   ├── AdminShell.tsx            # Ana layout (sidebar, header)
│   │   ├── PageHeader.tsx            # Dinamik sayfa başlığı
│   │   ├── VariantManager/           # Varyant yönetim bileşenleri
│   │   ├── product/                  # Ürün form bileşenleri
│   │   ├── media/                    # Medya yönetim bileşenleri
│   │   └── shared/                   # Paylaşılan bileşenler
│   ├── lib/
│   │   ├── api/                      # API client fonksiyonları
│   │   ├── auth.ts                   # Sanctum auth
│   │   └── i18n.ts                   # Çeviri sistemi
│   └── types/                        # TypeScript type tanımları
└── public/
```

---

## 🚀 Temel Özellikler

### 1. 📦 Ürün Yönetimi
- **Tam CRUD**: Oluşturma, okuma, güncelleme, silme
- **Varyant Sistemi**: 
  - Global varyasyonlardan otomatik kombinasyon
  - Manuel varyant ekleme
  - Varyant bazlı fiyat, stok, görsel
- **Fiyatlandırma**:
  - Normal fiyat + indirimli fiyat
  - Tarih bazlı indirim (başlangıç/bitiş)
  - Varyant bazlı özel fiyatlar
- **Stok Yönetimi**:
  - Stok takibi açma/kapama
  - Varyant bazlı stok
  - Birim yönetimi (adet, kg, m, m², m³, vb.)
  - Ondalıklı stok desteği
- **Medya**:
  - Çoklu ürün görseli
  - Varyant bazlı görseller
  - Sürükle-bırak sıralama
  - Önizleme ve silme
- **SEO**:
  - Meta başlık, açıklama
  - Slug yönetimi
  - Google Product Category entegrasyonu
- **Kategorilendirme**:
  - Çoklu kategori atama
  - Ana kategori seçimi
- **Diğer**:
  - Marka, etiket, birim
  - Kısa açıklama + detaylı açıklama (TinyMCE)
  - Aktif/Pasif durum
  - Vergi sınıfı

### 2. 📂 Kategori Sistemi
- **Normal Kategoriler**:
  - Hiyerarşik yapı (parent-child)
  - Manuel ürün atama
  - Görsel yönetimi
  - SEO ayarları
  - SSS (FAQ) desteği
- **Dinamik Kategoriler**:
  - Kural bazlı otomatik ürün ekleme
  - Koşul tipleri: marka, fiyat, etiket, stok, indirim
  - AND/OR mantığı
  - Gerçek zamanlı ürün eşleştirme

### 3. 🎨 Varyant ve Varyasyon Sistemi
- **Global Varyasyonlar**:
  - Renk, Beden, Malzeme vb.
  - Değer yönetimi (renk kodu, görsel)
  - Tüm ürünlerde kullanılabilir
- **Ürün Varyantları**:
  - Otomatik kombinasyon oluşturma
  - Manuel varyant ekleme
  - Toplu düzenleme
  - Varyant bazlı:
    - Fiyat (normal + indirimli)
    - Stok
    - SKU
    - Görsel
    - Aktif/Pasif durum

### 4. 🖼️ Medya Sistemi
- **Merkezi Kütüphane**: Tüm medya dosyalarını tek yerden yönetme
- **Scope Bazlı**: Product, Variant, Global
- **Özellikler**:
  - Drag & drop upload
  - Thumbnail oluşturma
  - Sürükle-bırak sıralama
  - Kullanım yeri takibi
  - Toplu silme

### 5. 💰 Vergi ve Para Birimi
- **Vergi Sınıfları**: Çoklu vergi sınıfı tanımlama
- **Vergi Oranları**: Ülke/bölge bazlı vergi oranları
- **Para Birimleri**: 
  - Çoklu para birimi desteği
  - Döviz kuru yönetimi
  - Varsayılan para birimi

### 6. 🌍 Çok Dilli Sistem
- **Dinamik Çeviriler**: Arayüz metinlerini yönetme
- **Dil Grupları**: Organize çeviri yönetimi
- **Fallback**: Eksik çeviriler için varsayılan değerler

### 7. 👥 Kullanıcı ve Yetkilendirme
- **Spatie Permissions**: Rol ve izin sistemi
- **Roller**: SuperAdmin, Editor, Viewer
- **İzinler**: 
  - products.view/create/update/delete
  - users.manage
  - roles.manage
- **Sanctum Auth**: SPA cookie tabanlı kimlik doğrulama

### 8. 📊 Dashboard ve Analytics
- **Metrikler**:
  - Toplam satış
  - Sipariş sayısı
  - Oturum sayısı
  - Dönüşüm oranı
  - İadeler
- **Grafikler**: Gerçek zamanlı satış analizi
- **Trafik Kaynakları**: Sosyal medya, organik, direkt
- **En Çok Satanlar**: Ürün performans takibi
- **Büyüme Metrikleri**: İade oranı, tekrar alım

---

## 🗄️ Veritabase Şeması

### Temel Tablolar
- **products**: Ürün ana bilgileri
- **product_variants**: Ürün varyantları
- **categories**: Kategoriler (normal + dinamik)
- **dynamic_category_rules**: Dinamik kategori kuralları
- **category_product**: Ürün-kategori ilişkisi (pivot)
- **brands**: Markalar
- **tags**: Etiketler
- **media**: Medya dosyaları
- **variations**: Global varyasyon tipleri (Renk, Beden vb.)
- **variation_values**: Varyasyon değerleri
- **options**: Varyasyon seçenekleri (ürün bazlı)
- **option_values**: Seçenek değerleri
- **units**: Birimler (adet, kg, m vb.)
- **product_units**: Ürün birim ilişkisi
- **tax_classes**: Vergi sınıfları
- **tax_rates**: Vergi oranları
- **currencies**: Para birimleri
- **translations**: Çeviriler
- **settings**: Sistem ayarları
- **users**: Kullanıcılar
- **roles**: Roller
- **permissions**: İzinler

### İlişkiler
```
Product
├── hasMany: ProductVariant
├── belongsToMany: Category (pivot: category_product)
├── belongsTo: Brand
├── belongsToMany: Tag
├── hasMany: Media (scope: product)
├── hasMany: Option
└── belongsTo: TaxClass

ProductVariant
├── belongsTo: Product
├── hasMany: Media (scope: variant)
└── belongsToMany: OptionValue

Category
├── belongsTo: parent (self)
├── hasMany: children (self)
├── belongsToMany: Product
└── hasOne: DynamicCategoryRule

Variation
└── hasMany: VariationValue

Option
├── belongsTo: Product
└── hasMany: OptionValue
```

---

## 🎨 UI/UX Özellikleri

### Design System
- **Renk Paleti**: Modern, profesyonel tonlar
- **Typography**: Outfit, Inter, Poppins fontları
- **Bileşenler**: Ant Design 5 + özel stil
- **Responsive**: Mobil, tablet, desktop optimizasyonu
- **Dark Mode Ready**: Koyu tema altyapısı

### Sayfa Tipleri
1. **Liste Sayfaları**: 
   - Filtreleme, arama
   - Toplu işlemler
   - Hızlı düzenleme (drawer)
   - İçe/dışa aktarma

2. **Form Sayfaları**:
   - Bölümlere ayrılmış formlar (SectionCard)
   - Gerçek zamanlı validasyon
   - Otomatik kaydetme
   - Sticky header (kaydet/vazgeç)

3. **Dashboard**:
   - Gerçek zamanlı metrikler
   - İnteraktif grafikler
   - Hızlı aksiyonlar

### Özel Bileşenler
- **VariantManager**: Varyant yönetimi
- **MediaManager**: Medya yönetimi
- **GoogleCategorySelector**: Google kategori seçici
- **TinyMCEEditor**: Zengin metin editörü
- **SeoSection**: SEO form bölümü
- **PageHeader**: Dinamik sayfa başlığı

---

## 🔧 Teknik Detaylar

### Backend
- **Framework**: Laravel 11
- **Database**: PostgreSQL 16
- **Auth**: Laravel Sanctum (SPA)
- **Permissions**: Spatie Laravel Permission
- **Storage**: Local (public disk)
- **API**: RESTful JSON API

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Ant Design 5
- **State**: React Hooks + Context
- **HTTP Client**: Fetch API
- **Routing**: Next.js App Router
- **Forms**: Ant Design Form

### Önemli Paketler
**Backend:**
- spatie/laravel-permission
- intervention/image (gelecek)

**Frontend:**
- antd@5.x
- @ant-design/icons
- lucide-react
- dayjs
- nprogress
- @tinymce/tinymce-react

---

## 📝 API Endpoints

### Authentication
- `GET /sanctum/csrf-cookie`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Products
- `GET /api/products` - Liste
- `POST /api/products` - Oluştur
- `GET /api/products/{id}` - Detay
- `PUT /api/products/{id}` - Güncelle
- `DELETE /api/products/{id}` - Sil
- `PUT /api/products/{id}/toggle-status` - Aktif/Pasif

### Categories
- `GET /api/categories` - Liste (type: normal|dynamic)
- `POST /api/categories` - Oluştur
- `GET /api/categories/{id}` - Detay
- `PUT /api/categories/{id}` - Güncelle
- `DELETE /api/categories/{id}` - Sil

### Media
- `POST /api/media/upload` - Upload
- `GET /api/media` - Liste
- `DELETE /api/media/{id}` - Sil
- `PUT /api/products/{id}/media/reorder` - Sıralama

### Variations & Options
- `GET /api/variations` - Global varyasyonlar
- `POST /api/variations` - Yeni varyasyon
- `GET /api/options` - Ürün seçenekleri
- `POST /api/options` - Yeni seçenek

### Diğer
- `GET /api/brands` - Markalar
- `GET /api/tags` - Etiketler
- `GET /api/units` - Birimler
- `GET /api/tax-classes` - Vergi sınıfları
- `GET /api/tax-rates` - Vergi oranları
- `GET /api/currencies` - Para birimleri
- `GET /api/translations` - Çeviriler
- `GET /api/google-product-categories` - Google kategorileri

---

## 🚦 Durum ve İlerlemeler

### ✅ Tamamlanan Özellikler
- [x] Temel ürün CRUD
- [x] Varyant sistemi (global + manuel)
- [x] Kategori sistemi (normal + dinamik)
- [x] Medya yönetimi
- [x] Marka, etiket, birim yönetimi
- [x] Vergi ve para birimi sistemi
- [x] Çeviri sistemi
- [x] SEO yönetimi
- [x] Dashboard analytics
- [x] Kullanıcı ve rol yönetimi
- [x] Google Product Category entegrasyonu
- [x] Responsive tasarım
- [x] Hızlı düzenleme (quick edit)

### 🔄 Devam Eden Geliştirmeler
- [ ] Sipariş yönetimi
- [ ] Müşteri yönetimi
- [ ] Kampanya ve kupon sistemi
- [ ] Raporlama modülü
- [ ] E-posta şablonları
- [ ] Bildirim sistemi

### 🐛 Bilinen Sorunlar
- Build sırasında console.error uyarıları (production'a etki etmiyor)
- Bazı çeviri anahtarları eksik olabilir

### 🎯 Sıradaki Geliştirmeler
1. **Sipariş Yönetimi**: Sipariş oluşturma, durum takibi, fatura
2. **Müşteri Yönetimi**: Müşteri profilleri, sipariş geçmişi
3. **Kampanya Sistemi**: İndirim kuponları, promosyonlar
4. **Raporlama**: Satış, stok, müşteri raporları
5. **E-posta Sistemi**: Sipariş onayı, kargo bildirimi
6. **Bildirimler**: Gerçek zamanlı bildirimler
7. **Bulk Import/Export**: Toplu ürün içe/dışa aktarma
8. **Advanced Search**: Gelişmiş ürün arama ve filtreleme
9. **Inventory Management**: Gelişmiş stok yönetimi
10. **Multi-warehouse**: Çoklu depo desteği

---

## 📚 Dokümantasyon Dosyaları

- **PROJECT_STATUS.md**: Proje durumu ve yapılanlar
- **MEDIA_SYSTEM.md**: Medya sistemi detayları
- **category-system.md**: Kategori sistemi spesifikasyonu
- **PROJECT_OUTPUT.md**: Çıktı ve deployment bilgileri

---

## 🔐 Güvenlik

- **CSRF Protection**: Laravel Sanctum
- **XSS Protection**: Input sanitization
- **SQL Injection**: Eloquent ORM
- **Authorization**: Policy-based access control
- **Password Hashing**: Bcrypt
- **Rate Limiting**: API throttling

---

## 🌟 Öne Çıkan Özellikler

1. **Tam Dinamik Sistem**: Her şey veritabanından yönetilebilir
2. **Ölçeklenebilir Mimari**: Modüler yapı, kolay genişletilebilir
3. **Modern UX**: Ikas benzeri premium kullanıcı deneyimi
4. **Type-Safe**: TypeScript ile tip güvenliği
5. **SEO Friendly**: Her varlık için SEO optimizasyonu
6. **Multi-tenant Ready**: Çoklu mağaza altyapısı hazır
7. **API First**: Headless commerce yaklaşımı
8. **Real-time**: Gerçek zamanlı güncellemeler

---

## 📞 Destek ve Katkı

Bu proje aktif geliştirme aşamasındadır. Öneriler ve katkılar için:
- Issue açabilirsiniz
- Pull request gönderebilirsiniz
- Dokümantasyon iyileştirmeleri yapabilirsiniz

---

**Son Güncelleme**: 1 Şubat 2026  
**Versiyon**: 2.0.0  
**Durum**: 🟢 Aktif Geliştirme
