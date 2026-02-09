# 🔧 Sepet Teklifleri - Teknik Spesifikasyon

## 📁 Dosya Yapısı

### Backend (Laravel)

```
FleetCart/
├── app/
│   └── Models/
│       ├── CartOffer.php
│       └── CartOfferProduct.php
├── app/Http/
│   └── Controllers/
│       └── Api/
│           └── CartOfferController.php
├── app/Services/
│   └── CartOfferService.php
├── database/
│   └── migrations/
│       ├── 2026_02_09_000001_create_cart_offers_table.php
│       ├── 2026_02_09_000002_create_cart_offer_products_table.php
│       └── 2026_02_09_000003_create_cart_offer_usage_table.php
└── routes/
    └── api.php
```

### Frontend (Next.js)

```
frontend/src/
├── app/admin/marketing/cart-offers/
│   ├── page.tsx                          # Liste
│   ├── new/page.tsx                      # Yeni
│   └── [id]/edit/page.tsx               # Düzenle
├── components/admin/cart-offers/
│   ├── CartOfferForm.tsx                # Ana form
│   ├── OfferProductCard.tsx             # Ürün kartı
│   ├── TriggerSelector.tsx              # Tetikleyici
│   ├── ConditionsEditor.tsx             # Koşullar
│   ├── QuantitySettings.tsx             # Miktar
│   └── DisplaySettings.tsx              # Görünüm
└── components/storefront/
    └── CartOfferModal.tsx               # Müşteri modal
```

---

## 🗄️ Database Schema Detayları

### cart_offers

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | BIGINT | Primary key |
| name | VARCHAR(255) | İç isim (admin için) |
| title | JSON | Müşteri başlığı `{"tr": "...", "en": "..."}` |
| description | TEXT | Admin notu |
| placement | ENUM | `cart`, `checkout`, `product_page`, `post_checkout` |
| trigger_type | ENUM | `all_products`, `specific_products`, `specific_categories`, `cart_total` |
| trigger_config | JSON | Tetikleyici ayarları |
| conditions | JSON | Koşullar |
| usage_limit | INT | Toplam kullanım limiti |
| used_count | INT | Kullanım sayacı |
| per_customer_limit | INT | Müşteri başına limit |
| starts_at | TIMESTAMP | Başlangıç |
| ends_at | TIMESTAMP | Bitiş |
| display_config | JSON | Görünüm ayarları |
| priority | INT | Öncelik (yüksek önce) |
| is_active | BOOLEAN | Aktif mi? |

**trigger_config Örnek:**
```json
{
  "product_ids": [1, 2, 3],
  "category_ids": [5, 6],
  "min_total": 100,
  "max_total": 500
}
```

**conditions Örnek:**
```json
{
  "min_cart_total": 50,
  "max_cart_total": 1000,
  "exclude_discounted": true,
  "hide_if_in_cart": true,
  "min_items": 2
}
```

**display_config Örnek:**
```json
{
  "countdown_enabled": true,
  "countdown_minutes": 15,
  "badge_color": "#ff6b6b",
  "badge_text": "ÖNERİ",
  "position": "bottom-right"
}
```

### cart_offer_products

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | BIGINT | Primary key |
| cart_offer_id | BIGINT | FK → cart_offers |
| product_id | BIGINT | FK → products |
| variant_id | BIGINT NULL | FK → product_variants |
| allow_variant_selection | BOOLEAN | Müşteri seçsin mi? |
| default_quantity | DECIMAL(10,3) | Varsayılan miktar |
| min_quantity | DECIMAL(10,3) | Minimum |
| max_quantity | DECIMAL(10,3) | Maksimum |
| quantity_step | DECIMAL(10,3) | Adım (0.5, 0.25 vb.) |
| discount_type | ENUM | `percentage`, `fixed`, `none` |
| discount_value | DECIMAL(10,2) | İndirim değeri |
| display_order | INT | Sıralama |
| show_condition | ENUM | `always`, `if_accepted`, `if_rejected` |

---

## 🔌 API Endpoints

### Admin API

```
GET    /api/admin/cart-offers              # Liste
GET    /api/admin/cart-offers/{id}         # Detay
POST   /api/admin/cart-offers              # Oluştur
PUT    /api/admin/cart-offers/{id}         # Güncelle
DELETE /api/admin/cart-offers/{id}         # Sil
GET    /api/admin/cart-offers/{id}/stats   # İstatistikler
```

### Storefront API

