<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductTabRequest;
use App\Http\Requests\UpdateProductTabRequest;
use App\Models\ProductTab;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductTabController extends Controller
{
    public function __construct()
    {
        // Treat as a settings feature
        $this->middleware('permission:settings.edit');
    }

    public function index(Request $request): JsonResponse
    {
        $tabs = ProductTab::query()
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return response()->json([
            'tabs' => $tabs,
        ]);
    }

    public function show(ProductTab $productTab): JsonResponse
    {
        return response()->json(['tab' => $productTab]);
    }

    public function store(StoreProductTabRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sanitizer = app(HtmlSanitizer::class);

        $tab = ProductTab::create([
            'title' => $data['title'],
            'content_html' => $sanitizer->sanitize($data['content_html'] ?? null),
            'position' => $data['position'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
            'conditions' => $data['conditions'] ?? null,
        ]);

        return response()->json(['tab' => $tab], 201);
    }

    public function update(UpdateProductTabRequest $request, ProductTab $productTab): JsonResponse
    {
        $data = $request->validated();
        $sanitizer = app(HtmlSanitizer::class);

        if (array_key_exists('content_html', $data)) {
            $data['content_html'] = $sanitizer->sanitize($data['content_html']);
        }

        $productTab->update($data);

        return response()->json(['tab' => $productTab->fresh()]);
    }

    public function destroy(ProductTab $productTab): JsonResponse
    {
        $productTab->delete();

        return response()->json(['ok' => true]);
    }
}
