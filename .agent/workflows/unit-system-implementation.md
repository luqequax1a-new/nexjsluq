# 🎯 Unit-Based System Implementation Plan

## 📋 Özet

FleetCart'taki unit (birim) sistemini FabricMarket'e tam olarak entegre ediyoruz.

**Temel Kural:** Tüm fiyat, stok ve miktar işlemleri UNIT bazlı olmalı.
- Unit'te `is_decimal_stock = true` ise → 10.5 kg ✅
- Unit'te `is_decimal_stock = false` ise → 10 adet ✅, 10.5 adet ❌

---

## 🔧 Yapılacaklar

### 1. Backend - Unit Model İyileştirme ⏱️ 30dk

**Dosya:** `backend/app/Models/Unit.php`

```php
// Eklenecek metodlar:
public function isDecimalStock(): bool
{
    return (bool) $this->is_decimal_stock;
}

public function normalizeQuantity(float $qty): float
{
    $min = (float) $this->min;
    $step = (float) $this->step;

    if ($qty < $min) {
        $qty = $min;
    }

    if ($step <= 0) {
        return $this->isDecimalStock() ? round($qty, 2) : round($qty);
    }

    $steps = round(($qty - $min) / $step);
    $normalized = $min + $steps * $step;

    return $this->isDecimalStock() ? round($normalized, 2) : round($normalized);
}

public function isValidQuantity(float $qty): bool
{
    if ($qty < ($this->min ?? 0)) {
        return false;
    }

    if ($this->max && $qty > $this->max) {
        return false;
    }

    // Ondalık kontrolü
    if (!$this->isDecimalStock() && floor($qty) != $qty) {
        return false;
    }

    return true;
}
```

---

### 2. Frontend - useUnit Hook ⏱️ 45dk

**Dosya:** `frontend/src/hooks/useUnit.ts` (YENİ)

```typescript
import { useMemo } from 'react';

export interface Unit {
    id: number;
    name: string;
    label: string;
    short_name: string;
    suffix: string;
    min: number;
    max: number | null;
    step: number;
    default_qty: number;
    price_prefix: string | null;
    stock_prefix: string | null;
    is_decimal_stock: boolean;
    is_active: boolean;
}

export function useUnit(unitId: number | null, units: Unit[]) {
    const selectedUnit = useMemo(() => {
        return units.find(u => u.id === unitId) || null;
    }, [unitId, units]);

    const isDecimalAllowed = useMemo(() => {
        return selectedUnit?.is_decimal_stock ?? false;
    }, [selectedUnit]);

    const inputMode = useMemo(() => {
        return isDecimalAllowed ? 'decimal' : 'numeric';
    }, [isDecimalAllowed]);

    const step = useMemo(() => {
        if (!selectedUnit) return 1;
        return isDecimalAllowed ? (selectedUnit.step || 0.1) : 1;
    }, [selectedUnit, isDecimalAllowed]);

    const precision = useMemo(() => {
        return isDecimalAllowed ? 2 : 0;
    }, [isDecimalAllowed]);

    const formatQuantity = (qty: number): string => {
        if (!selectedUnit) return qty.toString();
        
        const formatted = isDecimalAllowed 
            ? parseFloat(qty.toFixed(2)) 
            : Math.round(qty);
        
        return selectedUnit.stock_prefix 
            ? `${formatted} ${selectedUnit.stock_prefix}` 
            : formatted.toString();
    };

    const formatPrice = (price: number): string => {
        if (!selectedUnit) return `₺${price}`;
        
        return selectedUnit.price_prefix 
            ? `₺${price}${selectedUnit.price_prefix}` 
            : `₺${price}`;
    };

    const normalizeQuantity = (qty: number): number => {
        if (!selectedUnit) return qty;
        
        return isDecimalAllowed 
            ? parseFloat(qty.toFixed(2)) 
            : Math.round(qty);
    };

    const validateQuantity = (qty: number): { valid: boolean; error?: string } => {
        if (!selectedUnit) return { valid: true };

        const min = selectedUnit.min || 0;
        if (qty < min) {
            return { 
                valid: false, 
                error: `Minimum miktar: ${min} ${selectedUnit.stock_prefix || ''}` 
            };
        }

        if (selectedUnit.max && qty > selectedUnit.max) {
            return { 
                valid: false, 
                error: `Maximum miktar: ${selectedUnit.max} ${selectedUnit.stock_prefix || ''}` 
            };
        }

        if (!isDecimalAllowed && qty % 1 !== 0) {
            return { 
                valid: false, 
                error: 'Bu birim ondalık sayı desteklemiyor.' 
            };
        }

        return { valid: true };
    };

    return {
        selectedUnit,
        isDecimalAllowed,
        inputMode,
        step,
        precision,
        formatQuantity,
        formatPrice,
        normalizeQuantity,
        validateQuantity,
    };
}
```

---

### 3. Product List - Unit-Aware Display ⏱️ 1 saat

**Dosya:** `frontend/src/app/admin/products/page.tsx`

**Değişiklikler:**

