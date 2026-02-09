# 📏 Unit-Based Stock & Price Management Rules

## 🎯 Temel Kural

**TÜM fiyat, stok ve miktar işlemleri UNIT (birim) bazlı çalışmalıdır.**

---

## 📋 Unit (Birim) Yapısı

### Database Schema (units table)
```sql
- id
- name                 # Örn: "Kilogram", "Metre", "Adet"
- label                # Görünen isim
- short_name           # Kısa isim
- suffix               # Birim soneki (kg, m, adet)
- min                  # Minimum miktar (decimal:3)
- max                  # Maximum miktar (decimal:3)
- step                 # Artış adımı (decimal:3)
- default_qty          # Varsayılan miktar (decimal:3)
- info_top             # Üst bilgi metni
- info_bottom          # Alt bilgi metni
- price_prefix         # Fiyat prefix (örn: "₺/kg", "₺/m²")
- stock_prefix         # Stok prefix (örn: "kg", "m²")
- is_decimal_stock     # BOOLEAN - Ondalıklı stok izni
- is_active            # Aktif/Pasif
```

### Kritik Alan: `is_decimal_stock`

```php
// Backend (Unit.php)
protected $casts = [
    'is_decimal_stock' => 'boolean',
];

public function isDecimalStock(): bool
{
    return (bool) $this->is_decimal_stock;
}
```

---

## 🔢 Ondalık Stok Kuralları

### Kural 1: Ondalık İzni Kontrolü

```javascript
// Frontend - Unit bazlı kontrol
const selectedUnit = units.find(u => u.id === product.unit_id);

if (selectedUnit?.is_decimal_stock) {
    // ✅ Ondalık izin VERİLİR
    // Örnek: 10.5 kg, 2.75 m²
    inputMode = "decimal";
    step = selectedUnit.step || 0.001;
} else {
    // ❌ Ondalık izin VERİLMEZ
    // Örnek: 10 adet, 5 kutu (10.5 OLMAZ!)
    inputMode = "numeric";
    step = 1;
}
```

### Kural 2: Input Validation

```javascript
// Gerçek zamanlı validasyon
function onQtyInput(event) {
    const allowDecimal = selectedUnit?.is_decimal_stock;
    
    if (!allowDecimal && event.target.value.includes('.')) {
        // Ondalık girilmeye çalışıldı ama izin yok
        const rounded = Math.round(parseFloat(event.target.value));
        event.target.value = rounded;
        form.qty = rounded;
        
        showWarning('Seçilen birim ondalık sayı desteklemiyor. Lütfen tam sayı giriniz.');
    }
}
```

### Kural 3: Unit Değişikliğinde Auto-Format

```javascript
// Unit değiştiğinde mevcut değerleri formatla
watch(selectedUnit, (newUnit, oldUnit) => {
    if (newUnit && !newUnit.is_decimal_stock) {
        // Yeni unit ondalık desteklemiyor
        
        // Stok miktarını yuvarla
        if (form.qty) {
            const original = form.qty;
            const rounded = Math.round(Number(form.qty));
            if (original !== rounded) {
                form.qty = rounded;
                showWarning('Stok miktarı en yakın tam sayıya yuvarlandı.');
            }
        }
        
        // Varyant stoklarını yuvarla
        if (form.variants) {
            form.variants.forEach(variant => {
                if (variant.qty) {
                    variant.qty = Math.round(Number(variant.qty));
                }
            });
        }
    }
});
```

---

## 💰 Fiyat Gösterimi (Unit Prefix)

### Frontend Display Logic

```typescript
// Fiyat gösterimi
function formatPrice(price: number, unit: Unit): string {
    if (unit.price_prefix) {
        // Örn: "₺150/kg", "₺25/m²"
        return `₺${price}${unit.price_prefix}`;
    }
    return `₺${price}`;
}

// Stok gösterimi
function formatStock(qty: number, unit: Unit): string {
    const formatted = unit.is_decimal_stock 
        ? qty.toFixed(2) 
        : Math.round(qty);
    
    if (unit.stock_prefix) {
        // Örn: "10.5 kg", "25 m²"
        return `${formatted} ${unit.stock_prefix}`;
    }
    return formatted.toString();
}
```

