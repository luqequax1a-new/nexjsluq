<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use App\Models\GoogleProductCategory;

class Product extends Model
{
    use HasFactory;

    protected $appends = ['discount_price', 'unit', 'base_image', 'base_image_thumb'];

    protected $fillable = [
        'name',
        'slug',
        'price',
        'selling_price',
        'special_price',
        'special_price_type',
        'special_price_start',
        'special_price_end',
        'discount_start',
        'discount_end',
        'status',
        'short_description',
        'description',
        'sale_unit_id',
        'unit_type',
        'product_unit_id',
        'show_unit_pricing',
        'list_variants_separately',
        'qty',
        'allow_backorder',
        'in_stock',
        'sku',
        'gtin',
        'google_product_category_id',
        'brand_id',
        'tax_class_id',
        'meta_title',
        'meta_description',
        'is_active',
        'redirect_type',
        'redirect_target_id',
    ];

    protected $casts = [
        'price' => 'float',
        'selling_price' => 'float',
        'special_price' => 'float',
        'special_price_start' => 'datetime',
        'special_price_end' => 'datetime',
        'discount_start' => 'datetime',
        'discount_end' => 'datetime',
        'sale_unit_id' => 'integer',
        'product_unit_id' => 'integer',
        'tax_class_id' => 'integer',
        'show_unit_pricing' => 'boolean',
        'list_variants_separately' => 'boolean',
        'allow_backorder' => 'boolean',
        'in_stock' => 'boolean',
        'qty' => 'float',
        'is_active' => 'boolean',
        'redirect_target_id' => 'integer',
    ];
    
    // ... existing booted method ...

