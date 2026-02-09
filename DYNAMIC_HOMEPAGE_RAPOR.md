# Dinamik Anasayfa Sistemi — Analiz & Mimari Rapor

> **Tarih:** 2026-02-09  
> **Kapsam:** FleetCart Section Builder analizi + Monorepo Next.js projesi için gelişmiş dinamik sayfa sistemi önerisi

---

## 1. FleetCart Section Builder — Mevcut Yapı Analizi

### 1.1 Mimari Özet

FleetCart'ın section builder'ı **server-rendered Blade** tabanlı, jQuery + Axios ile çalışan klasik bir monolitik yapıdır:

| Katman | Teknoloji | Dosya |
|--------|-----------|-------|
| **DB Modeli** | Eloquent (PageSection, SectionTemplate) | `modules/Storefront/Entities/` |
| **Admin UI** | jQuery + Sortable.js + Bootstrap Modal | `Resources/assets/admin/js/section-builder/index.js` |
| **Render Engine** | PHP SectionRenderer → Blade views | `Services/SectionRenderer.php` |
| **API** | Laravel Controller (CRUD + reorder) | `Http/Controllers/Admin/PageSectionController.php` |

### 1.2 Veritabanı Yapısı

**`section_templates`** — Kullanılabilir bölüm şablonları:
- `key` (unique): `hero_slider`, `product_tabs`, `collection_grid`, vb.
- `schema` (JSON): Her template'in form field tanımları (text, image, repeater, select, toggle, wysiwyg, product_select, category_select...)
- `default_settings` (JSON): Varsayılan değerler
- `supported_pages`: Hangi sayfa tiplerinde kullanılabilir (home, product, category, all)
- `blade_view`: Render edilecek Blade view yolu
- `category`: hero, products, banners, content, marketing, navigation, product_page

**`page_sections`** — Sayfalara eklenen aktif bölümler:
- `section_template_id` → FK
- `page_type`: home, product, category...
- `settings` (JSON): Instance-level ayarlar (template defaults ile merge edilir)
- `position`: Sıralama
- `is_active`: Görünürlük toggle

### 1.3 Desteklenen Section Tipleri (17 adet)

| Kategori | Section Key | Açıklama |
|----------|-------------|----------|
| **Hero** | `hero_slider` | Ana slider (repeater items veya legacy Slider modülü) |
| **Products** | `product_tabs` | Çoklu ürün vitrinleri (tab yapısında) |
| **Products** | `carousel_products` | Kaydırmalı ürün carousel |
| **Products** | `product_relationships` | İlişkili/benzer ürünler |
| **Banners** | `banner_slider` | Banner carousel |
| **Banners** | `one_column_banner` | Tek sütun geniş banner |
| **Banners** | `three_column_banner` | 2+1 layout banner |
| **Banners** | `collection_grid` | Görsel koleksiyon grid |
| **Banners** | `category_grid_banners` | Kategori keşif ızgarası |
| **Content** | `info_icons` | Avantaj/bilgi kartları |
| **Content** | `faq_section` | SSS accordion |
| **Content** | `content_section` | Genel içerik (HTML/FAQ/Blog) |
| **Content** | `html_content_section` | Serbest HTML |
| **Content** | `blog_posts_section` | Blog yazıları grid |
| **Marketing** | `newsletter` | Bülten abonelik |
| **Marketing** | `top_brands` | Marka logoları |
| **Product Page** | `product_features_story`, `product_usp_bar`, `product_tab_section` | Ürün sayfası özel bölümleri |

### 1.4 FleetCart'ın Güçlü Yönleri
- ✅ Drag & drop sıralama (Sortable.js)
- ✅ JSON schema tabanlı dinamik form üretimi (repeater, smart selector, conditional fields)
- ✅ Sayfa tipi bazlı filtreleme (home, product, category)
- ✅ Cihaz bazlı görünürlük (mobile/tablet/desktop)
- ✅ Section duplicate/toggle/delete

### 1.5 FleetCart'ın Zayıf Yönleri
- ❌ **Canlı önizleme yok** — Ayarları kaydedip sayfayı yenilemek gerekiyor
- ❌ **Server-side rendering only** — Blade template'e bağımlı, API-first değil
- ❌ **Responsive preview yok** — Mobil/tablet görünümü admin'de test edilemiyor
- ❌ **Versiyon/tarihçe yok** — Geri alma imkanı yok
- ❌ **A/B test desteği yok**
- ❌ **Zamanlama yok** — Belirli tarihte aktif/pasif yapılamıyor
- ❌ **Nested layout yok** — Section'lar sadece dikey sıralı, grid/column layout yok
- ❌ **Tema/stil varyantları yok** — Her section tek bir görünüme sahip

---

