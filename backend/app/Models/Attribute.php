<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attribute extends Model
{
    use HasFactory;

    protected $fillable = ['attribute_set_id', 'name', 'position'];

    protected $casts = [
        'attribute_set_id' => 'integer',
        'position' => 'integer',
    ];

    public function attributeSet(): BelongsTo
    {
        return $this->belongsTo(AttributeSet::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class)->orderBy('position');
    }
}