```
POST   /api/cart/offers/resolve            # Teklif çözümle
POST   /api/cart/offers/accept             # Teklifi kabul et
POST   /api/cart/offers/reject             # Teklifi reddet
```

---

## 💻 Backend Kod Örnekleri

### CartOffer Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class CartOffer extends Model
{
    protected $fillable = [
        'name', 'title', 'description', 'placement', 'trigger_type',
        'trigger_config', 'conditions', 'usage_limit', 'per_customer_limit',
        'starts_at', 'ends_at', 'display_config', 'priority', 'is_active'
    ];

    protected $casts = [
        'title' => 'array',
        'trigger_config' => 'array',
        'conditions' => 'array',
        'display_config' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(CartOfferProduct::class)->orderBy('display_order');
    }

    public function usage(): HasMany
    {
        return $this->hasMany(CartOfferUsage::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForPlacement(Builder $query, string $placement): Builder
    {
        return $query->where('placement', $placement);
    }

    public function scopeWithinDateRange(Builder $query): Builder
    {
        $now = now();
        return $query->where(function ($q) use ($now) {
            $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
        })->where(function ($q) use ($now) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
        });
    }

    // Methods
    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->ends_at && $this->ends_at->isPast()) return false;

        return true;
    }

    public function canBeUsedByCustomer(?int $customerId): bool
    {
        if (!$customerId || !$this->per_customer_limit) return true;

        $usageCount = $this->usage()
            ->where('customer_id', $customerId)
            ->count();

        return $usageCount < $this->per_customer_limit;
    }

    public function incrementUsage(?int $customerId = null, ?int $orderId = null): void
    {
        $this->increment('used_count');

        $this->usage()->create([
            'customer_id' => $customerId,
            'order_id' => $orderId,
            'session_id' => session()->getId(),
            'used_at' => now(),
        ]);
    }
}
```

### CartOfferService

```php
<?php

namespace App\Services;

use App\Models\CartOffer;
use Modules\Cart\Cart;
use Illuminate\Support\Collection;

class CartOfferService
{
    public function resolveBestOffer(
        Cart $cart, 
        string $placement = 'checkout',
        ?int $customerId = null
    ): ?array {
        $offers = CartOffer::active()
            ->forPlacement($placement)
            ->withinDateRange()
            ->orderByDesc('priority')
            ->with(['products.product.unit', 'products.variant'])
            ->get();

        foreach ($offers as $offer) {
            if (!$offer->canBeUsedByCustomer($customerId)) {
                continue;
            }

            if ($this->matchesConditions($cart, $offer)) {
                return $this->buildOfferData($offer, $cart);
            }
        }

        return null;
    }

    protected function matchesConditions(Cart $cart, CartOffer $offer): bool
    {
        $conditions = $offer->conditions ?? [];
        $cartSubTotal = $cart->subTotal()->amount();

        // Minimum sepet tutarı
        if (isset($conditions['min_cart_total']) && 
            $cartSubTotal < $conditions['min_cart_total']) {
            return false;
        }

        // Maksimum sepet tutarı
        if (isset($conditions['max_cart_total']) && 
            $cartSubTotal > $conditions['max_cart_total']) {
            return false;
        }

        // İndirimli ürün varsa gösterme
        if ($conditions['exclude_discounted'] ?? false) {
            $hasDiscounted = $cart->items()->contains(function ($item) {
                return $item->product->has_special_price || 
                       ($item->variant && $item->variant->has_special_price);
            });
            
            if ($hasDiscounted) return false;
        }

        // Tetikleyici kontrolü
        return $this->matchesTrigger($cart, $offer);
    }

    protected function matchesTrigger(Cart $cart, CartOffer $offer): bool
    {
        $config = $offer->trigger_config ?? [];

        return match($offer->trigger_type) {
            'all_products' => true,
            
            'specific_products' => $cart->items()->contains(function ($item) use ($config) {
                return in_array($item->product->id, $config['product_ids'] ?? []);
            }),
            
            'specific_categories' => $cart->items()->contains(function ($item) use ($config) {
                return $item->product->categories
                    ->pluck('id')
                    ->intersect($config['category_ids'] ?? [])
                    ->isNotEmpty();
            }),
            
            'cart_total' => $this->inTotalRange($cart, $config),
            
            default => false
        };
    }

    protected function inTotalRange(Cart $cart, array $config): bool
    {
        $total = $cart->subTotal()->amount();
        
        if (isset($config['min_total']) && $total < $config['min_total']) {
            return false;
        }
        
        if (isset($config['max_total']) && $total > $config['max_total']) {
            return false;
        }
        
        return true;
    }

