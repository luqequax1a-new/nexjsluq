<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Brand;
use App\Models\Media;
use App\Models\VariationValue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaLegacyImportService
{
    /**
     * Import legacy image paths (string columns) into media table so they appear in the library.
     *
     * Supported sources:
     * - variation_values.image (string) => also sets image_id (keeps original string)
     * - brands.image (string)
     * - categories.image (string)
     *
     * @return array{created:int,skipped:int,updated_variation_values:int,missing_files:int,details:array<int,array<string,mixed>>}
     */
    public function import(array $opts = []): array
    {
        $limit = (int) ($opts['limit'] ?? 500);
        $generateVariants = (bool) ($opts['generate_variants'] ?? true);
        $createdBy = $opts['created_by'] ?? null;

        $created = 0;
        $skipped = 0;
        $missingFiles = 0;
        $updatedVariationValues = 0;
        $details = [];

        $variantService = app(MediaImageVariantService::class);

        // 1) Variation values (most common for product variant swatches)
        $vv = VariationValue::query()
            ->whereNull('image_id')
            ->whereNotNull('image')
            ->where('image', '!=', '')
            ->orderBy('id')
            ->limit($limit)
            ->get(['id', 'image', 'label']);

        foreach ($vv as $row) {
            $normalized = $this->normalizeToPublicDiskPath((string) $row->image);
            if (!$normalized) {
                $skipped++;
                $details[] = ['source' => 'variation_value', 'id' => $row->id, 'status' => 'skipped', 'reason' => 'unrecognized_path', 'path' => $row->image];
                continue;
            }

            if (!Storage::disk('public')->exists($normalized)) {
                $missingFiles++;
                $details[] = ['source' => 'variation_value', 'id' => $row->id, 'status' => 'missing_file', 'path' => $normalized];
                continue;
            }

            $existing = Media::query()->where('disk', 'public')->where('path', $normalized)->orderByDesc('id')->first();
            $media = $existing;

            if (!$existing) {
                $media = $this->createMediaFromPath($normalized, [
                    'alt' => $row->label ?: null,
                    'created_by' => $createdBy,
                ]);
                $created++;
            } else {
                $skipped++;
            }

            if ($media) {
                $row->update(['image_id' => $media->id]);
                $updatedVariationValues++;

                if ($generateVariants) {
                    try {
                        $variantService->generateOnUpload($media->fresh());
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }
            }
        }

        // 2) Brands & Categories - import into library only (no linking yet)
        $remaining = max(0, $limit - $created - $skipped);
        if ($remaining > 0) {
            $this->importSimpleModelImages(Brand::class, 'brand', $remaining, $createdBy, $generateVariants, $created, $skipped, $missingFiles, $details);
        }
        $remaining = max(0, $limit - $created - $skipped);
        if ($remaining > 0) {
            $this->importSimpleModelImages(Category::class, 'category', $remaining, $createdBy, $generateVariants, $created, $skipped, $missingFiles, $details);
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'updated_variation_values' => $updatedVariationValues,
            'missing_files' => $missingFiles,
            'details' => $details,
        ];
    }

    private function importSimpleModelImages(string $modelClass, string $source, int $limit, $createdBy, bool $generateVariants, int &$created, int &$skipped, int &$missingFiles, array &$details): void
    {
        $variantService = app(MediaImageVariantService::class);

        $rows = $modelClass::query()
            ->whereNotNull('image')
            ->where('image', '!=', '')
            ->orderBy('id')
            ->limit($limit)
            ->get(['id', 'image', 'name']);

        foreach ($rows as $row) {
            $normalized = $this->normalizeToPublicDiskPath((string) $row->image);
            if (!$normalized) {
                $skipped++;
                $details[] = ['source' => $source, 'id' => $row->id, 'status' => 'skipped', 'reason' => 'unrecognized_path', 'path' => $row->image];
                continue;
            }

            if (!Storage::disk('public')->exists($normalized)) {
                $missingFiles++;
                $details[] = ['source' => $source, 'id' => $row->id, 'status' => 'missing_file', 'path' => $normalized];
                continue;
            }

            $existing = Media::query()->where('disk', 'public')->where('path', $normalized)->orderByDesc('id')->first();
            if ($existing) {
                $skipped++;
                continue;
            }

            $media = $this->createMediaFromPath($normalized, [
                'alt' => ($row->name ?? null) ?: null,
                'created_by' => $createdBy,
            ]);
            if ($media) {
                $created++;
                if ($generateVariants) {
                    try {
                        $variantService->generateOnUpload($media->fresh());
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }
            }
        }
    }

    private function createMediaFromPath(string $path, array $meta = []): ?Media
    {
        $disk = 'public';

        $full = Storage::disk($disk)->path($path);
        $mime = null;
        $size = null;
        $w = null;
        $h = null;

        try {
            $size = @filesize($full) ?: null;
        } catch (\Throwable $e) {
            $size = null;
        }

        $info = @getimagesize($full);
        if (is_array($info)) {
            $w = isset($info[0]) ? (int) $info[0] : null;
            $h = isset($info[1]) ? (int) $info[1] : null;
            $mime = is_string($info['mime'] ?? null) ? (string) $info['mime'] : null;
        }

        $originalName = basename($path);

        return Media::create([
            'disk' => $disk,
            'type' => 'image',
            'path' => $path,
            'thumb_path' => null,
            'mime' => $mime,
            'size' => $size,
            'width' => $w,
            'height' => $h,
            'sha1' => null,
            'original_name' => $originalName ?: null,
            'alt' => $meta['alt'] ?? null,
            'scope' => 'global',
            'product_id' => null,
            'product_variant_id' => null,
            'position' => 0,
            'created_by' => $meta['created_by'] ?? null,
            'focal_x' => 0.5,
            'focal_y' => 0.5,
        ]);
    }

    /**
     * Converts a legacy stored URL/path into Storage::disk('public') relative path.
     * Accepts:
     * - "media/2026/01/abc.jpg"
     * - "/storage/media/2026/01/abc.jpg"
     * - "http://localhost:8000/storage/media/2026/01/abc.jpg"
     * - "storage/media/2026/01/abc.jpg"
     */
    private function normalizeToPublicDiskPath(string $raw): ?string
    {
        $s = trim($raw);
        if ($s === '') return null;

        // Strip querystrings/fragments
        $s = preg_replace('/[?#].*$/', '', $s) ?? $s;

        // URL => take path
        if (Str::startsWith($s, ['http://', 'https://'])) {
            $parts = parse_url($s);
            $s = $parts['path'] ?? '';
        }

        $s = str_replace('\\', '/', $s);
        $s = ltrim($s, '/');

        // If it contains "storage/", keep the part after it
        $pos = stripos($s, 'storage/');
        if ($pos !== false) {
            $s = substr($s, $pos + strlen('storage/'));
        }

        $s = trim($s, '/');
        if ($s === '') return null;

        return $s;
    }
}

