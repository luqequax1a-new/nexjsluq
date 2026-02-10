<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SectionTemplate extends Model
{
    protected $fillable = [
        'key',
        'name',
        'category',
        'description',
        'icon',
        'schema',
        'default_settings',
        'is_active',
        'allow_multiple',
        'sort_order',
    ];

    protected $casts = [
        'schema' => 'array',
        'default_settings' => 'array',
        'is_active' => 'boolean',
        'allow_multiple' => 'boolean',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class);
    }

    public function getSchemaFields(): array
    {
        return $this->schema['fields'] ?? [];
    }

    public function getDefaultSettings(): array
    {
        return $this->default_settings ?? [];
    }
}
