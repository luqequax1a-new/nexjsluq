# AI Proje Kuralları - FabricMarket Luq Admin

Bu dosya, AI asistanlarının bu projede kod yazarken uyması gereken temel kuralları içerir.

---

## Kural 1: Çeviri Sistemi (i18n)

### ❌ ASLA düz metin kullanmayın

```tsx
// YANLIŞ - Düz metin kullanımı
<Typography.Title>Siparişler</Typography.Title>
<Button>Kaydet</Button>
message.success("İşlem başarılı");
```

### ✅ Her zaman `t()` fonksiyonu ile çeviri key'leri kullanın

```tsx
import { t } from "@/lib/i18n";

// DOĞRU - Çeviri key'leri ile kullanım
<Typography.Title>{t("admin.orders.title", "Siparişler")}</Typography.Title>
<Button>{t("admin.common.save", "Kaydet")}</Button>
message.success(t("admin.common.success", "İşlem başarılı"));
```

### Key Yapısı

```
admin.[modül].[bölüm].[anahtar]
```

**Örnekler:**
- `admin.orders.title` → Sipariş modülü başlığı
- `admin.orders.columns.status` → Sipariş tablosu durum sütunu
- `admin.customers.form.first_name` → Müşteri formu ad alanı
- `admin.common.save` → Genel kaydet butonu

### Çeviri Dosyası

Tüm çeviriler `frontend/src/lib/i18n/admin.tr.json` dosyasına eklenir:

```json
{
  "admin": {
    "orders": {
      "title": "Siparişler",
      "columns": {
        "status": "Durum"
      }
    },
    "common": {
      "save": "Kaydet"
    }
  }
}
```

### Dinamik Değerler

Dinamik değerler için `:placeholder` formatı kullanılır:

```tsx
t("admin.orders.pagination.total", "Toplam :count sipariş").replace(":count", String(total))
```

---

## Kural 2: Global Header Kullanımı (usePageHeader)

### ❌ ASLA sayfa içinde ayrı başlık ve butonlar oluşturmayın

```tsx
// YANLIŞ - Sayfa içinde manuel header
return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Typography.Title>Siparişler</Typography.Title>
      <Button type="primary">Yeni Sipariş</Button>
    </div>
    {/* İçerik */}
  </div>
);
```

### ✅ Her zaman `usePageHeader` hook'u kullanın

```tsx
import { usePageHeader } from "@/hooks/usePageHeader";
import { useMemo } from "react";

export default function OrdersPage() {
  // Header butonları için useMemo kullanın
  const headerExtra = useMemo(() => (
    <Space size={12}>
      <Button icon={<ReloadOutlined />} onClick={() => loadData()} />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => router.push("/admin/orders/new")}
        style={{ 
          background: "#5E5CE6", 
          borderColor: "#5E5CE6", 
          borderRadius: 8, 
          fontWeight: 600 
        }}
      >
        {t("admin.orders.new_order", "Yeni Sipariş")}
      </Button>
    </Space>
  ), []);

  // Opsiyonel footer bilgisi
  const headerFooter = useMemo(() => (
    <div style={{ display: "flex", gap: "24px", color: "#64748b", fontSize: "13px" }}>
      <span>{t("admin.orders.pagination.total", "Toplam :count sipariş").replace(":count", String(total))}</span>
    </div>
  ), [total]);

  // Global header'ı ayarla
  usePageHeader({
    title: t("admin.orders.title", "Siparişler"),
    extra: headerExtra,
    footer: headerFooter // Opsiyonel
  });

  // Sayfa içeriğinde başlık OLMASIN
  return (
    <div>
      {/* Sadece içerik - header yok */}
      <Row gutter={16}>
        {/* İstatistik kartları, tablolar vb. */}
      </Row>
    </div>
  );
}
```

### usePageHeader Özellikleri

| Prop | Tip | Açıklama |
|------|-----|----------|
| `title` | `string` | Sayfa başlığı (zorunlu) |
| `extra` | `ReactNode` | Sağ taraftaki butonlar |
| `footer` | `ReactNode` | Alt bilgi (opsiyonel) |
| `breadcrumb` | `BreadcrumbProps` | Breadcrumb navigasyonu |
| `onBack` | `() => void` | Geri butonu için handler |
| `onSave` | `() => void` | Kaydet butonu için handler |
| `saving` | `boolean` | Kaydetme durumu |
| `variant` | `'light' \| 'dark'` | Header teması |

