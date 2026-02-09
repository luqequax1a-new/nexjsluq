# 🎯 Sepet Teklifleri (Cart Offers) Sistemi - Detaylı Analiz ve Planlama

**Tarih:** 8 Şubat 2026  
**Proje:** LUQ Admin Monorepo + FleetCart Backend  
**Durum:** 🔴 Eski sistem kaldırılmış - Yeni sistem tasarlanacak

---

## 📊 MEVCUT DURUM ANALİZİ

### FleetCart Eski Sistem (Kaldırılmış)

**Kaldırılan Tablolar:**
- `cart_upsell_offers` - Teklif detayları
- `cart_upsell_rules` - Teklif kuralları
- `order_products.is_upsell` - Sipariş ürünlerinde teklif flag'i
- `order_products.upsell_data` - Teklif metadata

**Eski Sistemin Sorunları:**
1. ❌ **Spagetti Kod:** 1,595 satırlık admin form, 1,295 satırlık frontend component
2. ❌ **Statik Yapı:** Her değişiklik için kod güncellemesi gerekiyor
3. ❌ **Varyant Seçimi Karmaşık:** Modal üstüne modal, tutarsız UX
4. ❌ **Unit Entegrasyonu Eksik:** Birim (kg, m vb.) desteği yarım yamalak
5. ❌ **Bakım Zorluğu:** Çok fazla iç içe geçmiş logic

### Mevcut Kupon Sistemi (Referans)

✅ **Güçlü Yönler:**
- Temiz ve modüler yapı
- Full-page edit layout
- Dinamik form yapısı
- İyi validasyon sistemi

---

## 🎨 YENİ SİSTEM MİMARİSİ

### 1. Database Schema (Laravel)

```sql
-- Ana teklif tablosu
CREATE TABLE cart_offers (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),                    -- İç isim
    title JSON,                           -- Müşteriye gösterilen başlık (çoklu dil)
    description TEXT,                     -- Admin notu
    
    -- Yerleşim
    placement ENUM('cart', 'checkout', 'product_page', 'post_checkout'),
    
    -- Tetikleyici
    trigger_type ENUM('all_products', 'specific_products', 'specific_categories', 'cart_total'),
    trigger_config JSON,                  -- {product_ids: [], category_ids: [], min_total: 0, max_total: 0}
    
    -- Koşullar
    conditions JSON,                      -- {min_cart_total, max_cart_total, exclude_discounted, hide_if_in_cart}
    
    -- Kullanım
    usage_limit INT,
    used_count INT DEFAULT 0,
    per_customer_limit INT,
    
    -- Tarih
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    
    -- Görünüm
    display_config JSON,                  -- {countdown_enabled, countdown_minutes, badge_color, badge_text}
    
    -- Durum
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Teklif ürünleri (çoklu ürün desteği)
CREATE TABLE cart_offer_products (
    id BIGINT PRIMARY KEY,
    cart_offer_id BIGINT,
    
    -- Ürün
    product_id BIGINT,
    variant_id BIGINT NULL,              -- NULL = müşteri seçsin
    allow_variant_selection BOOLEAN DEFAULT false,
    
    -- Miktar
    default_quantity DECIMAL(10,3) DEFAULT 1,
    min_quantity DECIMAL(10,3),
    max_quantity DECIMAL(10,3),
    quantity_step DECIMAL(10,3) DEFAULT 1,
    
    -- Fiyat
    discount_type ENUM('percentage', 'fixed', 'none'),
    discount_value DECIMAL(10,2),
    
    -- Sıralama
    display_order INT DEFAULT 0,
    
    -- Koşul (zincirleme teklifler için)
    show_condition ENUM('always', 'if_accepted', 'if_rejected'),
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (cart_offer_id) REFERENCES cart_offers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Kullanım takibi
CREATE TABLE cart_offer_usage (
    id BIGINT PRIMARY KEY,
    cart_offer_id BIGINT,
    customer_id BIGINT NULL,
    order_id BIGINT NULL,
    session_id VARCHAR(255),
    used_at TIMESTAMP,
    
    FOREIGN KEY (cart_offer_id) REFERENCES cart_offers(id) ON DELETE CASCADE
);

-- Sipariş entegrasyonu
ALTER TABLE order_products ADD COLUMN offer_data JSON NULL;
-- {offer_id, offer_name, original_price, discount_amount, discount_type}
```

