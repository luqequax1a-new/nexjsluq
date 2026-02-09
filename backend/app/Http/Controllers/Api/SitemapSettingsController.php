<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SitemapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SitemapSettingsController extends Controller
{
    public function getConfig(SitemapService $service): JsonResponse
    {
        return response()->json($service->getConfig());
    }

    public function saveConfig(Request $request, SitemapService $service): JsonResponse
    {
        $validated = $request->validate([
            'include_products' => 'boolean',
            'include_categories' => 'boolean',
            'include_brands' => 'boolean',
            'include_pages' => 'boolean',
            'include_static' => 'boolean',
            'include_images' => 'boolean',
            'products_per_sitemap' => 'integer|min:100|max:50000',
            'products_changefreq' => 'string|in:always,hourly,daily,weekly,monthly,yearly,never',
            'products_priority' => 'string',
            'categories_changefreq' => 'string|in:always,hourly,daily,weekly,monthly,yearly,never',
            'categories_priority' => 'string',
            'brands_changefreq' => 'string|in:always,hourly,daily,weekly,monthly,yearly,never',
            'brands_priority' => 'string',
            'pages_changefreq' => 'string|in:always,hourly,daily,weekly,monthly,yearly,never',
            'pages_priority' => 'string',
        ]);

        $service->saveConfig($validated);

        return response()->json(['message' => 'Sitemap ayarları kaydedildi.']);
    }

    public function getRobots(SitemapService $service): JsonResponse
    {
        return response()->json(['content' => $service->getRobotsTxt()]);
    }

    public function saveRobots(Request $request, SitemapService $service): JsonResponse
    {
        $request->validate(['content' => 'required|string|max:10000']);
        $service->saveRobotsTxt($request->input('content'));

        return response()->json(['message' => 'robots.txt kaydedildi.']);
    }

    public function resetRobots(SitemapService $service): JsonResponse
    {
        $content = $service->resetRobotsTxt();

        return response()->json(['content' => $content, 'message' => 'robots.txt varsayılana sıfırlandı.']);
    }
}
