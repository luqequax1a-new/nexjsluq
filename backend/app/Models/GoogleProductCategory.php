<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoogleProductCategory extends Model
{
    protected $fillable = [
        'google_id',
        'parent_google_id',
        'name',
        'full_path',
        'level',
        'is_leaf',
    ];

    protected $casts = [
        'name' => 'array',
        'full_path' => 'array',
        'is_leaf' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(GoogleProductCategory::class, 'parent_google_id', 'google_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(GoogleProductCategory::class, 'parent_google_id', 'google_id');
    }
}
