# ZORUNLU Kod Standardı (Bu Repo)

## AMAÇ
- Hiçbir dosya **250-300 satırı geçmeyecek**.
- Bakım kolaylığı, performans ve test edilebilirlik öncelik.
- Hook kullanımı ve component ayrımı kuralları net.

## GENEL KURALLAR

### 1) Sorumluluk ayır
- UI component (render) ayrı
- data fetching ayrı
- utility (format/normalize) ayrı
- types ayrı

### 2) Hooks
- Hook’lar component seviyesinde çağrılacak.
- `products.map()` içinde doğrudan hook çağırma **YASAK**.
- Bunun yerine `<ProductCard />` gibi alt component oluştur ve hook’u onun içinde kullan.

### 3) Component yapısı
- “Grid/List” componenti sadece **layout + map** yapar.
- “Card/Row” componenti tek item render eder.
- Ağır UI’lar (carousel, modal, drawer, table) ayrı dosya.

### 4) Link/HTML
- Nested `<Link>` **YASAK**.
- Bir kart içinde sadece **1 adet `<Link>`** olur.

### 5) Tailwind
- Tailwind `className` inline kalabilir; ayrı CSS zorunlu değil.
- Tekrarlayan uzun `className` blokları varsa küçük UI bileşenlerine böl.

### 6) Dosya organizasyonu
- Her modül kendi klasöründe olacak.

Örnek:
```
src/components/storefront/product/
  ProductGrid.tsx
  ProductCard.tsx
  ProductImageCarousel.tsx

src/lib/media/getImageUrl.ts
```

### 7) Değişiklik formatı
- Önce **“Değişen dosyalar”** listesini yaz.
- Sonra her dosyanın **tam final kodunu** ver.
- En sonda **manuel test checklist** ver.
