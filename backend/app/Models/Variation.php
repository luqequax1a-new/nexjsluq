<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Variation extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Available variation types (FleetCart compatible).
     */
    const TYPES = ['text', 'color', 'image', 'button', 'dropdown', 'pill', 'radio'];

    protected $fillable = ['uid', 'name', 'type', 'position', 'is_global'];

    protected $casts = [
        'is_global' => 'boolean',
        'position' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Variation $variation): void {
            if (empty($variation->uid)) {
                $variation->uid = Str::lower(Str::random(12));
            }
        });
    }

    public function values()
    {
        return $this->hasMany(VariationValue::class)->orderBy('position');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_variations')
            ->withPivot('position')
            ->orderByPivot('position');
    }

    public function scopeGlobals($query)
    {
        return $query->where('is_global', true);
    }
}
