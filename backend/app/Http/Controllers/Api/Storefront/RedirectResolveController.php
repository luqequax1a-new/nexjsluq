<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\UrlRedirect;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RedirectResolveController extends Controller
{
    public function resolve(Request $request): JsonResponse
    {
        $path = $request->get('path', '');
        $path = '/' . ltrim($path, '/');

        // 1. First check url_redirects table (manual/admin redirects)
        $redirect = UrlRedirect::where('source_path', $path)
            ->where('is_active', true)
            ->first();

        if ($redirect) {
            return response()->json([
                'redirect' => [
                    'target_url' => $redirect->target_url,
                    'status_code' => $redirect->status_code,
                ],
            ]);
        }

        // 2. Check if this is a product URL and if product has redirect settings
        // Product URLs are typically /products/{slug}
        $productSlug = $this->extractProductSlug($path);
        if ($productSlug) {
            $product = Product::where('slug', $productSlug)
                ->where('is_active', false) // Only redirect if product is inactive
                ->first();

            if ($product && $product->redirect_type && $product->redirect_type !== '404') {
                $targetUrl = $this->resolveProductRedirect($product);
                if ($targetUrl) {
                    $statusCode = str_starts_with($product->redirect_type, '301') ? 301 : 302;
                    return response()->json([
                        'redirect' => [
                            'target_url' => $targetUrl,
                            'status_code' => $statusCode,
                        ],
                    ]);
                }
            }
        }

        return response()->json(['redirect' => null]);
    }

    /**
     * Extract product slug from URL path
     * Supports: /products/{slug}, /urun/{slug}, /product/{slug}
     */
    private function extractProductSlug(string $path): ?string
    {
        $patterns = [
            '#^/products/([^/]+)$#',
            '#^/urun/([^/]+)$#',
            '#^/product/([^/]+)$#',
            '#^/urunler/([^/]+)$#',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $path, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Resolve product redirect target URL based on redirect_type and redirect_target_id
     */
    private function resolveProductRedirect(Product $product): ?string
    {
        $redirectType = $product->redirect_type;
        $targetId = $product->redirect_target_id;

        switch ($redirectType) {
            case '410':
                // 410 Gone - no redirect, will be handled by frontend
                return null;

            case '301-category':
            case '302-category':
                if ($targetId) {
                    $category = Category::find($targetId);
                    if ($category) {
                        return '/kategoriler/' . $category->slug;
                    }
                }
                // Fallback to primary category
                $primaryCategory = $product->categories()
                    ->wherePivot('is_primary', true)
                    ->first();
                if ($primaryCategory) {
                    return '/kategoriler/' . $primaryCategory->slug;
                }
                // Fallback to first category
                $firstCategory = $product->categories()->first();
                if ($firstCategory) {
                    return '/kategoriler/' . $firstCategory->slug;
                }
                return '/';

            case '301-product':
            case '302-product':
                if ($targetId) {
                    $targetProduct = Product::find($targetId);
                    if ($targetProduct && $targetProduct->is_active) {
                        return '/urun/' . $targetProduct->slug;
                    }
                }
                return null;

            default:
                return null;
        }
    }
}