### Örnek Ürün Listesi Yapısı

```tsx
const headerExtra = useMemo(() => (
  <Space size={12}>
    <Button icon={<ExportOutlined />}>
      {t("admin.products.list.export", "Dışa Aktar")}
    </Button>
    <Button icon={<ImportOutlined />}>
      {t("admin.products.list.import", "İçe Aktar")}
    </Button>
    {hasPermission(me, "products.create") && (
      <Link href="/admin/product/new">
        <Button type="primary" icon={<PlusOutlined />}>
          {t("admin.products.list.new_product", "Yeni Ürün")}
        </Button>
      </Link>
    )}
  </Space>
), [me]);

usePageHeader({
  title: t("admin.products.list.title", "Ürün Listesi"),
  extra: headerExtra,
  footer: headerFooter
});
```

---

## Kural 3: Premium UI Tasarım Standartları

- Butonlar: `borderRadius: 8`, `fontWeight: 600`
- Primary buton rengi: `#5E5CE6`
- Kartlar: `borderRadius: 12`, `border: "1px solid #f0f0f5"`
- İkonlar ile tutarlılık: Ant Design ikonları kullanın
- Responsive tasarım: `<Row gutter={16}>` ve `<Col span={...}>` kullanın

---

## Kural 4: API Çağrıları

```tsx
import { apiFetch } from "@/lib/api";

// GET
const data = await apiFetch<ResponseType>("/api/endpoint");

// POST/PUT
await apiFetch("/api/endpoint", {
  method: "POST",
  json: { key: value }
});
```

---

## Kural 5: Hata Yönetimi

```tsx
try {
  await apiFetch(...);
  message.success(t("admin.common.success", "İşlem başarılı"));
} catch (e: unknown) {
  const errorMessage = e instanceof Error ? e.message : t("admin.common.error", "Bir hata oluştu");
  message.error(errorMessage);
}
```

---

## Kural 6: Yetkilendirme ve İzinler (Permissions)

### Backend Kuralları

#### ❌ ASLA `admin` rolüne otomatik yetki vermeyin
Eski sistemde `admin` rolü her şeye erişebiliyordu. Bu kaldırıldı. Artık sadece `SuperAdmin` rolü sınırsız yetkiye sahiptir.

#### ✅ Global Bypass (AuthServiceProvider)
Sadece `SuperAdmin` rolü için global bypass `Gate::before` içinde tanımlanmalıdır:
```php
Gate::before(function ($user, $ability) {
    return $user->hasRole('SuperAdmin') ? true : null;
});
```

#### ✅ Controller Seviyesinde Koruma
Her Controller'ın constructor'ında ilgili yetkiler middleware olarak tanımlanmalıdır:
```php
public function __construct()
{
    $this->middleware('permission:brands.index')->only(['index', 'show']);
    $this->middleware('permission:brands.create')->only(['store']);
    $this->middleware('permission:brands.edit')->only(['update']);
    $this->middleware('permission:brands.destroy')->only(['destroy']);
}
```

### Frontend Kuralları

#### ✅ `hasPermission` Kullanımı
Frontend'de butonlar, linkler veya sayfalar korunurken `hasPermission` yardımcı fonksiyonu kullanılmalıdır:
```tsx
import { useAuth, hasPermission } from "@/lib/auth";

const { me } = useAuth();

// Buton gösterimi
{hasPermission(me, "brands.create") && (
  <Button onClick={handleAdd}>{t("admin.brands.add", "Ekle")}</Button>
)}

// Tablo aksiyonları
{
  title: t("admin.common.actions", "İşlemler"),
  render: (_, record) => (
    <Space>
      {hasPermission(me, "brands.edit") && <Button>...</Button>}
      {hasPermission(me, "brands.destroy") && <Button>...</Button>}
    </Space>
  )
}
```

#### ✅ Sidebar (Yan Menü) Koruması
Yan menüdeki her modül, kullanıcının o modülü görme yetkisi (`.index`) olup olmadığına bakılarak render edilir. Yeni bir modül eklendiğinde `AdminShell.tsx` içinde `hasPermission` kontrolü mutlaka eklenmelidir.

### Yetki İsimlendirme Standartı
Yetkiler her zaman `modül_adı.eylem` formatında olmalıdır:
- `brands.index` (Görüntüleme)
- `brands.create` (Ekleme)
- `brands.edit` (Güncelleme)
- `brands.destroy` (Silme)