---

## 📦 Ürün Listesi (Products Table)

### Fiyat Kolonu
```typescript
{
    title: 'Fiyat',
    dataIndex: 'price',
    render: (price, record) => {
        const unit = units.find(u => u.id === record.unit_id);
        if (!unit) return `₺${price}`;
        
        // Unit prefix ile göster
        return unit.price_prefix 
            ? `₺${price}${unit.price_prefix}` 
            : `₺${price}`;
    }
}
```

### Stok Kolonu
```typescript
{
    title: 'Stok',
    dataIndex: 'qty',
    render: (qty, record) => {
        const unit = units.find(u => u.id === record.unit_id);
        if (!unit) return qty;
        
        // Ondalık kontrolü + prefix
        const formatted = unit.is_decimal_stock 
            ? parseFloat(qty).toFixed(2) 
            : Math.round(qty);
        
        return unit.stock_prefix 
            ? `${formatted} ${unit.stock_prefix}` 
            : formatted;
    }
}
```

---

## 🎨 Form Input Components

### Stok Input (Inventory)

```tsx
<Form.Item label="Stok Miktarı" name="qty">
    <InputNumber
        min={selectedUnit?.min || 0}
        max={selectedUnit?.max || 999999}
        step={selectedUnit?.is_decimal_stock ? (selectedUnit.step || 0.1) : 1}
        precision={selectedUnit?.is_decimal_stock ? 2 : 0}
        inputMode={selectedUnit?.is_decimal_stock ? "decimal" : "numeric"}
        addonAfter={selectedUnit?.stock_prefix}
        onChange={(value) => handleQtyChange(value)}
    />
</Form.Item>
```

### Fiyat Input

```tsx
<Form.Item label="Fiyat" name="price">
    <InputNumber
        min={0}
        step={0.01}
        precision={2}
        addonBefore="₺"
        addonAfter={selectedUnit?.price_prefix}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
    />
</Form.Item>
```

---

## 🔄 Varyant Yönetimi

### Varyant Tablosu

```typescript
const variantColumns = [
    {
        title: 'Varyant',
        dataIndex: 'name',
    },
    {
        title: 'Fiyat',
        dataIndex: 'price',
        render: (price) => {
            const unit = getSelectedUnit();
            return unit?.price_prefix 
                ? `₺${price}${unit.price_prefix}` 
                : `₺${price}`;
        }
    },
    {
        title: 'Stok',
        dataIndex: 'qty',
        render: (qty) => {
            const unit = getSelectedUnit();
            const formatted = unit?.is_decimal_stock 
                ? parseFloat(qty).toFixed(2) 
                : Math.round(qty);
            
            return unit?.stock_prefix 
                ? `${formatted} ${unit.stock_prefix}` 
                : formatted;
        }
    }
];
```

### Toplu Düzenleme

```typescript
function handleBulkStockUpdate(value: number) {
    const unit = getSelectedUnit();
    const finalValue = unit?.is_decimal_stock 
        ? parseFloat(value.toFixed(2)) 
        : Math.round(value);
    
    selectedVariants.forEach(variant => {
        variant.qty = finalValue;
    });
}
```

---

## ⚠️ Validasyon Kuralları

### Frontend Validation

```typescript
const validateQty = (value: number, unit: Unit): boolean => {
    // Min kontrolü
    if (value < (unit.min || 0)) {
        showError(`Minimum miktar: ${unit.min} ${unit.stock_prefix || ''}`);
        return false;
    }
    
    // Max kontrolü
    if (unit.max && value > unit.max) {
        showError(`Maximum miktar: ${unit.max} ${unit.stock_prefix || ''}`);
        return false;
    }
    
    // Ondalık kontrolü
    if (!unit.is_decimal_stock && value % 1 !== 0) {
        showError('Bu birim ondalık sayı desteklemiyor.');
        return false;
    }
    
    return true;
};
```