    protected function buildOfferData(CartOffer $offer, Cart $cart): array
    {
        return [
            'offer' => [
                'id' => $offer->id,
                'title' => $offer->title[app()->getLocale()] ?? $offer->title['tr'],
                'display_config' => $offer->display_config,
            ],
            'products' => $offer->products->map(function ($offerProduct) {
                $item = $offerProduct->variant ?? $offerProduct->product;
                $originalPrice = $item->selling_price->amount();
                
                $discountedPrice = $this->calculateDiscountedPrice(
                    $originalPrice,
                    $offerProduct->discount_type,
                    $offerProduct->discount_value
                );

                return [
                    'id' => $offerProduct->id,
                    'product_id' => $offerProduct->product_id,
                    'variant_id' => $offerProduct->variant_id,
                    'name' => $item->name,
                    'image' => $item->base_image?->url,
                    'sku' => $item->sku,
                    'original_price' => $originalPrice,
                    'discounted_price' => $discountedPrice,
                    'discount_amount' => $originalPrice - $discountedPrice,
                    'quantity' => [
                        'default' => $offerProduct->default_quantity,
                        'min' => $offerProduct->min_quantity,
                        'max' => $offerProduct->max_quantity,
                        'step' => $offerProduct->quantity_step,
                    ],
                    'unit' => $item->unit ? [
                        'suffix' => $item->unit->suffix,
                        'decimal_places' => $item->unit->decimal_places,
                    ] : null,
                    'allow_variant_selection' => $offerProduct->allow_variant_selection,
                    'variants' => $offerProduct->allow_variant_selection 
                        ? $this->formatVariants($offerProduct->product)
                        : null,
                    'show_condition' => $offerProduct->show_condition,
                    'in_stock' => $item->in_stock && (!$item->manage_stock || $item->qty > 0),
                ];
            })->toArray(),
        ];
    }

    protected function calculateDiscountedPrice(
        float $originalPrice, 
        string $type, 
        float $value
    ): float {
        return match($type) {
            'percentage' => max($originalPrice * (1 - $value / 100), 0),
            'fixed' => max($originalPrice - $value, 0),
            default => $originalPrice
        };
    }

    protected function formatVariants($product): array
    {
        return $product->variants->map(function ($variant) {
            return [
                'id' => $variant->id,
                'name' => $variant->name,
                'sku' => $variant->sku,
                'price' => $variant->selling_price->amount(),
                'image' => $variant->base_image?->url,
                'in_stock' => $variant->in_stock && (!$variant->manage_stock || $variant->qty > 0),
            ];
        })->toArray();
    }
}
```

---

## 🎨 Frontend Kod Örnekleri

### QuantitySettings Component

```tsx
'use client';

import { Form, InputNumber, Space, Typography } from 'antd';

interface QuantitySettingsProps {
  defaultQty: number;
  minQty: number;
  maxQty: number;
  step: number;
  unit?: { suffix: string; decimal_places: number };
  onChange: (values: any) => void;
}

