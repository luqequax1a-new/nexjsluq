<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductAttribute extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'attribute_id'];

    protected $casts = [
        'product_id' => 'integer',
        'attribute_id' => 'integer',
    ];

    protected $with = ['attribute.attributeSet', 'values.attributeValue'];

    protected $appends = ['name', 'attribute_set'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function getNameAttribute(): ?string
    {
        return $this->attribute?->name;
    }

    public function getAttributeSetAttribute(): ?string
    {
        return $this->attribute?->attributeSet?->name;
    }
}