### Backend Validation

```php
// ProductController.php
public function validateQuantity(Request $request)
{
    $unit = Unit::find($request->unit_id);
    
    if (!$unit) {
        return response()->json(['error' => 'Unit not found'], 404);
    }
    
    $qty = $request->qty;
    
    // Ondalık kontrolü
    if (!$unit->is_decimal_stock && floor($qty) != $qty) {
        return response()->json([
            'error' => 'Bu birim ondalık stok desteklemiyor.'
        ], 422);
    }
    
    // Min/Max kontrolü
    if ($qty < $unit->min) {
        return response()->json([
            'error' => "Minimum miktar: {$unit->min}"
        ], 422);
    }
    
    if ($unit->max && $qty > $unit->max) {
        return response()->json([
            'error' => "Maximum miktar: {$unit->max}"
        ], 422);
        }
    
    return response()->json(['valid' => true]);
}
```

---

## 📊 Örnek Senaryolar

### Senaryo 1: Kilogram (Ondalık İzinli)
```
Unit: Kilogram
is_decimal_stock: true
price_prefix: "/kg"
stock_prefix: "kg"

✅ İzin Verilen:
- Stok: 10.5 kg
- Fiyat: ₺150/kg
- Toplam: ₺1,575

❌ İzin Verilmeyen:
- (Yok, her değer geçerli)
```

### Senaryo 2: Adet (Ondalık İzinsiz)
```
Unit: Adet
is_decimal_stock: false
price_prefix: null
stock_prefix: "adet"

✅ İzin Verilen:
- Stok: 10 adet
- Fiyat: ₺25
- Toplam: ₺250

❌ İzin Verilmeyen:
- Stok: 10.5 adet ❌ (otomatik 11'e yuvarlanır)
```

### Senaryo 3: Metrekare (Ondalık İzinli)
```
Unit: Metrekare
is_decimal_stock: true
price_prefix: "/m²"
stock_prefix: "m²"

✅ İzin Verilen:
- Stok: 25.75 m²
- Fiyat: ₺200/m²
- Toplam: ₺5,150

❌ İzin Verilmeyen:
- (Yok, her değer geçerli)
```

---

## 🎯 Uygulama Checklist

### ✅ Backend
- [x] Unit model'de `is_decimal_stock` field var
- [ ] ProductController'da qty validation
- [ ] VariantController'da qty validation
- [ ] Unit değişikliğinde auto-format

### ✅ Frontend
- [ ] Unit seçimi tüm formlarda
- [ ] Ondalık kontrolü input'larda
- [ ] Unit prefix gösterimi (fiyat/stok)
- [ ] Gerçek zamanlı validasyon
- [ ] Unit değişikliğinde warning
- [ ] Ürün listesinde unit-aware display
- [ ] Varyant tablosunda unit-aware display
- [ ] Toplu düzenlemede unit kontrolü

---

## 🚀 Öncelikli Düzeltmeler

1. **Product Create/Edit Form**
   - Unit seçimi ekle
   - Stok input'u unit-aware yap
   - Fiyat input'u unit prefix ile göster

2. **Product List**
   - Fiyat kolonunu unit prefix ile göster
   - Stok kolonunu unit prefix + decimal kontrolü ile göster

3. **Variant Manager**
   - Varyant fiyatlarını unit prefix ile göster
   - Varyant stoklarını unit decimal kontrolü ile göster
   - Toplu düzenlemede unit kurallarını uygula

4. **Quick Edit Drawers**
   - Stok quick edit'te unit kuralları
   - Fiyat quick edit'te unit prefix

---

**Son Güncelleme:** 1 Şubat 2026  
**Durum:** 🔴 Uygulanacak  
**Öncelik:** 🔥 Kritik
