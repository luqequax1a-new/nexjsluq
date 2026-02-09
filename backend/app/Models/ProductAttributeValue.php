<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttributeValue extends Model
{
    use HasFactory;

    protected $fillable = ['product_attribute_id', 'attribute_value_id'];

    protected $casts = [
        'product_attribute_id' => 'integer',
        'attribute_value_id' => 'integer',
    ];

    protected $with = ['attributeValue'];

    protected $appends = ['value'];

    public function productAttribute(): BelongsTo
    {
        return $this->belongsTo(ProductAttribute::class);
    }

    public function attributeValue(): BelongsTo
    {
        return $this->belongsTo(AttributeValue::class);
    }

    public function getValueAttribute(): ?string
    {
        return $this->attributeValue?->value;
    }
}