### 2. Backend Service (Laravel)

**CartOfferService.php** - Akıllı teklif çözücü

```php
class CartOfferService
{
    /**
     * Sepet için en uygun teklifi bul
     */
    public function resolveBestOffer(Cart $cart, string $placement = 'checkout'): ?array
    {
        // 1. Aktif teklifleri getir
        $offers = CartOffer::active()
            ->forPlacement($placement)
            ->withinDateRange()
            ->orderByDesc('priority')
            ->get();
        
        // 2. Koşulları kontrol et
        foreach ($offers as $offer) {
            if ($this->matchesConditions($cart, $offer)) {
                return $this->buildOfferData($offer, $cart);
            }
        }
        
        return null;
    }
    
    /**
     * Koşul kontrolü - Dinamik ve genişletilebilir
     */
    protected function matchesConditions(Cart $cart, CartOffer $offer): bool
    {
        $conditions = $offer->conditions;
        
        // Sepet tutarı kontrolü
        if (isset($conditions['min_cart_total'])) {
            if ($cart->subTotal()->amount() < $conditions['min_cart_total']) {
                return false;
            }
        }
        
        // Tetikleyici kontrolü
        return match($offer->trigger_type) {
            'all_products' => true,
            'specific_products' => $this->hasProducts($cart, $offer->trigger_config['product_ids']),
            'specific_categories' => $this->hasCategories($cart, $offer->trigger_config['category_ids']),
            'cart_total' => $this->inTotalRange($cart, $offer->trigger_config),
            default => false
        };
    }
    
    /**
     * Teklif verisini hazırla
     */
    protected function buildOfferData(CartOffer $offer, Cart $cart): array
    {
        $products = $offer->products()->with(['product', 'variant'])->get();
        
        return [
            'offer' => $offer,
            'products' => $products->map(function($offerProduct) {
                $item = $offerProduct->variant ?? $offerProduct->product;
                
                return [
                    'id' => $offerProduct->id,
                    'product_id' => $offerProduct->product_id,
                    'variant_id' => $offerProduct->variant_id,
                    'name' => $item->name,
                    'image' => $item->base_image?->url,
                    'original_price' => $item->selling_price->amount(),
                    'discount_price' => $this->calculatePrice($item, $offerProduct),
                    'quantity' => [
                        'default' => $offerProduct->default_quantity,
                        'min' => $offerProduct->min_quantity,
                        'max' => $offerProduct->max_quantity,
                        'step' => $offerProduct->quantity_step,
                    ],
                    'unit' => $item->unit ? [
                        'suffix' => $item->unit->suffix,
                        'decimal' => $item->unit->decimal_places,
                    ] : null,
                    'allow_variant_selection' => $offerProduct->allow_variant_selection,
                    'variants' => $offerProduct->allow_variant_selection 
                        ? $offerProduct->product->variants 
                        : null,
                ];
            }),
        ];
    }
}
```

### 3. Admin Panel (Next.js)

**Sayfa Yapısı:**
```
/admin/marketing/cart-offers/
├── page.tsx                    # Liste sayfası
├── new/
│   └── page.tsx               # Yeni teklif
└── [id]/
    └── edit/
        └── page.tsx           # Düzenleme
```

**CartOfferForm.tsx** - Dinamik ve Modüler

