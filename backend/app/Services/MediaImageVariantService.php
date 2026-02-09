<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaImageVariantService
{
    public function generateOnUpload(Media $media): void
    {
        $this->generateVariants($media, false);
    }

    public function regenerateCrops(Media $media): void
    {
        $this->generateVariants($media, true);
    }

    private function generateVariants(Media $media, bool $forceCrops): void
    {
        if (($media->type ?? null) !== 'image') return;

        $disk = $media->disk ?: 'public';
        $path = (string) ($media->path ?? '');
        if ($path === '') return;
        if (!Storage::disk($disk)->exists($path)) return;

        $realPath = Storage::disk($disk)->path($path);
        $info = @getimagesize($realPath);
        if (!is_array($info) || empty($info[0]) || empty($info[1])) {
            return;
        }

        $width = (int) $info[0];
        $height = (int) $info[1];
        $mime = is_string($info['mime'] ?? null) ? (string) $info['mime'] : ($media->mime ?: null);

        $focalX = $this->clamp01($media->focal_x);
        $focalY = $this->clamp01($media->focal_y);

        $crop = $this->normalizeCropArea($media);

        $sha1 = null;
        try {
            $sha1 = @sha1_file($realPath) ?: null;
        } catch (\Throwable $e) {
            $sha1 = null;
        }

        $media->update([
            'width' => $media->width ?? $width,
            'height' => $media->height ?? $height,
            'mime' => $media->mime ?? $mime,
            'sha1' => $media->sha1 ?? $sha1,
        ]);

        $variants = (array) config('media_optimization.variants.widths', []);
        $webpQuality = (int) config('media_optimization.variants.webp_quality', 88);
        $jpegQuality = (int) config('media_optimization.variants.jpeg_quality', 88);
        $avifQuality = (int) config('media_optimization.variants.avif_quality', 90);
        $enableAvif = (bool) config('media_optimization.variants.enable_avif', true);

        $supportsWebp = function_exists('imagewebp');
        $supportsAvif = $enableAvif && function_exists('imageavif');

        $img = $this->loadImageResource($realPath, $mime);
        if (!$img) return;

        $img = $this->fixOrientationIfPossible($img, $realPath);

        $base = pathinfo($path, PATHINFO_FILENAME);
        $dir = trim(str_replace('\\', '/', dirname($path)), '/');
        $dirPrefix = $dir !== '.' && $dir !== '' ? $dir . '/' : '';

        $generated = [];

        foreach ($variants as $key => $w) {
            $w = (int) $w;
            if ($w <= 0) continue;

            $dst = $this->resizeToWidth($img, $width, $height, $w);
            if (!$dst) continue;

            if ($supportsWebp) {
                $rel = $dirPrefix . $base . '-' . $w . 'w.webp';
                if (!Storage::disk($disk)->exists($rel)) {
                    $this->writeWebpToDisk($dst, $disk, $rel, $webpQuality);
                }
                $generated[$key . '_webp'] = $rel;
            }

            if ($supportsAvif) {
                $rel = $dirPrefix . $base . '-' . $w . 'w.avif';
                if (!Storage::disk($disk)->exists($rel)) {
                    $this->writeAvifToDisk($dst, $disk, $rel, $avifQuality);
                }
                $generated[$key . '_avif'] = $rel;
            }

            // Lightweight JPEG fallback for browsers without WebP/AVIF.
            $relJpg = $dirPrefix . $base . '-' . $w . 'w.jpg';
            if (!Storage::disk($disk)->exists($relJpg)) {
                $this->writeJpegToDisk($dst, $disk, $relJpg, $jpegQuality);
            }
            $generated[$key . '_jpg'] = $relJpg;

            imagedestroy($dst);
        }

        // Generate square "cover" variants for UI thumbnails (ikas-like)
        // Naming: base-80sq.webp (and .jpg/.avif)
        foreach (['thumb', 'card'] as $squareKey) {
            $w = (int) ($variants[$squareKey] ?? 0);
            if ($w <= 0) continue;

            $dstSq = $crop
                ? $this->resizeFromSafeArea($img, $width, $height, $w, $w, $crop)
                : $this->resizeCover($img, $width, $height, $w, $w, $focalX, $focalY);
            if (!$dstSq) continue;

            if ($supportsWebp) {
                $rel = $dirPrefix . $base . '-' . $w . 'sq.webp';
                if ($forceCrops || !Storage::disk($disk)->exists($rel)) {
                    $this->writeWebpToDisk($dstSq, $disk, $rel, $webpQuality);
                }
                $generated[$squareKey . '_sq_webp'] = $rel;
            }
            if ($supportsAvif) {
                $rel = $dirPrefix . $base . '-' . $w . 'sq.avif';
                if ($forceCrops || !Storage::disk($disk)->exists($rel)) {
                    $this->writeAvifToDisk($dstSq, $disk, $rel, $avifQuality);
                }
                $generated[$squareKey . '_sq_avif'] = $rel;
            }
            $relJpg = $dirPrefix . $base . '-' . $w . 'sq.jpg';
            if ($forceCrops || !Storage::disk($disk)->exists($relJpg)) {
                $this->writeJpegToDisk($dstSq, $disk, $relJpg, $jpegQuality);
            }
            $generated[$squareKey . '_sq_jpg'] = $relJpg;

            imagedestroy($dstSq);
        }

        // Also generate bigger square thumbs for crisp admin grids (avoid blur on high-DPI).
        foreach (['grid', 'grid_2x'] as $squareKey) {
            $w = (int) ($variants[$squareKey] ?? 0);
            if ($w <= 0) continue;
            $dstSq = $crop
                ? $this->resizeFromSafeArea($img, $width, $height, $w, $w, $crop)
                : $this->resizeCover($img, $width, $height, $w, $w, $focalX, $focalY);
            if (!$dstSq) continue;

            if ($supportsWebp) {
                $rel = $dirPrefix . $base . '-' . $w . 'sq.webp';
                if ($forceCrops || !Storage::disk($disk)->exists($rel)) {
                    $this->writeWebpToDisk($dstSq, $disk, $rel, $webpQuality);
                }
                $generated[$squareKey . '_sq_webp'] = $rel;
            }
            if ($supportsAvif) {
                $rel = $dirPrefix . $base . '-' . $w . 'sq.avif';
                if ($forceCrops || !Storage::disk($disk)->exists($rel)) {
                    $this->writeAvifToDisk($dstSq, $disk, $rel, $avifQuality);
                }
                $generated[$squareKey . '_sq_avif'] = $rel;
            }
            $relJpg = $dirPrefix . $base . '-' . $w . 'sq.jpg';
            if ($forceCrops || !Storage::disk($disk)->exists($relJpg)) {
                $this->writeJpegToDisk($dstSq, $disk, $relJpg, $jpegQuality);
            }
            $generated[$squareKey . '_sq_jpg'] = $relJpg;

            imagedestroy($dstSq);
        }

        // Prefer a nice admin/library thumbnail (grid square if available)
        $thumbRel =
            ($generated['grid_sq_webp'] ?? null) ??
            ($generated['card_sq_webp'] ?? null) ??
            ($generated['card_sq_jpg'] ?? null) ??
            ($generated['card_webp'] ?? null) ??
            ($generated['card_jpg'] ?? null) ??
            ($generated['thumb_webp'] ?? null) ??
            ($generated['thumb_jpg'] ?? null) ??
            null;

        if ($thumbRel && $media->thumb_path !== $thumbRel) {
            $media->update(['thumb_path' => $thumbRel]);
        }

        imagedestroy($img);
    }

    /**
     * @return array{x:float,y:float,w:float,h:float}|null
     */
    private function normalizeCropArea(Media $media): ?array
    {
        $cx = $media->crop_x;
        $cy = $media->crop_y;
        $cw = $media->crop_w;
        $ch = $media->crop_h;

        if ($cx === null || $cy === null || $cw === null || $ch === null) return null;
        $cx = (float) $cx;
        $cy = (float) $cy;
        $cw = (float) $cw;
        $ch = (float) $ch;

        if ($cw <= 0 || $ch <= 0) return null;
        if ($cx < 0 || $cy < 0) return null;
        if ($cx + $cw > 1.00001) return null;
        if ($cy + $ch > 1.00001) return null;

        return [
            'x' => $this->clamp01($cx),
            'y' => $this->clamp01($cy),
            'w' => min(1.0, max(0.0001, $cw)),
            'h' => min(1.0, max(0.0001, $ch)),
        ];
    }

    private function resizeFromSafeArea($src, int $srcW, int $srcH, int $targetW, int $targetH, array $safe)
    {
        if ($targetW <= 0 || $targetH <= 0) return null;
        if ($srcW <= 0 || $srcH <= 0) return null;

        $safeX = (float) ($safe['x'] ?? 0.0);
        $safeY = (float) ($safe['y'] ?? 0.0);
        $safeW = (float) ($safe['w'] ?? 1.0);
        $safeH = (float) ($safe['h'] ?? 1.0);

        $sx = (int) round($safeX * $srcW);
        $sy = (int) round($safeY * $srcH);
        $sw = (int) max(1, round($safeW * $srcW));
        $sh = (int) max(1, round($safeH * $srcH));

        // Clamp safe box within image
        if ($sx < 0) $sx = 0;
        if ($sy < 0) $sy = 0;
        if ($sx + $sw > $srcW) $sw = $srcW - $sx;
        if ($sy + $sh > $srcH) $sh = $srcH - $sy;
        if ($sw <= 0 || $sh <= 0) return null;

        // Compute maximal crop of target aspect within safe box (centered)
        $targetAspect = $targetW / $targetH;
        $safeAspect = $sw / $sh;

        if ($safeAspect > $targetAspect) {
            $cropH = $sh;
            $cropW = (int) max(1, round($cropH * $targetAspect));
            $cropX = (int) round($sx + (($sw - $cropW) / 2));
            $cropY = $sy;
        } else {
            $cropW = $sw;
            $cropH = (int) max(1, round($cropW / $targetAspect));
            $cropX = $sx;
            $cropY = (int) round($sy + (($sh - $cropH) / 2));
        }

        // Clamp again
        if ($cropX < 0) $cropX = 0;
        if ($cropY < 0) $cropY = 0;
        if ($cropX + $cropW > $srcW) $cropW = $srcW - $cropX;
        if ($cropY + $cropH > $srcH) $cropH = $srcH - $cropY;
        if ($cropW <= 0 || $cropH <= 0) return null;

        $dst = imagecreatetruecolor($targetW, $targetH);
        if (!$dst) return null;

        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $targetW, $targetH, $transparent);

        $ok = imagecopyresampled($dst, $src, 0, 0, $cropX, $cropY, $targetW, $targetH, $cropW, $cropH);
        if (!$ok) {
            imagedestroy($dst);
            return null;
        }

        return $dst;
    }

    /**
     * Deletes file + known variants ONLY if nothing else references the same original path.
     */
    public function deleteIfUnreferenced(Media $media): void
    {
        $disk = $media->disk ?: 'public';
        $path = (string) ($media->path ?? '');
        $thumb = (string) ($media->thumb_path ?? '');

        $hasOtherRefs = Media::query()
            ->where('disk', $disk)
            ->where('path', $path)
            ->where('id', '!=', $media->id)
            ->exists();

        if ($hasOtherRefs) {
            // Safe: do not delete underlying files if other DB rows still point to them.
            return;
        }

        if ($path !== '' && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }

        if ($thumb !== '' && Storage::disk($disk)->exists($thumb)) {
            Storage::disk($disk)->delete($thumb);
        }

        // Delete variants that follow our naming convention: base-<width>w.<ext>
        $base = pathinfo($path, PATHINFO_FILENAME);
        $dir = trim(str_replace('\\', '/', dirname($path)), '/');
        $dirPrefix = $dir !== '.' && $dir !== '' ? $dir . '/' : '';

        $widths = array_values((array) config('media_optimization.variants.widths', []));
        $widths = array_values(array_unique(array_map('intval', $widths)));
        $exts = ['webp', 'avif', 'jpg'];

        foreach ($widths as $w) {
            if ($w <= 0) continue;
            foreach ($exts as $ext) {
                $rel = $dirPrefix . $base . '-' . $w . 'w.' . $ext;
                if (Storage::disk($disk)->exists($rel)) {
                    Storage::disk($disk)->delete($rel);
                }
            }
        }

        // Also remove square cover variants: base-80sq.webp
        foreach ($widths as $w) {
            if ($w <= 0) continue;
            foreach ($exts as $ext) {
                $rel = $dirPrefix . $base . '-' . $w . 'sq.' . $ext;
                if (Storage::disk($disk)->exists($rel)) {
                    Storage::disk($disk)->delete($rel);
                }
            }
        }
    }

    private function loadImageResource(string $realPath, ?string $mime)
    {
        $m = strtolower((string) $mime);
        try {
            return match ($m) {
                'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($realPath) ?: null,
                'image/png' => @imagecreatefrompng($realPath) ?: null,
                'image/gif' => @imagecreatefromgif($realPath) ?: null,
                'image/webp' => function_exists('imagecreatefromwebp') ? (@imagecreatefromwebp($realPath) ?: null) : null,
                default => null,
            };
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function resizeToWidth($src, int $srcW, int $srcH, int $targetW)
    {
        if ($targetW <= 0) return null;
        if ($srcW <= 0 || $srcH <= 0) return null;

        $ratio = $srcH / $srcW;
        $targetH = (int) max(1, round($targetW * $ratio));

        $dst = imagecreatetruecolor($targetW, $targetH);
        if (!$dst) return null;

        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $targetW, $targetH, $transparent);

        $ok = imagecopyresampled($dst, $src, 0, 0, 0, 0, $targetW, $targetH, $srcW, $srcH);
        if (!$ok) {
            imagedestroy($dst);
            return null;
        }

        return $dst;
    }

    private function resizeCover($src, int $srcW, int $srcH, int $targetW, int $targetH, float $focalX, float $focalY)
    {
        if ($targetW <= 0 || $targetH <= 0) return null;
        if ($srcW <= 0 || $srcH <= 0) return null;

        $scale = max($targetW / $srcW, $targetH / $srcH);
        $cropW = (int) max(1, round($targetW / $scale));
        $cropH = (int) max(1, round($targetH / $scale));

        $fx = max(0.0, min(1.0, $focalX));
        $fy = max(0.0, min(1.0, $focalY));

        $centerX = (int) round($fx * $srcW);
        $centerY = (int) round($fy * $srcH);

        $srcX = (int) max(0, min($srcW - $cropW, $centerX - (int) floor($cropW / 2)));
        $srcY = (int) max(0, min($srcH - $cropH, $centerY - (int) floor($cropH / 2)));

        $dst = imagecreatetruecolor($targetW, $targetH);
        if (!$dst) return null;

        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $targetW, $targetH, $transparent);

        $ok = imagecopyresampled($dst, $src, 0, 0, $srcX, $srcY, $targetW, $targetH, $cropW, $cropH);
        if (!$ok) {
            imagedestroy($dst);
            return null;
        }

        return $dst;
    }

    private function clamp01($v): float
    {
        if ($v === null) return 0.5;
        $n = (float) $v;
        if (!is_finite($n)) return 0.5;
        if ($n < 0) return 0.0;
        if ($n > 1) return 1.0;
        return $n;
    }

    private function writeWebpToDisk($img, string $disk, string $rel, int $quality): void
    {
        $tmp = tmpfile();
        if (!$tmp) return;
        $meta = stream_get_meta_data($tmp);
        $tmpPath = $meta['uri'] ?? null;
        if (!$tmpPath) return;

        @imagewebp($img, $tmpPath, max(0, min(100, $quality)));
        Storage::disk($disk)->put($rel, file_get_contents($tmpPath));
        fclose($tmp);
    }

    private function writeAvifToDisk($img, string $disk, string $rel, int $quality): void
    {
        if (!function_exists('imageavif')) return;
        $tmp = tmpfile();
        if (!$tmp) return;
        $meta = stream_get_meta_data($tmp);
        $tmpPath = $meta['uri'] ?? null;
        if (!$tmpPath) return;

        @imageavif($img, $tmpPath, max(0, min(100, $quality)));
        Storage::disk($disk)->put($rel, file_get_contents($tmpPath));
        fclose($tmp);
    }

    private function writeJpegToDisk($img, string $disk, string $rel, int $quality): void
    {
        $tmp = tmpfile();
        if (!$tmp) return;
        $meta = stream_get_meta_data($tmp);
        $tmpPath = $meta['uri'] ?? null;
        if (!$tmpPath) return;

        // Flatten alpha onto white for JPEG
        $w = imagesx($img);
        $h = imagesy($img);
        $flat = imagecreatetruecolor($w, $h);
        $white = imagecolorallocate($flat, 255, 255, 255);
        imagefilledrectangle($flat, 0, 0, $w, $h, $white);
        imagecopy($flat, $img, 0, 0, 0, 0, $w, $h);

        @imagejpeg($flat, $tmpPath, max(0, min(100, $quality)));
        Storage::disk($disk)->put($rel, file_get_contents($tmpPath));

        imagedestroy($flat);
        fclose($tmp);
    }

    private function fixOrientationIfPossible($img, string $realPath)
    {
        if (!function_exists('exif_read_data')) return $img;
        try {
            $exif = @exif_read_data($realPath);
            if (!is_array($exif)) return $img;
            $orientation = (int) ($exif['Orientation'] ?? 1);

            return match ($orientation) {
                3 => imagerotate($img, 180, 0),
                6 => imagerotate($img, -90, 0),
                8 => imagerotate($img, 90, 0),
                default => $img,
            };
        } catch (\Throwable $e) {
            return $img;
        }
    }
}
