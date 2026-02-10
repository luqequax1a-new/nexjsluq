<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSection extends Model
{
    protected $fillable = [
        'page_type',
        'section_template_id',
        'settings',
        'is_active',
        'position',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(SectionTemplate::class, 'section_template_id');
    }

    public function scopeForPage($query, string $pageType)
    {
        return $query->where('page_type', $pageType);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }

    public function getMergedSettings(): array
    {
        $defaults = $this->template?->getDefaultSettings() ?? [];
        $custom = $this->settings ?? [];

        return array_merge($defaults, $custom);
    }

    public function getSetting(string $key, $default = null)
    {
        $merged = $this->getMergedSettings();
        return $merged[$key] ?? $default;
    }

    public function duplicate(): self
    {
        $clone = $this->replicate();
        $clone->position = self::forPage($this->page_type)->max('position') + 1;
        $clone->save();

        return $clone;
    }
}
