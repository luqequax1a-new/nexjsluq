# SİSTEM ANALİZ RAPORU - SİPARİŞ, KARGO, ÖDEME VE MÜŞTERİ SİSTEMLERİ

**Tarih:** 2026-02-07  
**Analiz Kapsamı:** Sipariş Akışı, Kargo Yönetimi, Ödeme Sistemi, Müşteri Grupları, Müşteri Kaydı

---

## 🔴 KRİTİK SORUNLAR

### 1. **ÖDEME ÜCRETİ HESAPLAMA HATASI**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 267-268)

**Sorun:**
```php
$baseForPaymentFee = max(0, $subtotal + $shippingTotal - $couponDiscount);
$paymentFee = (float) $paymentMethod->getFeeAmount($baseForPaymentFee);
```

**Açıklama:**  
Ödeme ücreti hesaplanırken vergi (tax) dahil edilmiyor. Bu, özellikle yüzde bazlı ödeme ücretlerinde yanlış hesaplamaya neden olur.

**Çözüm:**
```php
$baseForPaymentFee = max(0, $subtotal + $taxTotal + $shippingTotal - $couponDiscount);
$paymentFee = (float) $paymentMethod->getFeeAmount($baseForPaymentFee);
```

**Etki:** Müşteriden eksik veya fazla ödeme ücreti alınması

---

### 2. **KUPON DOĞRULAMA ZAMANLAMA SORUNU**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 234-265)

**Sorun:**  
Kupon doğrulaması sipariş oluşturma sırasında yapılıyor, ancak sepetteki kupon geçerliliği gerçek zamanlı kontrol edilmiyor.

**Senaryolar:**
- Kullanıcı sepete kupon ekliyor
- Kuponun süresi doluyor veya kullanım limiti dolduruluyor
- Kullanıcı checkout'a gidiyor
- Sipariş oluşturulurken hata alıyor

**Çözüm:**  
Checkout sayfası yüklendiğinde kupon geçerliliğini kontrol et ve geçersizse otomatik kaldır.

**Etki:** Kötü kullanıcı deneyimi, sipariş tamamlama başarısızlığı

---

### 3. **STOK KONTROLÜ EKSİKLİĞİ - BACKORDER DURUMU**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 190-198)

**Sorun:**
```php
$allowBackorder = (bool) ($variant?->allow_backorder ?? $product->allow_backorder);

if (!$allowBackorder && $quantity > $stockQuantity) {
    throw ValidationException::withMessages([
        'items' => "{$product->name} için stok yetersiz.",
    ]);
}
```

**Açıklama:**  
Stok kontrolü sadece `allow_backorder=false` durumunda yapılıyor. Ancak:
- Stok negatife düşebilir (backorder aktifse)
- Stok limiti kontrolü yok
- Sepetteki ürün miktarı ile gerçek stok senkronizasyonu yok

**Çözüm:**
```php
// Backorder limiti ekle
if ($allowBackorder) {
    $backorderLimit = (int) ($variant?->backorder_limit ?? $product->backorder_limit ?? 0);
    if ($backorderLimit > 0 && ($quantity - $stockQuantity) > $backorderLimit) {
        throw ValidationException::withMessages([
            'items' => "{$product->name} için sipariş limiti aşıldı.",
        ]);
    }
}
```

**Etki:** Kontrolsüz stok azalması, sipariş karşılanamama riski

---

### 4. **MÜŞTERİ KAYIT SİSTEMİ - ŞİFRE DOĞRULAMA EKSİKLİĞİ**
**Dosya:** `frontend/src/app/checkout/_components/CheckoutPageContent.tsx` (Satır 166-187)

**Sorun:**
```typescript
const registerPayload = {
  first_name: values.first_name,
  last_name: values.last_name,
  email: values.email,
  phone,
  password: values.password,
  password_confirmation: values.password,  // ❌ Form'da password_confirmation alanı yok!
};
```

**Açıklama:**  
Frontend'de `password_confirmation` alanı form'da tanımlı değil, ancak backend'e gönderiliyor. Bu, backend validasyonunda hata verecektir.

**Backend Beklentisi:**
```php
'password' => ['required', 'string', 'min:6', 'confirmed'],
```

**Çözüm:**  
Checkout formuna şifre tekrar alanı ekle veya backend validasyonunu güncelle.

**Etki:** Müşteri kaydı başarısız olur, sipariş tamamlanamaz

---

### 5. **KARGO ÜCRETİ HESAPLAMA - COD (KAPIDA ÖDEME) HATASI**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 224-228)

**Sorun:**
```php
$shippingBase = (float) $cart->subtotal;
$shippingTotal = (float) $shippingMethod->calculateCost($shippingBase);
if ($validated['payment_method'] === 'cash_on_delivery' && $shippingMethod->cod_enabled) {
    $shippingTotal += (float) $shippingMethod->cod_fee;
}
```