```tsx
'use client';

export default function CartOfferForm({ offerId }: { offerId?: string }) {
  const [form] = Form.useForm();
  const [offerProducts, setOfferProducts] = useState<OfferProduct[]>([]);

  return (
    <div className="full-page-edit">
      {/* Header */}
      <PageHeader
        variant="dark"
        title={offerId ? 'Teklifi Düzenle' : 'Yeni Teklif Oluştur'}
        actions={<SaveButton />}
      />

      <Form form={form} layout="vertical">
        {/* Temel Bilgiler */}
        <SectionCard title="Temel Bilgiler">
          <Form.Item name="name" label="İç İsim" required>
            <Input placeholder="Örn: Yaz İndirimi Sepet Teklifi" />
          </Form.Item>
          
          <Form.Item name="title" label="Müşteriye Gösterilen Başlık">
            <TranslatableInput />
          </Form.Item>
        </SectionCard>

        {/* Yerleşim */}
        <SectionCard title="Teklif Nerede Gösterilsin?">
          <Form.Item name="placement">
            <Radio.Group>
              <Radio value="cart">Sepet Sayfası</Radio>
              <Radio value="checkout">Ödeme Sayfası</Radio>
              <Radio value="product_page">Ürün Detay</Radio>
              <Radio value="post_checkout">Sipariş Sonrası</Radio>
            </Radio.Group>
          </Form.Item>
        </SectionCard>

        {/* Tetikleyici */}
        <SectionCard title="Ne Zaman Gösterilsin?">
          <TriggerSelector form={form} />
        </SectionCard>

        {/* Teklif Ürünleri - DİNAMİK */}
        <SectionCard 
          title="Teklif Ürünleri"
          extra={<Button onClick={addProduct}>+ Ürün Ekle</Button>}
        >
          {offerProducts.map((product, index) => (
            <OfferProductCard
              key={product.id}
              product={product}
              index={index}
              onUpdate={(data) => updateProduct(index, data)}
              onRemove={() => removeProduct(index)}
            />
          ))}
        </SectionCard>

        {/* Koşullar */}
        <SectionCard title="Koşullar">
          <ConditionsEditor form={form} />
        </SectionCard>

        {/* Görünüm */}
        <SectionCard title="Görünüm Ayarları">
          <DisplaySettings form={form} />
        </SectionCard>
      </Form>
    </div>
  );
}
```

**OfferProductCard.tsx** - Akıllı Ürün Kartı

```tsx
function OfferProductCard({ product, onUpdate, onRemove }: Props) {
  const [showVariantModal, setShowVariantModal] = useState(false);
  
  return (
    <Card className="offer-product-card">
      {/* Ürün Seçimi */}
      <ProductSelector
        value={product.product_id}
        onChange={(productId) => {
          onUpdate({ ...product, product_id: productId });
          // Ürün varyantlı mı kontrol et
          checkVariants(productId);
        }}
      />

      {/* Varyant Seçimi */}
      {product.has_variants && (
        <div className="variant-section">
          <Switch
            checked={product.allow_variant_selection}
            onChange={(checked) => 
              onUpdate({ ...product, allow_variant_selection: checked })
            }
          >
            Müşteri varyant seçsin
          </Switch>
          
          {!product.allow_variant_selection && (
            <VariantSelector
              productId={product.product_id}
              value={product.variant_id}
              onChange={(variantId) => 
                onUpdate({ ...product, variant_id: variantId })
              }
            />
          )}
        </div>
      )}

      {/* Miktar Ayarları - BİRİM ENTEGRE */}
      <QuantitySettings
        defaultQty={product.default_quantity}
        minQty={product.min_quantity}
        maxQty={product.max_quantity}
        step={product.quantity_step}
        unit={product.unit}
        onChange={(qty) => onUpdate({ ...product, ...qty })}
      />

      {/* İndirim */}
      <DiscountSettings
        type={product.discount_type}
        value={product.discount_value}
        originalPrice={product.original_price}
        onChange={(discount) => onUpdate({ ...product, ...discount })}
      />

      {/* Koşul (Zincirleme) */}
      <Form.Item label="Gösterim Koşulu">
        <Select value={product.show_condition}>
          <Option value="always">Her Zaman</Option>
          <Option value="if_accepted">Önceki Kabul Edilirse</Option>
          <Option value="if_rejected">Önceki Reddedilirse</Option>
        </Select>
      </Form.Item>

      <Button danger onClick={onRemove}>Kaldır</Button>
    </Card>
  );
}
```

### 4. Frontend (Storefront)

**CartOfferModal.tsx** - Modern ve Temiz

