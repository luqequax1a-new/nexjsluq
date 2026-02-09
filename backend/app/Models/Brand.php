<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'image',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [];

    protected static function booted(): void
    {
        static::saving(function (Brand $brand): void {
            if (blank($brand->slug)) {
                $brand->slug = Str::slug($brand->name);
            }
        });
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function url(): string
    {
        return url('/brand/' . $this->slug);
    }
}
