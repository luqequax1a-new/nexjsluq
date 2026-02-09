<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parent_id',
        'slug',
        'image',
        'description',
        'meta_title',
        'meta_description',
        'type',
        'is_searchable',
        'position',
        'sort_by',
        'sort_order',
        'manual_sort',
        'faq_items',
    ];

    protected $casts = [
        'is_searchable' => 'boolean',
        'manual_sort' => 'boolean',
        'faq_items' => 'array',
        'position' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (Category $category): void {
            if (blank($category->slug) && filled($category->name)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::deleting(function (Category $category): void {
            $category->children()->update(['parent_id' => $category->parent_id]);
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('name');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'category_product')
            ->withPivot(['is_primary'])
            ->withTimestamps();
    }

    public function dynamicRule(): HasOne
    {
        return $this->hasOne(DynamicCategoryRule::class);
    }

    public function getPathAttribute(): array
    {
        $path = [];
        $current = $this;

        while ($current) {
            array_unshift($path, [
                'id' => $current->id,
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return $path;
    }

    public function getFullNameAttribute(): string
    {
        return collect($this->path)->pluck('name')->join(' > ');
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeNormal($query)
    {
        return $query->where('type', 'normal');
    }

    public function scopeDynamic($query)
    {
        return $query->where('type', 'dynamic');
    }

    public function url(): string
    {
        return url('/category/' . $this->slug);
    }
}