**Açıklama:**  
COD ücreti kargo ücretine ekleniyor, ancak:
1. Frontend'de bu ücret gösterilmiyor
2. Kullanıcı toplam tutarı görmeden sipariş veriyor
3. Fiyat şeffaflığı sorunu

**Çözüm:**  
Frontend'de kargo yöntemi seçildiğinde COD ücretini göster.

**Etki:** Müşteri şikayetleri, güven kaybı

---

## 🟡 ORTA ÖNCELİKLİ SORUNLAR

### 6. **MÜŞTERİ GRUPLARI - OTOMATIK ATAMA ÇALIŞMIYOR**
**Dosya:** `backend/app/Models/CustomerGroup.php` (Satır 124-141)

**Sorun:**  
`runAutoAssignment()` metodu manuel çağrılmadıkça çalışmıyor. Sipariş tamamlandıktan sonra müşteri istatistikleri güncelleniyor ama grup ataması yapılmıyor.

**Çözüm:**  
Order model'inde sipariş tamamlandıktan sonra otomatik grup ataması ekle:

```php
// Order.php - updateStatus metoduna ekle
if ($newStatus === 'delivered' && $this->customer) {
    $this->customer->updateStats();
    
    // Auto-assign to groups
    $groups = CustomerGroup::where('is_active', true)
        ->whereNotNull('auto_assignment_rules')
        ->get();
    
    foreach ($groups as $group) {
        if ($group->shouldAutoAssign($this->customer)) {
            $group->assignCustomer($this->customer);
        }
    }
}
```

**Etki:** Müşteri segmentasyonu çalışmıyor, hedefli kampanyalar yapılamıyor

---

### 7. **SİPARİŞ NUMARASI ÇAKIŞMA RİSKİ**
**Dosya:** `backend/app/Models/Order.php` (Satır 130-149)

**Sorun:**
```php
$lastOrder = self::withTrashed()
    ->where('order_number', 'like', "{$prefixPattern}%")
    ->orderByDesc('id')
    ->first();
```

**Açıklama:**  
Yüksek trafikte aynı anda birden fazla sipariş oluşturulursa aynı sipariş numarası üretilebilir (race condition).

**Çözüm:**  
Database seviyesinde unique constraint ve retry mekanizması:

```php
protected static function booted(): void
{
    static::creating(function (Order $order) {
        if (empty($order->order_number)) {
            $maxRetries = 5;
            for ($i = 0; $i < $maxRetries; $i++) {
                try {
                    $order->order_number = self::generateOrderNumber();
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    if ($i === $maxRetries - 1) throw $e;
                    usleep(100000); // 100ms bekle
                }
            }
        }
    });
}
```

**Etki:** Sipariş numarası çakışması, veri bütünlüğü sorunu

---

### 8. **ADRES DOĞRULAMA EKSİKLİĞİ - POSTA KODU**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 287-308)

**Sorun:**
```php
$billingAddress['postal_code'] = PostalCodeResolver::resolve(
    $billingAddress['city'] ?? null,
    $billingAddress['state'] ?? null
);
```

**Açıklama:**  
`PostalCodeResolver` servisi kullanılıyor ancak:
1. Servis dosyası kontrol edilmedi (var mı?)
2. Hatalı il/ilçe kombinasyonunda ne döner?
3. Null dönerse sipariş oluşturulur mu?

**Çözüm:**  
PostalCodeResolver servisini kontrol et ve hata yönetimi ekle.

**Etki:** Yanlış posta kodu, kargo teslim sorunları

---

### 9. **ÖDEME YÖNTEMİ UYGUNLUK KONTROLÜ - MIN/MAX TUTAR**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 145-148)

**Sorun:**
```php
$amountForAvailability = (float) $cart->total;
if (!$paymentMethod->isAvailableForAmount($amountForAvailability)) {
    return response()->json(['message' => 'Ödeme yöntemi bu tutar için uygun değil.'], 422);
}
```

**Açıklama:**  
Kontrol yapılıyor ancak:
1. Frontend'de ödeme yöntemi seçilirken bu kontrol yapılmıyor
2. Kullanıcı uygun olmayan yöntemi seçebiliyor
3. Sipariş verirken hata alıyor

**Çözüm:**  
Frontend'de ödeme yöntemlerini getirirken filtreleme yap:

```typescript
// CheckoutPageContent.tsx
const data = await apiFetch<any[]>(
  `/api/storefront/payment-methods?amount=${encodeURIComponent(String(cart?.total ?? 0))}`,
  { auth: "none" }
);
```

**Not:** Bu zaten yapılmış! ✅ Ancak backend endpoint'i kontrol edilmeli.

**Etki:** Kullanıcı deneyimi sorunu

---

