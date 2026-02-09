<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UrlRedirect extends Model
{
    protected $table = 'url_redirects';

    protected $fillable = [
        'source_path',
        'target_url',
        'target_type',
        'target_id',
        'status_code',
        'is_active',
        'is_auto',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'is_active' => 'boolean',
        'is_auto' => 'boolean',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helpers
    public static function findByPath(string $path): ?self
    {
        $path = '/' . ltrim($path, '/');

        return static::where('source_path', $path)
            ->where('is_active', true)
            ->first();
    }

    public static function createRedirect(string $sourcePath, string $targetUrl, int $statusCode = 301, bool $isAuto = false, ?string $targetType = 'custom', ?int $targetId = null): self
    {
        $sourcePath = '/' . ltrim($sourcePath, '/');
        $targetUrl = '/' . ltrim($targetUrl, '/');

        // Döngü kontrolü
        if ($sourcePath === $targetUrl) {
            throw new \InvalidArgumentException('Kaynak ve hedef URL aynı olamaz.');
        }

        return static::updateOrCreate(
            ['source_path' => $sourcePath],
            [
                'target_url' => $targetUrl,
                'target_type' => $targetType ?? 'custom',
                'target_id' => $targetId,
                'status_code' => $statusCode,
                'is_active' => true,
                'is_auto' => $isAuto,
            ]
        );
    }
}