    public function taxClass(): BelongsTo
    {
        return $this->belongsTo(TaxClass::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            if (blank($product->slug) && filled($product->name)) {
                $product->slug = Str::slug($product->name);
            }
            
            // Removed automatic rounding of qty. Let the database/validation handle it.
        });
    }

    public function variations(): BelongsToMany
    {
        return $this->belongsToMany(Variation::class, 'product_variations')
            ->withPivot('position')
            ->orderBy('position');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'product_tag');
    }

    public function saleUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'sale_unit_id');
    }

    public function productUnit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'product_unit_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('position');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class)
            ->where('scope', 'product')
            ->orderBy('position');
    }

    public function defaultVariant(): HasOne
    {
        return $this->hasOne(ProductVariant::class)->where('is_default', true);
    }

    public function googleProductCategory(): BelongsTo
    {
        return $this->belongsTo(GoogleProductCategory::class, 'google_product_category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_product')
            ->withPivot(['is_primary', 'position'])
            ->withTimestamps()
            ->orderBy('category_product.position');
    }

    public function primaryCategory(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_product')
            ->withPivot(['is_primary', 'position'])
            ->wherePivot('is_primary', true);
    }

    public function options(): HasMany
    {
        return $this->hasMany(Option::class)->orderBy('position');
    }

    public function attributes(): HasMany
    {
        return $this->hasMany(ProductAttribute::class)->orderBy('id');
    }

    public function hasAnyAttribute(): bool
    {
        if ($this->relationLoaded('attributes')) {
            return $this->attributes->isNotEmpty();
        }

        return $this->attributes()->exists();
    }

    public function getAttributeSetsAttribute()
    {
        $attrs = $this->relationLoaded('attributes') ? $this->attributes : $this->attributes()->get();

        return $attrs->groupBy('attribute_set');
    }

    public function getBaseImageAttribute(): ?array
    {
        $first = $this->media->first();
        if ($first) {
            return [
                'id' => $first->id,
                'path' => $first->path,
                'url' => $first->path,
            ];
        }

        $defaultVariant = $this->relationLoaded('defaultVariant') ? $this->defaultVariant : null;
        if ($defaultVariant) {
            $vMedia = $defaultVariant->media->first();
            if ($vMedia) {
                return [
                    'id' => $vMedia->id,
                    'path' => $vMedia->path,
                    'url' => $vMedia->path,
                ];
            }
        }

        return null;
    }

    public function getBaseImageThumbAttribute(): ?array
    {
        $first = $this->media->first();
        if ($first) {
            return [
                'id' => $first->id,
                'path' => $first->thumb_path ?? $first->path,
                'url' => $first->thumb_path ?? $first->path,
            ];
        }

        $defaultVariant = $this->relationLoaded('defaultVariant') ? $this->defaultVariant : null;
        if ($defaultVariant) {
            $vMedia = $defaultVariant->media->first();
            if ($vMedia) {
                return [
                    'id' => $vMedia->id,
                    'path' => $vMedia->thumb_path ?? $vMedia->path,
                    'url' => $vMedia->thumb_path ?? $vMedia->path,
                ];
            }
        }

        return null;
    }

    public function getDiscountPriceAttribute()
    {
        return $this->selling_price;
    }

    public function getUnitAttribute(): array
    {
        if (!$this->show_unit_pricing) {
            if ($this->unit_type === 'custom' && $this->productUnit) {
                $u = $this->productUnit;
                $suffix = $u->stock_prefix ?: ($u->quantity_prefix ?: '');
                return [
                    'type' => 'custom',
                    'label' => $u->label,
                    'quantity_prefix' => $u->quantity_prefix,
                    'min' => (float)$u->min,
                    'max' => $u->max ? (float)$u->max : null,
                    'step' => (float)$u->step,
                    'default_qty' => $u->default_qty ? (float)$u->default_qty : null,
                    'info_top' => $u->info_top,
                    'info_bottom' => $u->info_bottom,
                    'price_prefix' => $u->price_prefix,
                    'stock_prefix' => $u->stock_prefix,
                    'suffix' => $suffix,
                    'is_decimal_stock' => fmod((float)$u->step, 1) !== 0.0,
                ];
            }

            if ($this->saleUnit) {
                $u = $this->saleUnit;
                $suffix = $u->suffix ?: ($u->short_name ?: $u->name);
                $pricePrefix = $u->price_prefix;
                if (blank($pricePrefix)) {
                    $short = $u->short_name;
                    if (filled($short)) {
                        $pricePrefix = '/' . ltrim((string) $short, '/');
                    }
                }

                return [
                    'type' => 'global',
                    'label' => $u->label,
                    'quantity_prefix' => $u->quantity_prefix,
                    'suffix' => $suffix,
                    'min' => (float)$u->min,
                    'max' => $u->max ? (float)$u->max : null,
                    'step' => (float)$u->step,
                    'default_qty' => $u->default_qty ? (float)$u->default_qty : null,
                    'info_top' => $u->info_top,
                    'info_bottom' => $u->info_bottom,
                    'price_prefix' => $pricePrefix,
                    'stock_prefix' => $u->stock_prefix,
                    'is_decimal_stock' => (bool)$u->is_decimal_stock,
                ];
            }

            return [
                'type' => 'default',
                'label' => 'Adet',
                'suffix' => 'adet',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => null,
                'info_bottom' => null,
                'price_prefix' => null,
                'stock_prefix' => null,
                'is_decimal_stock' => false,
            ];
        }

        if ($this->unit_type === 'custom' && $this->productUnit) {
            $u = $this->productUnit;
            $suffix = $u->stock_prefix ?: ($u->quantity_prefix ?: '');
            return [
                'type' => 'custom',
                'label' => $u->label,
                'quantity_prefix' => $u->quantity_prefix,
                'min' => (float)$u->min,
                'max' => $u->max ? (float)$u->max : null,
                'step' => (float)$u->step,
                'default_qty' => $u->default_qty ? (float)$u->default_qty : null,
                'info_top' => $u->info_top,
                'info_bottom' => $u->info_bottom,
                'price_prefix' => $u->price_prefix,
                'stock_prefix' => $u->stock_prefix,
                'suffix' => $suffix, 
                'is_decimal_stock' => $u->is_decimal_stock !== null
                    ? (bool) $u->is_decimal_stock
                    : (fmod((float)$u->step, 1) !== 0.0),
            ];
        }

        if ($this->saleUnit) {
            $u = $this->saleUnit;
            $suffix = $u->suffix ?: ($u->short_name ?: $u->name);
            $pricePrefix = $u->price_prefix;
            if (blank($pricePrefix)) {
                $short = $u->short_name;
                if (filled($short)) {
                    $pricePrefix = '/' . ltrim((string) $short, '/');
                }
            }
            return [
                'type' => 'global',
                'label' => $u->label,
                'quantity_prefix' => $u->quantity_prefix,
                'suffix' => $suffix,
                'min' => (float)$u->min,
                'max' => $u->max ? (float)$u->max : null,
                'step' => (float)$u->step,
                'default_qty' => $u->default_qty ? (float)$u->default_qty : null,
                'info_top' => $u->info_top,
                'info_bottom' => $u->info_bottom,
                'price_prefix' => $pricePrefix,
                'stock_prefix' => $u->stock_prefix,
                'is_decimal_stock' => (bool)$u->is_decimal_stock,
            ];
        }

        return [
            'type' => null,
            'label' => 'Adet',
            'suffix' => 'adet',
            'min' => 1,
            'max' => null,
            'step' => 1,
            'default_qty' => 1,
            'info_top' => null,
            'info_bottom' => null,
            'price_prefix' => null,
            'stock_prefix' => null,
            'is_decimal_stock' => false,
        ];
    }

    public function url(): string
    {
        return url('/products/' . $this->slug);
    }
}