### 10. **KARGO YÖNTEMİ - ÜCRETSİZ KARGO THRESHOLD KONTROLÜ**
**Dosya:** `backend/app/Models/ShippingMethod.php` (Satır 36-43)

**Sorun:**
```php
public function calculateCost($subtotal): float
{
    if ($this->free_threshold !== null && $subtotal >= $this->free_threshold) {
        return 0;
    }
    
    return (float) $this->base_rate;
}
```

**Açıklama:**  
Ücretsiz kargo kontrolü sadece subtotal'a bakıyor. Ancak:
1. İndirim sonrası tutar kontrol edilmiyor
2. Kupon uygulandıktan sonra threshold altına düşebilir

**Çözüm:**  
İndirim öncesi veya sonrası tutar kullanılacağını belirle ve dokümante et.

**Etki:** Yanlış kargo ücreti hesaplaması

---

## 🟢 DÜŞÜK ÖNCELİKLİ SORUNLAR VE İYİLEŞTİRMELER

### 11. **MÜŞTERİ İSTATİSTİKLERİ - ASYNC GÜNCELLEME**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 341-343)

**Öneri:**
```php
if ($order->customer) {
    dispatch(fn() => $order->customer->updateStats())->afterResponse();
}
```

Müşteri istatistikleri güncellenmesi asenkron yapılmalı, sipariş oluşturma süresini etkilememeli.

---

### 12. **SEPET - KUPON KALDIRMA ENDPOINT EKSİKLİĞİ**
**Dosya:** `backend/app/Http/Controllers/Api/CartController.php` (Satır 219-237)

**Sorun:**  
`removeCoupon` endpoint'i var ancak frontend'de kullanılmıyor. Kullanıcı kuponu kaldıramıyor.

**Çözüm:**  
Frontend'e kupon kaldırma butonu ekle.

---

### 13. **SİPARİŞ TAKIP - GÜVENLİK SORUNU**
**Dosya:** `backend/app/Http/Controllers/Api/Storefront/OrderController.php` (Satır 24-57)

**Sorun:**
```php
$order = Order::query()
    ->whereRaw('LOWER(order_number) = ?', [strtolower($orderNumber)])
    ->where(function ($query) use ($email) {
        $query->whereHas('billingAddress', function ($addressQuery) use ($email) {
            $addressQuery->whereRaw('LOWER(email) = ?', [$email]);
        })->orWhereHas('shippingAddress', function ($addressQuery) use ($email) {
            $addressQuery->whereRaw('LOWER(email) = ?', [$email]);
        })->orWhereHas('customer', function ($customerQuery) use ($email) {
            $customerQuery->whereRaw('LOWER(email) = ?', [$email]);
        });
    })
    ->first();
```

**İyileştirme:**  
Rate limiting ekle, brute force saldırılarını önle:

```php
// routes/api.php
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/orders/track', [StorefrontOrderController::class, 'track']);
});
```

---

### 14. **CHECKOUT - FORM VALIDASYON EKSİKLİĞİ**
**Dosya:** `frontend/src/app/checkout/_components/CheckoutPageContent.tsx`

