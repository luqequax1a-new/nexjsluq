<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UrlRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UrlRedirectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = UrlRedirect::query()->orderByDesc('updated_at');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('source_path', 'ilike', "%{$search}%")
                  ->orWhere('target_url', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_auto')) {
            $query->where('is_auto', $request->boolean('is_auto'));
        }

        $redirects = $query->paginate($request->get('per_page', 25));

        return response()->json($redirects);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'source_path' => 'required|string|max:500',
            'target_url' => 'required|string|max:500',
            'status_code' => 'required|in:301,302',
            'is_active' => 'boolean',
        ]);

        $sourcePath = '/' . ltrim(parse_url($request->source_path, PHP_URL_PATH) ?? '/', '/');
        $targetUrl = '/' . ltrim(parse_url($request->target_url, PHP_URL_PATH) ?? '/', '/');

        if ($sourcePath === $targetUrl) {
            return response()->json(['message' => 'Kaynak ve hedef URL aynı olamaz.'], 422);
        }

        // Döngü kontrolü
        $existing = UrlRedirect::where('source_path', $targetUrl)
            ->where('is_active', true)
            ->first();

        if ($existing && $existing->target_url === $sourcePath) {
            return response()->json(['message' => 'Döngü tespit edildi: A→B ve B→A yönlendirmesi oluşturulamaz.'], 422);
        }

        $redirect = UrlRedirect::updateOrCreate(
            ['source_path' => $sourcePath],
            [
                'target_url' => $targetUrl,
                'target_type' => $request->input('target_type', 'custom'),
                'target_id' => $request->input('target_id'),
                'status_code' => (int) $request->status_code,
                'is_active' => $request->boolean('is_active', true),
                'is_auto' => false,
            ]
        );

        return response()->json(['message' => 'Yönlendirme kaydedildi.', 'redirect' => $redirect], 201);
    }

    public function show(int $id): JsonResponse
    {
        $redirect = UrlRedirect::findOrFail($id);
        return response()->json($redirect);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'source_path' => 'required|string|max:500',
            'target_url' => 'required|string|max:500',
            'status_code' => 'required|in:301,302',
            'is_active' => 'boolean',
        ]);

        $redirect = UrlRedirect::findOrFail($id);

        $sourcePath = '/' . ltrim(parse_url($request->source_path, PHP_URL_PATH) ?? '/', '/');
        $targetUrl = '/' . ltrim(parse_url($request->target_url, PHP_URL_PATH) ?? '/', '/');

        if ($sourcePath === $targetUrl) {
            return response()->json(['message' => 'Kaynak ve hedef URL aynı olamaz.'], 422);
        }

        $existing = UrlRedirect::where('source_path', $targetUrl)
            ->where('is_active', true)
            ->where('id', '!=', $redirect->id)
            ->first();

        if ($existing && $existing->target_url === $sourcePath) {
            return response()->json(['message' => 'Döngü tespit edildi.'], 422);
        }

        $redirect->update([
            'source_path' => $sourcePath,
            'target_url' => $targetUrl,
            'target_type' => $request->input('target_type', $redirect->target_type),
            'target_id' => $request->input('target_id', $redirect->target_id),
            'status_code' => (int) $request->status_code,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json(['message' => 'Yönlendirme güncellendi.', 'redirect' => $redirect->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $redirect = UrlRedirect::findOrFail($id);
        $redirect->delete();

        return response()->json(['message' => 'Yönlendirme silindi.']);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $redirect = UrlRedirect::findOrFail($id);
        $redirect->update(['is_active' => !$redirect->is_active]);

        return response()->json([
            'message' => $redirect->is_active ? 'Yönlendirme aktif edildi.' : 'Yönlendirme pasif edildi.',
            'redirect' => $redirect->fresh(),
        ]);
    }
}