## 2. Monorepo Mevcut Durum

### 2.1 Frontend (Next.js)
- **Anasayfa:** `frontend/src/app/(storefront)/page.tsx` — **Tamamen statik/hardcoded**
- 3 sabit bölüm: Hero (fake banner), Category Grid, New Arrivals
- Kampanya banner'ı hardcoded Unsplash görseli
- Backend'den sadece `categories`, `hero`, `new_arrivals` çekiliyor

### 2.2 Backend (Laravel)
- **HomeController:** `backend/app/Http/Controllers/Api/Storefront/HomeController.php`
- Fake hero data, basit category + new arrivals query
- **Section builder sistemi yok**

---

## 3. Önerilen Gelişmiş Dinamik Sayfa Sistemi

### 3.1 Mimari Felsefe

FleetCart'ın yaklaşımını temel alıp, **Next.js + React ekosisteminin avantajlarıyla** çok daha üstün bir sistem:

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN PANEL (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Section      │  │ Canlı        │  │ Responsive     │  │
│  │ Builder      │  │ Önizleme     │  │ Preview        │  │
│  │ (DnD)        │  │ (iframe)     │  │ (mobile/tab)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────┘  │
│         │                 │                    │          │
│         └─────────────────┼────────────────────┘          │
│                           │                               │
│                    REST API (JSON)                         │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────┐
│                    BACKEND (Laravel)                       │
│  ┌─────────────┐  ┌──────┴───────┐  ┌────────────────┐  │
│  │ Section      │  │ Page         │  │ Section Data   │  │
│  │ Templates    │  │ Sections     │  │ Resolver       │  │
│  │ (Registry)   │  │ (Instances)  │  │ (API Response) │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────┐
│                 STOREFRONT (Next.js SSR)                   │
│  ┌─────────────┐  ┌──────┴───────┐  ┌────────────────┐  │
│  │ Section      │  │ Dynamic      │  │ React          │  │
│  │ Registry     │  │ Renderer     │  │ Components     │  │
│  │ (Component   │  │ (maps key →  │  │ (HeroSlider,   │  │
│  │  Map)        │  │  component)  │  │  ProductGrid..)│  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Veritabanı Tasarımı

**Tablo: `section_templates`**
```sql
id, key (unique), name, category, description, icon,
schema (JSON),           -- Admin form field tanımları
default_settings (JSON), -- Varsayılan değerler
supported_pages,         -- "home,category,all"
is_active, sort_order,
created_at, updated_at
```

**Tablo: `page_sections`**
```sql
id, section_template_id (FK), page_type, page_id (nullable),
settings (JSON),         -- Instance ayarları
position,
is_active,
visibility_rules (JSON), -- {"devices": ["mobile","tablet","desktop"], "user_groups": ["guest","member"]}
schedule_start (nullable datetime),
schedule_end (nullable datetime),
ab_variant (nullable),   -- A/B test varyant etiketi
created_at, updated_at
```

### 3.3 Backend API Tasarımı

#### Admin API Endpoints
```
GET    /api/admin/section-templates              — Tüm template'leri listele
GET    /api/admin/page-sections?page_type=home   — Sayfa section'larını getir
POST   /api/admin/page-sections                  — Yeni section ekle
PUT    /api/admin/page-sections/{id}             — Section ayarlarını güncelle
DELETE /api/admin/page-sections/{id}             — Section sil
POST   /api/admin/page-sections/{id}/toggle      — Aktif/pasif toggle
POST   /api/admin/page-sections/{id}/duplicate   — Kopyala
POST   /api/admin/page-sections/reorder          — Sıralama güncelle
```

#### Storefront API Endpoint (TEK ENDPOINT — TÜM VERİ)
```
GET /api/storefront/page-sections?page_type=home
```

Bu endpoint, aktif section'ları sıralı şekilde, **her section'ın resolve edilmiş verileriyle birlikte** döner:

```json
{
  "sections": [
    {
      "id": 1,
      "key": "hero_slider",
      "settings": { "autoplay": true, "speed": 5000 },
      "data": {
        "slides": [
          { "image": "/storage/media/banner1.webp", "title": "...", "link": "/..." }
        ]
      }
    },
    {
      "id": 2,
      "key": "category_grid",
      "settings": { "columns": 6, "title": "Kategoriler" },
      "data": {
        "categories": [
          { "id": 1, "name": "İpek", "slug": "ipek", "image": "..." }
        ]
      }
    },
    {
      "id": 3,
      "key": "product_carousel",
      "settings": { "title": "Yeni Gelenler", "source": "latest", "limit": 12 },
      "data": {
        "products": [ ... ]
      }
    }
  ]
}
```

### 3.4 Frontend Section Registry (React Component Map)

```typescript
// lib/sections/registry.ts
import dynamic from 'next/dynamic';

export const SectionRegistry: Record<string, React.ComponentType<any>> = {
  hero_slider:        dynamic(() => import('@/components/storefront/sections/HeroSlider')),
  category_grid:      dynamic(() => import('@/components/storefront/sections/CategoryGrid')),
  product_carousel:   dynamic(() => import('@/components/storefront/sections/ProductCarousel')),
  product_tabs:       dynamic(() => import('@/components/storefront/sections/ProductTabs')),
  banner_full:        dynamic(() => import('@/components/storefront/sections/BannerFull')),
  banner_split:       dynamic(() => import('@/components/storefront/sections/BannerSplit')),
  collection_grid:    dynamic(() => import('@/components/storefront/sections/CollectionGrid')),
  info_cards:         dynamic(() => import('@/components/storefront/sections/InfoCards')),
  brand_logos:        dynamic(() => import('@/components/storefront/sections/BrandLogos')),
  newsletter:         dynamic(() => import('@/components/storefront/sections/Newsletter')),
  faq_accordion:      dynamic(() => import('@/components/storefront/sections/FaqAccordion')),
  rich_text:          dynamic(() => import('@/components/storefront/sections/RichText')),
  countdown_banner:   dynamic(() => import('@/components/storefront/sections/CountdownBanner')),
  testimonials:       dynamic(() => import('@/components/storefront/sections/Testimonials')),
  video_hero:         dynamic(() => import('@/components/storefront/sections/VideoHero')),
  instagram_feed:     dynamic(() => import('@/components/storefront/sections/InstagramFeed')),
  marquee_text:       dynamic(() => import('@/components/storefront/sections/MarqueeText')),
  // ... kolayca genişletilebilir
};
```

### 3.5 Dinamik Sayfa Renderer

```typescript
// components/storefront/sections/DynamicPageRenderer.tsx
import { SectionRegistry } from '@/lib/sections/registry';

interface PageSection {
  id: number;
  key: string;
  settings: Record<string, any>;
  data: Record<string, any>;
}

export function DynamicPageRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <div className="dynamic-page">
      {sections.map((section) => {
        const Component = SectionRegistry[section.key];
        if (!Component) return null;
        return (
          <Component
            key={section.id}
            settings={section.settings}
            data={section.data}
          />
        );
      })}
    </div>
  );
}
```

### 3.6 Anasayfa Kullanımı

```typescript
// app/(storefront)/page.tsx
import { DynamicPageRenderer } from '@/components/storefront/sections/DynamicPageRenderer';
import { getPageSections } from '@/lib/api/storefront';

export default async function StorefrontHome() {
  const { sections } = await getPageSections('home');
  return <DynamicPageRenderer sections={sections} />;
}
```

---

## 4. FleetCart'a Göre Üstünlükler (Monorepo Avantajları)

| Özellik | FleetCart | Monorepo Önerisi |
|---------|-----------|------------------|
| **Canlı Önizleme** | ❌ Yok | ✅ Admin'de iframe ile anlık preview |
| **Render** | Server-side Blade | SSR + Client hydration (Next.js) |
| **Component Isolation** | Blade partial'lar | React component'ler (lazy loaded) |
| **Responsive Preview** | ❌ | ✅ Admin'de mobil/tablet/desktop frame |
| **Zamanlama** | ❌ | ✅ schedule_start / schedule_end |
| **A/B Test** | ❌ | ✅ ab_variant field ile varyant desteği |
| **Kullanıcı Hedefleme** | ❌ | ✅ visibility_rules (guest/member/vip) |
| **Versiyon Tarihçesi** | ❌ | ✅ Section revision log |
| **Nested Layout** | ❌ Sadece dikey | ✅ Grid/column layout section desteği |
| **Stil Varyantları** | ❌ Tek görünüm | ✅ Her section'a variant prop (dark/light/minimal) |
| **Performance** | Full page render | ✅ Dynamic import, sadece kullanılan section yüklenir |
| **SEO** | Blade SSR | ✅ Next.js SSR + metadata per section |
| **Type Safety** | ❌ | ✅ TypeScript interfaces |
| **Revalidation** | ❌ | ✅ ISR / on-demand revalidation |

---

## 5. Önerilen Section Tipleri (Genişletilmiş — 22 adet)

### Mevcut (FleetCart'tan devralınan, geliştirilmiş)
1. **`hero_slider`** — Tam ekran slider (video desteği eklenecek)
2. **`category_grid`** — Kategori ızgarası (shape: circle/square/rounded)
3. **`product_carousel`** — Ürün carousel (source: latest/featured/bestseller/category/manual)
4. **`product_tabs`** — Sekmeli ürün vitrinleri
5. **`banner_full`** — Tam genişlik banner
6. **`banner_split`** — İkili/üçlü banner grid
7. **`collection_grid`** — Görsel koleksiyon kartları
8. **`info_cards`** — Avantaj/özellik kartları (icon + text)
9. **`brand_logos`** — Marka logoları carousel
10. **`newsletter`** — E-bülten abonelik formu
11. **`faq_accordion`** — SSS accordion
12. **`rich_text`** — Zengin metin içerik (WYSIWYG)
13. **`marquee_text`** — Kayan yazı bandı

### Yeni (FleetCart'ta olmayan)
14. **`video_hero`** — Video arka planlı hero section
15. **`countdown_banner`** — Geri sayım kampanya banner'ı
16. **`testimonials`** — Müşteri yorumları carousel
17. **`instagram_feed`** — Instagram feed entegrasyonu
18. **`before_after`** — Ürün öncesi/sonrası karşılaştırma slider
19. **`lookbook`** — Lookbook / stil rehberi grid
20. **`store_locator`** — Mağaza bulucu harita
21. **`recently_viewed`** — Son görüntülenen ürünler (client-side)
22. **`custom_html`** — Serbest HTML/CSS/JS embed

---

## 6. Admin Section Builder UI Tasarımı

### 6.1 Sol Panel — Section Listesi
- Drag & drop sıralama (@dnd-kit/sortable)
- Her section kartında: isim, ikon, toggle, ayarlar, kopyala, sil
- Üstte sayfa tipi seçici (Home / Kategori / Ürün / Özel Sayfa)

### 6.2 Sağ Panel — Canlı Önizleme
- iframe ile storefront'un preview modu
- Responsive toggle butonları (desktop / tablet / mobile)
- Section'a tıklayınca ilgili ayarlar açılır

### 6.3 Section Ekleme — Drawer/Modal
- Kategorize edilmiş section kütüphanesi
- Her section'ın küçük önizleme görseli
- Arama ve filtreleme

### 6.4 Section Ayarları — Slide-over Panel
- JSON schema'dan otomatik form üretimi
- Field tipleri: text, number, color, toggle, select, image, product_select, category_select, repeater, wysiwyg, date_range
- Conditional fields (show_if desteği)
- Cihaz bazlı görünürlük toggle'ları

---

## 7. Uygulama Planı (Fazlar)

### Faz 1 — Temel Altyapı (Backend + DB)
- [ ] `section_templates` ve `page_sections` migration'ları
- [ ] `SectionTemplate` ve `PageSection` Eloquent modelleri
- [ ] Admin CRUD API controller
- [ ] Storefront page-sections API endpoint (data resolver ile)
- [ ] SectionTemplateSeeder (başlangıç template'leri)

### Faz 2 — Frontend Section Components
- [ ] Section Registry yapısı
- [ ] DynamicPageRenderer component
- [ ] Temel section component'leri (hero_slider, category_grid, product_carousel, banner_full, info_cards)
- [ ] Anasayfa'yı dinamik yapıya geçirme

### Faz 3 — Admin Section Builder UI
- [ ] Section builder sayfası (sol panel: liste, sağ panel: preview)
- [ ] Section ekleme drawer
- [ ] Section ayarları slide-over (schema-driven form)
- [ ] Drag & drop sıralama
- [ ] Canlı önizleme iframe

### Faz 4 — Gelişmiş Özellikler
- [ ] Zamanlama (schedule_start/end)
- [ ] Responsive preview (mobile/tablet frame)
- [ ] Section revision history
- [ ] Kalan section component'leri (video_hero, countdown, testimonials, vb.)

### Faz 5 — Premium Özellikler
- [ ] A/B test varyantları
- [ ] Kullanıcı hedefleme (guest/member)
- [ ] Section template marketplace (import/export)
- [ ] Sayfa template'leri (hazır sayfa düzenleri)

---

## 8. Sonuç

FleetCart'ın section builder'ı **iyi bir temel** sunuyor ancak Blade + jQuery mimarisi nedeniyle sınırlı. Monorepo projeniz için önerilen sistem:

1. **API-first yaklaşım** — Backend sadece JSON üretir, frontend render eder
2. **Component-based rendering** — Her section izole bir React component
3. **Schema-driven admin** — FleetCart'ın JSON schema yaklaşımı korunur ama React form'larıyla
4. **Canlı önizleme** — FleetCart'ta olmayan en büyük fark
5. **Performance** — Dynamic import ile sadece kullanılan section'lar yüklenir
6. **Type safety** — TypeScript ile hata önleme

Bu sistem, FleetCart'ın tüm yeteneklerini kapsar ve **Shopify Online Store 2.0** seviyesinde bir section builder deneyimi sunar.