```typescript
// 1. Units state ekle
const [units, setUnits] = useState<Unit[]>([]);

// 2. Units fetch et
useEffect(() => {
    const fetchUnits = async () => {
        const data = await getUnits({ is_active: true, paginate: false });
        setUnits(data.units || []);
    };
    fetchUnits();
}, []);

// 3. Fiyat kolonunu güncelle
{
    title: 'Fiyat',
    dataIndex: 'price',
    render: (price, record) => {
        const unit = units.find(u => u.id === record.unit_id);
        if (!unit) return `₺${price}`;
        
        return unit.price_prefix 
            ? `₺${price}${unit.price_prefix}` 
            : `₺${price}`;
    }
}

// 4. Stok kolonunu güncelle
{
    title: 'Stok',
    dataIndex: 'qty',
    render: (qty, record) => {
        const unit = units.find(u => u.id === record.unit_id);
        if (!unit) return qty;
        
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

### 4. Product Create/Edit - Unit Integration ⏱️ 2 saat

**Dosya:** `frontend/src/app/admin/product/new/page.tsx` ve `edit/[id]/page.tsx`

**Değişiklikler:**

```typescript
// 1. useUnit hook kullan
const { 
    selectedUnit, 
    isDecimalAllowed, 
    inputMode, 
    step, 
    precision,
    formatQuantity,
    formatPrice,
    normalizeQuantity,
    validateQuantity 
} = useUnit(form.getFieldValue('unit_id'), units);

// 2. Unit değişikliğinde auto-format
useEffect(() => {
    if (selectedUnit && !selectedUnit.is_decimal_stock) {
        const qty = form.getFieldValue('qty');
        if (qty && qty % 1 !== 0) {
            const rounded = Math.round(qty);
            form.setFieldValue('qty', rounded);
            message.warning('Stok miktarı en yakın tam sayıya yuvarlandı.');
        }
        
        // Varyant stoklarını da yuvarla
        const variants = form.getFieldValue('variants') || [];
        variants.forEach((v: any, index: number) => {
            if (v.qty && v.qty % 1 !== 0) {
                form.setFieldValue(['variants', index, 'qty'], Math.round(v.qty));
            }
        });
    }
}, [selectedUnit]);

// 3. Stok input'u güncelle
<Form.Item label="Stok Miktarı" name="qty">
    <InputNumber
        min={selectedUnit?.min || 0}
        max={selectedUnit?.max || 999999}
        step={step}
        precision={precision}
        inputMode={inputMode}
        addonAfter={selectedUnit?.stock_prefix}
        onChange={(value) => {
            if (value) {
                const validation = validateQuantity(value);
                if (!validation.valid) {
                    message.error(validation.error);
                }
            }
        }}
    />
</Form.Item>

// 4. Fiyat input'u güncelle
<Form.Item label="Fiyat" name="price">
    <InputNumber
        min={0}
        step={0.01}
        precision={2}
        addonBefore="₺"
        addonAfter={selectedUnit?.price_prefix}
    />
</Form.Item>
```

---

### 5. Variant Manager - Unit Integration ⏱️ 1.5 saat

**Dosya:** `frontend/src/components/admin/product/VariantManager.tsx`

**Değişiklikler:**

```typescript
// Varyant tablosu kolonları
const columns = [
    // ... diğer kolonlar
    {
        title: 'Fiyat',
        dataIndex: 'price',
        render: (price: number) => {
            return selectedUnit?.price_prefix 
                ? `₺${price}${selectedUnit.price_prefix}` 
                : `₺${price}`;
        }
    },
    {
        title: 'Stok',
        dataIndex: 'qty',
        render: (qty: number) => {
            const formatted = selectedUnit?.is_decimal_stock 
                ? parseFloat(qty).toFixed(2) 
                : Math.round(qty);
            
            return selectedUnit?.stock_prefix 
                ? `${formatted} ${selectedUnit.stock_prefix}` 
                : formatted;
        }
    }
];

// Toplu düzenleme
const handleBulkStockUpdate = (value: number) => {
    const normalized = normalizeQuantity(value);
    
    selectedRowKeys.forEach(key => {
        const variant = variants.find(v => v.uid === key);
        if (variant) {
            variant.qty = normalized;
        }
    });
    
    message.success(`${selectedRowKeys.length} varyantın stoğu güncellendi`);
};
```

---

### 6. Quick Edit Drawers ⏱️ 1 saat

**Dosyalar:** 
- `frontend/src/components/admin/product/QuickEditInventory.tsx`
- `frontend/src/components/admin/product/QuickEditPricing.tsx`

**Değişiklikler:** Yukarıdaki unit-aware input pattern'lerini uygula.

---

## 📊 Test Senaryoları

### Test 1: Kilogram (Ondalık İzinli)
1. Unit seç: Kilogram (is_decimal_stock=true)
2. Stok gir: 10.5 → ✅ Kabul edilmeli
3. Fiyat gösterimi: "₺150/kg" olmalı
4. Stok gösterimi: "10.50 kg" olmalı

### Test 2: Adet (Ondalık İzinsiz)
1. Unit seç: Adet (is_decimal_stock=false)
2. Stok gir: 10.5 → ❌ 11'e yuvarlanmalı + warning
3. Fiyat gösterimi: "₺25" olmalı
4. Stok gösterimi: "11 adet" olmalı

### Test 3: Unit Değiştirme
1. Kilogram seç, stok: 10.5 kg
2. Adet'e değiştir → Stok otomatik 11'e yuvarlanmalı + warning

---

## ⏱️ Toplam Süre Tahmini

- Backend: 30dk
- Frontend Hook: 45dk
- Product List: 1 saat
- Product Form: 2 saat
- Variant Manager: 1.5 saat
- Quick Edit: 1 saat
- Test: 1 saat

**TOPLAM: ~7.5 saat**

---

## 🚀 Başlangıç

Hangi kısımdan başlamak istersiniz?

1. ✅ Backend Unit model metodları
2. ✅ Frontend useUnit hook
3. ✅ Product List güncelleme
4. ✅ Product Form güncelleme
5. ✅ Variant Manager güncelleme

**Öneri:** Backend'den başlayıp frontend'e doğru ilerleyelim.