export function QuantitySettings({
  defaultQty,
  minQty,
  maxQty,
  step,
  unit,
  onChange
}: QuantitySettingsProps) {
  const decimalPlaces = unit?.decimal_places ?? 0;
  const suffix = unit?.suffix ?? 'adet';

  return (
    <div className="quantity-settings">
      <Typography.Title level={5}>Miktar Ayarları</Typography.Title>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Form.Item label="Varsayılan Miktar">
          <InputNumber
            value={defaultQty}
            min={minQty}
            max={maxQty}
            step={step}
            precision={decimalPlaces}
            addonAfter={suffix}
            onChange={(val) => onChange({ defaultQty: val })}
          />
        </Form.Item>

        <Form.Item label="Minimum Miktar">
          <InputNumber
            value={minQty}
            min={0}
            step={step}
            precision={decimalPlaces}
            addonAfter={suffix}
            onChange={(val) => onChange({ minQty: val })}
          />
        </Form.Item>

        <Form.Item label="Maksimum Miktar">
          <InputNumber
            value={maxQty}
            min={minQty}
            step={step}
            precision={decimalPlaces}
            addonAfter={suffix}
            onChange={(val) => onChange({ maxQty: val })}
          />
        </Form.Item>

        <Form.Item label="Adım Değeri">
          <InputNumber
            value={step}
            min={0.001}
            max={100}
            step={0.001}
            precision={3}
            onChange={(val) => onChange({ step: val })}
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Örn: 0.5 = Yarım {suffix} artışlar
          </Typography.Text>
        </Form.Item>
      </Space>
    </div>
  );
}
```

### CartOfferModal (Storefront)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Image, InputNumber } from 'antd';

export function CartOfferModal({ offer, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [countdown, setCountdown] = useState(0);

  const currentProduct = offer.products[currentIndex];

  useEffect(() => {
    if (offer.display_config.countdown_enabled) {
      setCountdown(offer.display_config.countdown_minutes * 60);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && offer.display_config.countdown_enabled) {
      onClose();
    }
  }, [countdown]);

  const handleAccept = async () => {
    try {
      await fetch('/api/cart/offers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offer.id,
          product_id: currentProduct.product_id,
          variant_id: selectedVariant || currentProduct.variant_id,
          quantity: quantity,
        }),
      });

      moveToNext('accepted');
    } catch (error) {
      console.error('Failed to accept offer:', error);
    }
  };

  const moveToNext = (action: 'accepted' | 'rejected') => {
    const nextIndex = offer.products.findIndex((p, i) => 
      i > currentIndex && 
      (p.show_condition === 'always' || p.show_condition === `if_${action}`)
    );

    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
      setQuantity(offer.products[nextIndex].quantity.default);
      setSelectedVariant(null);
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      width={500}
      className="cart-offer-modal"
    >
      {/* Countdown */}
      {offer.display_config.countdown_enabled && countdown > 0 && (
        <div className="countdown-badge">
          ⏱️ {formatTime(countdown)}
        </div>
      )}

      {/* Image */}
      <div className="product-image">
        <Image 
          src={currentProduct.image} 
          alt={currentProduct.name}
          preview={false}
        />
      </div>

      {/* Title */}
      <h2 className="offer-title">{offer.title}</h2>
      <p className="product-name">{currentProduct.name}</p>

      {/* Price */}
      <div className="price-section">
        {currentProduct.discount_amount > 0 && (
          <>
            <span className="original-price">
              {formatPrice(currentProduct.original_price)}
            </span>
            <span className="discount-badge">
              -{formatPrice(currentProduct.discount_amount)} İNDİRİM
            </span>
          </>
        )}
        <span className="final-price">
          {formatPrice(currentProduct.discounted_price)}
        </span>
      </div>

      {/* Variant Selection */}
      {currentProduct.allow_variant_selection && (
        <div className="variant-selector">
          <label>Varyant Seçin:</label>
          <div className="variant-grid">
            {currentProduct.variants.map((variant) => (
              <button
                key={variant.id}
                className={`variant-option ${selectedVariant === variant.id ? 'selected' : ''}`}
                onClick={() => setSelectedVariant(variant.id)}
                disabled={!variant.in_stock}
              >
                {variant.image && <img src={variant.image} alt={variant.name} />}
                <span>{variant.name}</span>
                {!variant.in_stock && <span className="out-of-stock">Stokta Yok</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="quantity-selector">
        <label>Miktar:</label>
        <InputNumber
          value={quantity}
          min={currentProduct.quantity.min}
          max={currentProduct.quantity.max}
          step={currentProduct.quantity.step}
          precision={currentProduct.unit?.decimal_places ?? 0}
          addonAfter={currentProduct.unit?.suffix ?? 'adet'}
          onChange={(val) => setQuantity(val || currentProduct.quantity.default)}
        />
      </div>

      {/* Actions */}
      <div className="modal-actions">
        <Button 
          size="large" 
          onClick={() => moveToNext('rejected')}
        >
          Hayır, Teşekkürler
        </Button>
        <Button 
          type="primary" 
          size="large"
          onClick={handleAccept}
          disabled={currentProduct.allow_variant_selection && !selectedVariant}
        >
          Sepete Ekle
        </Button>
      </div>

      {/* Progress */}
      {offer.products.length > 1 && (
        <div className="offer-progress">
          {currentIndex + 1} / {offer.products.length}
        </div>
      )}
    </Modal>
  );
}
```

---

## 📊 Performans Optimizasyonları

1. **Eager Loading:** İlişkili verileri tek sorguda çek
2. **Caching:** Aktif teklifleri cache'le (5 dakika)
3. **Index:** `placement`, `is_active`, `priority` kolonlarına index
4. **Lazy Loading:** Modal açılınca varyantları yükle
5. **Debounce:** Miktar değişimlerinde API çağrısı geciktir

---

**Hazırlayan:** Antigravity AI  
**Tarih:** 8 Şubat 2026  
**Versiyon:** 1.0
