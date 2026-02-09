<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Jobs\GenerateMediaVariantsJob;
use App\Jobs\GenerateVideoThumbnailJob;
use App\Services\MediaImageVariantService;
use App\Services\MediaLegacyImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:media.index')->only(['index', 'library', 'show']);
        $this->middleware('permission:media.create')->only(['upload', 'attachFromLibrary']);
        $this->middleware('permission:media.edit')->only(['reorderProduct', 'reorderVariant', 'updateFocalPoint', 'updateCrop', 'update', 'regenerate']);
        $this->middleware('permission:media.destroy')->only(['destroy', 'cleanupDraft']);
        $this->middleware('permission:media.create')->only(['importLegacy']);
    }

    public function index(Request $request): JsonResponse
    {
        $scope = $request->query('scope');
        $type = $request->query('type');
        $q = $request->query('q');
        $used = $request->query('used');

        $query = Media::query();

        if (filled($scope)) {
            $query->where('scope', $scope);
        }

        if (filled($type)) {
            $query->where('type', $type);
        }

        if (filled($q)) {
            $qq = trim((string) $q);
            $query->where(function ($sub) use ($qq) {
                $sub->where('path', 'ilike', '%' . $qq . '%')
                    ->orWhere('original_name', 'ilike', '%' . $qq . '%')
                    ->orWhere('alt', 'ilike', '%' . $qq . '%')
                    ->orWhere('mime', 'ilike', '%' . $qq . '%');
            });
        }

        if ($used === '1') {
            $query->where(function ($sub) {
                $sub->whereNotNull('product_id')->orWhereNotNull('product_variant_id');
            });
        } elseif ($used === '0') {
            $query->whereNull('product_id')->whereNull('product_variant_id');
        }

        $query->orderByDesc('id');

        return response()->json($query->paginate(24));
    }

    public function show(Media $media): JsonResponse
    {
        $m = Media::query()
            ->select('media.*')
            ->addSelect([
                'used_count' => Media::query()
                    ->selectRaw('count(*)')
                    ->whereColumn('disk', 'media.disk')
                    ->whereColumn('path', 'media.path')
                    ->where(function ($sub) {
                        $sub->whereNotNull('product_id')->orWhereNotNull('product_variant_id');
                    }),
            ])
            ->whereKey($media->id)
            ->first();

        return response()->json(['media' => $m ?: $media]);
    }

    public function cleanupDraft(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:media,id'],
        ]);

        $userId = $request->user()?->id;
        if (!$userId) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $ids = array_values(array_unique(array_map('intval', $data['ids'])));

        $items = Media::query()
            ->whereIn('id', $ids)
            ->where('scope', 'global')
            ->whereNull('product_id')
            ->whereNull('product_variant_id')
            ->where('created_by', $userId)
            ->get();

        $deletedIds = [];
        $svc = app(MediaImageVariantService::class);
        foreach ($items as $m) {
            $disk = $m->disk ?: 'public';

            // Only delete underlying files if no other DB rows reference them.
            $svc->deleteIfUnreferenced($m);

            $deletedIds[] = $m->id;
            $m->delete();
        }

        return response()->json(['ok' => true, 'deleted_ids' => $deletedIds]);
    }

    public function upload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scope' => ['nullable', 'in:product,variant,global'],
            'type' => ['nullable', 'in:image,video,file'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'alt' => ['nullable', 'string', 'max:255'],
            'generate_variants' => ['nullable', 'boolean'],
            // max is in kilobytes. 50MB = 51200KB
            'file' => ['required', 'file', 'max:51200'],
        ]);

        // Default scope to 'global' if not provided
        $scope = $data['scope'] ?? 'global';

        if ($scope === 'product' && empty($data['product_id'])) {
            return response()->json(['message' => 'product_id is required for product scope'], 422);
        }

        if ($scope === 'variant' && empty($data['product_variant_id'])) {
            return response()->json(['message' => 'product_variant_id is required for variant scope'], 422);
        }

        $file = $request->file('file');
        $disk = 'public';

        $mime = $file->getMimeType();
        $size = $file->getSize();
        $originalName = $file->getClientOriginalName();

        $type = $data['type'] ?? null;
        if (!$type) {
            if (is_string($mime) && str_starts_with($mime, 'image/')) {
                $type = 'image';
            } elseif (is_string($mime) && str_starts_with($mime, 'video/')) {
                $type = 'video';
            } else {
                $type = 'file';
            }
        }

        $ext = $file->getClientOriginalExtension();
        $path = 'media/' . now()->format('Y/m') . '/' . Str::uuid() . ($ext ? ('.' . $ext) : '');
        Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));

        // For videos, use the video itself as thumbnail (ReactPlayer will handle it)
        // In the future, you can generate a proper thumbnail with FFmpeg
        $thumbPath = null;
        if ($type === 'video') {
            $thumbPath = $path; // Use video as its own thumbnail for now
        }

        $media = Media::create([
            'disk' => $disk,
            'type' => $type,
            'path' => $path,
            'thumb_path' => $thumbPath,
            'mime' => $mime,
            'size' => $size,
            'width' => null,
            'height' => null,
            'sha1' => null,
            'original_name' => $originalName ?: null,
            'alt' => $data['alt'] ?? null,
            'scope' => $scope,
            'product_id' => $data['product_id'] ?? null,
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'position' => 0,
            'created_by' => $request->user()?->id,
        ]);

        // Generate full URL
        $url = Storage::disk($disk)->url($path);

        // Generate image variants (thumb/webp/etc.) after response to avoid blocking upload UX.
        $shouldGenerate = array_key_exists('generate_variants', $data) ? (bool) $data['generate_variants'] : true;
        if ($shouldGenerate && $type === 'image') {
            GenerateMediaVariantsJob::dispatch($media->id)->afterResponse();
        }
        
        // Generate video thumbnail after response
        if ($type === 'video') {
            GenerateVideoThumbnailJob::dispatch($media->id)->afterResponse();
        }

        return response()->json([
            'media' => $media,
            'url' => $url
        ], 201);
    }

    public function destroy(Media $media): JsonResponse
    {
        // Safety: do not allow deleting attached media via generic endpoint
        if ($media->product_id !== null || $media->product_variant_id !== null) {
            return response()->json(['message' => 'Cannot delete attached media.'], 422);
        }

        // Only delete underlying files if no other DB rows reference them.
        app(MediaImageVariantService::class)->deleteIfUnreferenced($media);

        $media->delete();

        return response()->json(['ok' => true]);
    }

    public function updateFocalPoint(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'focal_x' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'focal_y' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        $media->update([
            'focal_x' => array_key_exists('focal_x', $data) ? $data['focal_x'] : $media->focal_x,
            'focal_y' => array_key_exists('focal_y', $data) ? $data['focal_y'] : $media->focal_y,
        ]);

        // Refresh square crops after response (avoid blocking UI).
        GenerateMediaVariantsJob::dispatch($media->id, true)->afterResponse();

        return response()->json(['media' => $media->fresh()]);
    }

    public function reorderProduct(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:media,id'],
        ]);

        $ids = array_values(array_map('intval', $data['ids']));

        $items = Media::query()
            ->where('scope', 'product')
            ->where('product_id', $product->id)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        if ($items->count() !== count($ids)) {
            return response()->json(['message' => 'Invalid media ids for this product'], 422);
        }

        foreach ($ids as $pos => $id) {
            $items[$id]->update(['position' => $pos]);
        }

        return response()->json(['ok' => true]);
    }

    public function reorderVariant(Request $request, ProductVariant $variant): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:media,id'],
        ]);

        $ids = array_values(array_map('intval', $data['ids']));

        $items = Media::query()
            ->where('scope', 'variant')
            ->where('product_variant_id', $variant->id)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        if ($items->count() !== count($ids)) {
            return response()->json(['message' => 'Invalid media ids for this variant'], 422);
        }

        foreach ($ids as $pos => $id) {
            $items[$id]->update(['position' => $pos]);
        }

        return response()->json(['ok' => true]);
    }

    public function library(Request $request): JsonResponse
    {
        // For a true library, we want unique files (by path)
        // In Postgres we use DISTINCT ON
        $query = Media::query()
            ->select('id', 'disk', 'scope', 'path', 'thumb_path', 'type', 'mime', 'size', 'original_name', 'alt', 'focal_x', 'focal_y', 'crop_x', 'crop_y', 'crop_w', 'crop_h', 'created_at')
            ->whereNotNull('path');

        // Smart search
        if ($q = $request->query('q')) {
            $query->where(function ($sub) use ($q) {
                $sub->where('path', 'ilike', '%' . $q . '%')
                    ->orWhere('original_name', 'ilike', '%' . $q . '%');
            });
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        // Compute usage count across all rows that reference the same file path
        $query->addSelect([
            'used_count' => Media::query()
                ->selectRaw('count(*)')
                ->whereColumn('disk', 'media.disk')
                ->whereColumn('path', 'media.path')
                ->where(function ($sub) {
                    $sub->whereNotNull('product_id')->orWhereNotNull('product_variant_id');
                }),
        ]);

        // We want latest unique paths
        // We can do this with a subquery or distinct in app if it's small, 
        // but for a robust system:
        $items = $query->orderBy('path')
            ->orderByDesc('id')
            ->distinct('path')
            ->paginate(36);

        return response()->json($items);
    }

    public function updateCrop(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'crop_x' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'crop_y' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'crop_w' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'crop_h' => ['nullable', 'numeric', 'min:0', 'max:1'],
        ]);

        // Allow clearing crop by sending nulls (or omitting).
        $cx = array_key_exists('crop_x', $data) ? $data['crop_x'] : $media->crop_x;
        $cy = array_key_exists('crop_y', $data) ? $data['crop_y'] : $media->crop_y;
        $cw = array_key_exists('crop_w', $data) ? $data['crop_w'] : $media->crop_w;
        $ch = array_key_exists('crop_h', $data) ? $data['crop_h'] : $media->crop_h;

        // If any is null => treat as cleared
        if ($cx === null || $cy === null || $cw === null || $ch === null) {
            $media->update([
                'crop_x' => null,
                'crop_y' => null,
                'crop_w' => null,
                'crop_h' => null,
            ]);
            GenerateMediaVariantsJob::dispatch($media->id, true)->afterResponse();
            return response()->json(['media' => $media->fresh()]);
        }

        $cx = (float) $cx;
        $cy = (float) $cy;
        $cw = (float) $cw;
        $ch = (float) $ch;

        if ($cw <= 0 || $ch <= 0) {
            return response()->json(['message' => 'crop_w and crop_h must be > 0'], 422);
        }

        if (($cx + $cw) > 1.00001 || ($cy + $ch) > 1.00001) {
            return response()->json(['message' => 'Crop area must be inside the image (x+w <= 1, y+h <= 1)'], 422);
        }

        $media->update([
            'crop_x' => $cx,
            'crop_y' => $cy,
            'crop_w' => $cw,
            'crop_h' => $ch,
        ]);

        GenerateMediaVariantsJob::dispatch($media->id, true)->afterResponse();

        return response()->json(['media' => $media->fresh()]);
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $media->update([
            'alt' => array_key_exists('alt', $data) ? $data['alt'] : $media->alt,
        ]);

        return response()->json(['media' => $media->fresh()]);
    }

    public function regenerate(Media $media): JsonResponse
    {
        try {
            app(MediaImageVariantService::class)->generateOnUpload($media->fresh());
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json(['media' => $media->fresh()]);
    }

    public function importLegacy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'generate_variants' => ['nullable', 'boolean'],
        ]);

        $limit = (int) ($data['limit'] ?? 500);
        $generateVariants = array_key_exists('generate_variants', $data) ? (bool) $data['generate_variants'] : true;

        $result = app(MediaLegacyImportService::class)->import([
            'limit' => $limit,
            'generate_variants' => $generateVariants,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json(['result' => $result]);
    }

    public function attachFromLibrary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'media_ids' => ['required', 'array', 'min:1'],
            'media_ids.*' => ['required', 'integer', 'exists:media,id'],
        ]);

        $sourceItems = Media::whereIn('id', $data['media_ids'])->get();
        $newItems = [];

        foreach ($sourceItems as $source) {
            $newMedia = $source->replicate();
            // Reset relations for the "cloned" version which starts as a draft/global
            $newMedia->scope = 'global';
            $newMedia->product_id = null;
            $newMedia->product_variant_id = null;
            $newMedia->created_by = $request->user()?->id;
            $newMedia->created_at = now();
            $newMedia->updated_at = now();
            $newMedia->save();
            
            $newItems[] = $newMedia;
        }

        return response()->json(['items' => $newItems], 201);
    }
}