**Eksikler:**
- Telefon numarası formatı kontrolü (frontend'de)
- Email formatı kontrolü (frontend'de)
- TC Kimlik No validasyonu (varsa)
- Vergi numarası formatı (kurumsal fatura için)

**Çözüm:**  
Ant Design Form.Item rules kullanarak validasyon ekle.

---

### 15. **MÜŞTERİ GRUBU - DISCOUNT UYGULANMIYOR**
**Dosya:** `backend/app/Models/CustomerGroup.php`

**Sorun:**  
`discount_percentage` alanı var ancak hiçbir yerde kullanılmıyor. Müşteri grubuna göre otomatik indirim uygulanmıyor.

**Çözüm:**  
Sipariş oluşturulurken müşteri grubuna göre indirim uygula:

```php
// OrderController.php - store metodunda
if ($customer && $customer->groups()->exists()) {
    $maxDiscount = $customer->groups()
        ->where('is_active', true)
        ->max('discount_percentage');
    
    if ($maxDiscount > 0) {
        $groupDiscount = ($subtotal * $maxDiscount) / 100;
        $discountTotal += $groupDiscount;
    }
}
```

---

### 16. **STOK AZALTMA - TRANSACTION GÜVENLİĞİ**
**Dosya:** `backend/app/Models/Order.php` (Satır 403-420)

**Sorun:**
```php
public function decreaseStock(): void
{
    foreach ($this->items as $item) {
        if ($item->product_variant_id && $item->variant) {
            $variant = $item->variant;
            $nextQty = (float) $variant->qty - (float) $item->quantity;
            $variant->qty = $nextQty;
            $variant->in_stock = (bool) $variant->allow_backorder || $nextQty > 0;
            $variant->save();
        }
        // ...
    }
}
```

**Risk:**  
Race condition - aynı anda iki sipariş aynı ürünü sipariş ederse stok yanlış hesaplanabilir.

**Çözüm:**  
Atomic update kullan:

```php
DB::table('product_variants')
    ->where('id', $variant->id)
    ->decrement('qty', $item->quantity);
```

---

### 17. **EMAIL BİLDİRİMLERİ - HATA YÖNETİMİ**
**Dosya:** `backend/app/Models/Order.php` (Satır 358-379)

**İyileştirme:**  
Email gönderimi başarısız olursa retry mekanizması ekle:

```php
DB::afterCommit(function () use ($orderId, $historyId, $oldStatus) {
    dispatch(function () use ($orderId, $oldStatus) {
        $order = self::with(['billingAddress', 'shippingAddress', 'customer'])->find($orderId);
        if (!$order) return;
        
        $email = $order->getNotificationEmail();
        if (!$email) return;
        
        Mail::to($email)->send(new OrderStatusChangedMail($order, $oldStatus));
    })->onQueue('emails')->retry(3)->backoff([60, 300, 900]);
});
```

---

### 18. **FRONTEND - LOADING STATES**
**Dosya:** `frontend/src/app/checkout/_components/CheckoutPageContent.tsx`

**İyileştirme:**  
Ödeme yöntemleri ve kargo yöntemleri yüklenirken skeleton loader göster.

---

### 19. **BACKEND - API RESPONSE STANDARDIZASYONU**
**Genel Sorun:**  
API response'ları tutarsız:
- Bazıları `{ data: ... }` döner
- Bazıları direkt array döner
- Bazıları `{ message: ..., data: ... }` döner

**Çözüm:**  
API Resource kullanarak standardize et.

---

### 20. **DATABASE - INDEX EKSİKLİĞİ**
**Dosya:** `backend/database/migrations/2026_02_01_040406_create_orders_tables.php`

**Eksik indexler:**
- `orders.payment_method` (sık filtreleniyor)
- `orders.shipping_method` (sık filtreleniyor)
- `order_items.sku` (arama için)
- `customers.phone` (arama için)

**Çözüm:**
```php
$table->index('payment_method');
$table->index('shipping_method');
```

---

## 📊 ÖNCELİK SIRASI

### 🔴 HEMEN DÜZELTİLMELİ (1-3 gün)
1. Ödeme ücreti hesaplama hatası (#1)
2. Müşteri kayıt - şifre doğrulama (#4)
3. Stok kontrolü - backorder (#3)
4. Kargo ücreti - COD gösterimi (#5)

### 🟡 KISA VADEDE DÜZELTİLMELİ (1-2 hafta)
5. Kupon doğrulama zamanlama (#2)
6. Müşteri grupları otomatik atama (#6)
7. Sipariş numarası çakışma (#7)
8. Posta kodu doğrulama (#8)
9. Stok azaltma - transaction (#16)

### 🟢 ORTA VADEDE İYİLEŞTİRİLMELİ (1 ay)
10. Müşteri grubu indirim uygulaması (#15)
11. Email bildirimleri retry (#17)
12. API response standardizasyonu (#19)
13. Database index optimizasyonu (#20)
14. Frontend form validasyonları (#14)

---

## 🧪 TEST ÖNERİLERİ

### Unit Tests
- [ ] Sipariş toplam hesaplama (vergi, kargo, ödeme ücreti, kupon)
- [ ] Stok azaltma/artırma işlemleri
- [ ] Müşteri grup otomatik atama kuralları
- [ ] Kupon geçerlilik kontrolleri

### Integration Tests
- [ ] Tam sipariş akışı (sepet → checkout → sipariş)
- [ ] Müşteri kaydı ve ilk sipariş
- [ ] Kupon uygulama ve kaldırma
- [ ] Kargo ve ödeme yöntemi seçimi

### E2E Tests
- [ ] Misafir kullanıcı sipariş akışı
- [ ] Kayıtlı kullanıcı sipariş akışı
- [ ] Farklı ödeme yöntemleri ile sipariş
- [ ] Farklı kargo yöntemleri ile sipariş

---

## 📝 SONUÇ

**Toplam Tespit Edilen Sorun:** 20  
**Kritik:** 5  
**Orta Öncelik:** 5  
**Düşük Öncelik:** 10  

**Genel Değerlendirme:**  
Sistem genel olarak iyi yapılandırılmış ancak kritik hesaplama hataları ve kullanıcı deneyimi sorunları mevcut. Öncelikli olarak ödeme ve stok yönetimi sorunları çözülmeli.

**Tahmini Düzeltme Süresi:**  
- Kritik sorunlar: 3-5 gün
- Tüm sorunlar: 3-4 hafta

---

**Rapor Tarihi:** 2026-02-07  
**Hazırlayan:** Antigravity AI Assistant