```tsx
'use client';

export function CartOfferModal({ offer }: { offer: CartOffer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const currentProduct = offer.products[currentIndex];

  const handleAccept = async () => {
    await addToCart({
      offer_id: offer.id,
      product_id: currentProduct.product_id,
      variant_id: selectedVariant || currentProduct.variant_id,
      quantity: quantity,
    });

    // Sonraki ürüne geç
    moveToNext('accepted');
  };

  const moveToNext = (action: 'accepted' | 'rejected') => {
    const nextIndex = offer.products.findIndex((p, i) => 
      i > currentIndex && 
      (p.show_condition === 'always' || p.show_condition === `if_${action}`)
    );

    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      closeModal();
    }
  };

  return (
    <Modal open={true} className="cart-offer-modal">
      {/* Ürün Görseli */}
      <Image src={currentProduct.image} alt={currentProduct.name} />

      {/* Başlık */}
      <h2>{offer.title}</h2>
      <p className="product-name">{currentProduct.name}</p>

      {/* Fiyat */}
      <div className="price-section">
        {currentProduct.discount_price < currentProduct.original_price && (
          <span className="original-price">
            {formatPrice(currentProduct.original_price)}
          </span>
        )}
        <span className="discount-price">
          {formatPrice(currentProduct.discount_price)}
        </span>
      </div>

      {/* Varyant Seçimi */}
      {currentProduct.allow_variant_selection && (
        <VariantSelector
          variants={currentProduct.variants}
          selected={selectedVariant}
          onChange={setSelectedVariant}
        />
      )}

      {/* Miktar - BİRİM DESTEKLI */}
      <QuantityInput
        value={quantity}
        min={currentProduct.quantity.min}
        max={currentProduct.quantity.max}
        step={currentProduct.quantity.step}
        unit={currentProduct.unit}
        onChange={setQuantity}
      />

      {/* Aksiyonlar */}
      <div className="actions">
        <Button onClick={() => moveToNext('rejected')} variant="ghost">
          Hayır, Teşekkürler
        </Button>
        <Button onClick={handleAccept} variant="primary">
          Sepete Ekle
        </Button>
      </div>

      {/* Geri Sayım */}
      {offer.display_config.countdown_enabled && (
        <Countdown minutes={offer.display_config.countdown_minutes} />
      )}
    </Modal>
  );
}
```

---

## 🎯 YENİ SİSTEMİN ÜSTÜNLÜKLERİ

### 1. ✅ Tamamen Dinamik
- Admin panelden her şey ayarlanabilir
- Kod değişikliği gerektirmez
- Kolay bakım ve güncelleme

### 2. ✅ Birim Entegrasyonu
- Kg, m, adet vb. tüm birimler desteklenir
- Minimum, maksimum, adım değerleri
- Ondalık sayı desteği

### 3. ✅ Akıllı Varyant Yönetimi
- Müşteri seçsin / Sabit varyant
- Temiz modal yapısı
- Stok kontrolü entegre

### 4. ✅ Zincirleme Teklifler
- Kabul/Red durumuna göre sonraki teklif
- Sınırsız ürün zinciri
- Koşullu gösterim

### 5. ✅ Tam Entegrasyon
- Sepet sistemi
- Sipariş sistemi
- Mail şablonları
- Admin raporları

### 6. ✅ Modern UX
- Full-page edit layout
- Drag & drop sıralama
- Canlı önizleme
- Responsive tasarım

---

## 📋 UYGULAMA PLANI

### Faz 1: Backend (3-4 gün)
1. Migration'ları oluştur
2. Model'leri yaz (CartOffer, CartOfferProduct)
3. CartOfferService'i geliştir
4. Controller'ları yaz (CRUD + resolve)
5. API endpoint'leri ekle
6. Validasyon kuralları

### Faz 2: Admin Panel (4-5 gün)
1. Liste sayfası
2. Form component'leri
3. Ürün seçici
4. Varyant yönetimi
5. Miktar ayarları
6. Koşul editörü
7. Önizleme

### Faz 3: Frontend (3-4 gün)
1. Modal component
2. Varyant seçici
3. Miktar input (birim destekli)
4. Sepete ekleme logic
5. Geri sayım
6. Animasyonlar

### Faz 4: Entegrasyon (2-3 gün)
1. Sepet entegrasyonu
2. Checkout entegrasyonu
3. Sipariş kaydetme
4. Mail şablonları
5. Admin sipariş görünümü

### Faz 5: Test & Polish (2-3 gün)
1. Unit testler
2. Integration testler
3. UX iyileştirmeleri
4. Performance optimizasyonu
5. Dokümantasyon

**Toplam Süre:** 14-19 gün

---

## 🎨 TASARIM PRENSİPLERİ

1. **Basitlik:** Karmaşık değil, sezgisel
2. **Esneklik:** Her senaryoya uyum
3. **Performans:** Hızlı ve optimize
4. **Bakım:** Kolay genişletilebilir
5. **UX:** Kullanıcı odaklı

---

**Hazırlayan:** Antigravity AI  
**Tarih:** 8 Şubat 2026  
**Durum:** Planlama Tamamlandı - Onay Bekleniyor
