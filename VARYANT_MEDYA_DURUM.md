# ✅ MEDYA SİSTEMİ DURUM RAPORU

## 🎉 İYİ HABERLER

### Varyant Medya Bağlama ZATEN ÇALIŞIYOR! ✅

Backend kodunda varyant medya bağlama mantığı **zaten mevcut ve doğru çalışıyor**:

```php
// ProductController.php - Line 795-816 (store method)
if (!empty($variantMediaIds)) {
    $items = Media::query()
        ->whereIn('id', $variantMediaIds)
        ->lockForUpdate()
        ->get()
        ->keyBy('id');

    foreach ($variantMediaIds as $pos => $mid) {
        $m = $items->get($mid);
        if (!$m) continue;

        // Only allow attaching orphan/global media
        if (($m->scope ?? null) !== 'global') continue;
        if ($m->product_id !== null || $m->product_variant_id !== null) continue;

        $m->update([
            'scope' => 'variant',
            'product_variant_id' => $variant->id,
            'position' => $pos,
        ]);
    }
}
```

**Aynı mantık update() methodunda da var (Line 1189-1214)**

---

## 🔍 Sorun Nerede?

Eğer varyant medya bağlanmıyorsa, muhtemel sebepler:

### 1. Frontend'den `media_ids` Gönderilmiyor

**Kontrol:**
```typescript
// frontend/src/app/admin/(edit)/products/[id]/edit/page.tsx
// Line 444-473

let cleanedVariants = values.variants?.map((v: any, idx: number) => {
  // ...
  return {
    ...rest,
    id: merged.id || rest.id,
    uids: merged.uids ?? rest.uids,
    // ...
    media_ids: Array.isArray(merged.media_ids)
      ? merged.media_ids.map((id: any) => Number(id)).filter((id: number) => id > 0)
      : undefined,  // ← undefined ise backend'e gönderilmiyor!
  };
});
```

**Sorun:** `media_ids` undefined ise backend'e gönderilmiyor.

**Çözüm:**
```typescript
media_ids: Array.isArray(merged.media_ids)
  ? merged.media_ids.map((id: any) => Number(id)).filter((id: number) => id > 0)
  : [],  // ← Boş array gönder
```

---

### 2. Form State'te `media_ids` Güncellenmiyor

**Kontrol:**
```typescript
// VariantMediaDrawer.tsx - Line 82-87
form?.setFieldValue?.(["variants", idx, "media"], next);
form?.setFieldValue?.(
  ["variants", idx, "media_ids"],
  (next ?? []).map((m: any) => Number(m.id)).filter(Boolean),
);
```

**Test:**
```typescript
// Browser console'da:
window.__productForm.getFieldValue(['variants', 0, 'media_ids'])
// Beklenen: [123, 456, 789]
// Eğer undefined veya [] ise sorun burada
```

---

### 3. Medya Scope'u Zaten 'variant'

**Kontrol:**
```php
// Backend kontrolü:
if (($m->scope ?? null) !== 'global') continue;
```

Eğer medya zaten `scope='variant'` ise, backend onu atlar.

**Senaryo:**
1. Varyant medya yükle
2. Ürünü kaydet (medya varyanta bağlanır)
3. Aynı medyayı başka varyanta ekle
4. Kaydet → **Bağlanmaz** (çünkü scope artık 'variant')

**Çözüm:**
```php
// Backend'de scope kontrolünü gevşet:
if (($m->scope ?? null) !== 'global') {
    // Eğer başka bir varyanta bağlıysa, klonla
    if ($m->product_variant_id !== null && $m->product_variant_id !== $variant->id) {
        $newMedia = $m->replicate();
        $newMedia->scope = 'variant';
        $newMedia->product_variant_id = $variant->id;
        $newMedia->position = $pos;
        $newMedia->save();
        continue;
    }
}
```

---

## 🧪 Test Senaryoları

### Test 1: Yeni Ürün + Yeni Varyant + Medya

```
1. Yeni ürün oluştur
2. Varyant ekle (henüz kaydedilmemiş)
3. Varyanta medya yükle
4. Browser console:
   window.__productForm.getFieldValue(['variants', 0, 'media_ids'])
   // Beklenen: [123]
5. Ürünü kaydet
6. DB kontrol:
   SELECT * FROM media WHERE product_variant_id IS NOT NULL;
   // Beklenen: 1 row
```

### Test 2: Mevcut Ürün + Mevcut Varyant + Yeni Medya

```
1. Mevcut ürünü aç
2. Mevcut varyanta medya ekle
3. Browser console:
   window.__productForm.getFieldValue(['variants', 0, 'media_ids'])
   // Beklenen: [existing_ids, new_id]
4. Kaydet
5. DB kontrol:
   SELECT * FROM media WHERE product_variant_id = <variant_id>;
   // Beklenen: Tüm medya
```

### Test 3: Kütüphaneden Seç

```
1. Varyant medya drawer aç
2. "Kütüphaneden Seç" tıkla
3. Medya seç
4. Browser console:
   window.__productForm.getFieldValue(['variants', 0, 'media_ids'])
   // Beklenen: [selected_ids]
5. Kaydet
6. DB kontrol
```

---

## 🐛 Debug Adımları

### 1. Frontend Debug

```typescript
// VariantMediaDrawer.tsx - Line 77'ye ekle:
onItemsChange={(next) => {
  console.log('[VariantMediaDrawer] onItemsChange', {
    variantUids,
    idx: resolveVariantIndex(),
    next,
    mediaIds: next.map(m => m.id),
  });
  
  setItems(next);
  const idx = resolveVariantIndex();
  // ... rest of code
}}
```

### 2. Save Debug

```typescript
// page.tsx - save() methoduna ekle:
const save = useCallback(async (customValues?: any) => {
  try {
    await form.validateFields();
    setSaving(true);
    const values = customValues || form.getFieldsValue(true);
    
    // DEBUG
    console.log('[ProductEditPage] save - variants media_ids:', 
      values.variants?.map((v: any) => ({
        name: v.name,
        media_ids: v.media_ids,
      }))
    );
    
    // ... rest of code
  }
});
```

### 3. Backend Debug

```php
// ProductController.php - store() methodunda:
if (!empty($variantMediaIds)) {
    \Log::info('[ProductController@store] variant media attach', [
        'variant_id' => $variant->id,
        'media_ids' => $variantMediaIds,
    ]);
    
    // ... rest of code
    
    foreach ($variantMediaIds as $pos => $mid) {
        $m = $items->get($mid);
        if (!$m) {
            \Log::warning('[ProductController@store] media not found', ['id' => $mid]);
            continue;
        }
        
        if (($m->scope ?? null) !== 'global') {
            \Log::warning('[ProductController@store] media not global', [
                'id' => $mid,
                'scope' => $m->scope,
            ]);
            continue;
        }
        
        \Log::info('[ProductController@store] attaching media', [
            'media_id' => $mid,
            'variant_id' => $variant->id,
        ]);
        
        $m->update([...]);
    }
}
```

---

## 📋 Checklist

- [ ] Frontend'de `media_ids` undefined yerine `[]` gönder
- [ ] `VariantMediaDrawer` debug log ekle
- [ ] `save()` method debug log ekle
- [ ] Backend debug log ekle
- [ ] Test 1 çalıştır (Yeni ürün + yeni varyant)
- [ ] Test 2 çalıştır (Mevcut ürün + mevcut varyant)
- [ ] Test 3 çalıştır (Kütüphaneden seç)
- [ ] DB'de `media` tablosunu kontrol et

---

## 🎯 Muhtemel Çözüm

**En olası sorun:** Frontend'den `media_ids` gönderilmiyor veya `undefined` gönderiliyor.

**Hızlı Düzeltme:**

```typescript
// frontend/src/app/admin/(edit)/products/[id]/edit/page.tsx
// Line 470-472

media_ids: Array.isArray(merged.media_ids)
  ? merged.media_ids.map((id: any) => Number(id)).filter((id: number) => id > 0)
  : [],  // ← undefined yerine []
```

---

**Son Güncelleme:** 2026-02-08
