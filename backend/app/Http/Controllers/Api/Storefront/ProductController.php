<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use App\Services\ProductTabResolver;

class ProductController extends Controller
{
    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'media', 
                'variants.media', 
                'variations.values.imageMedia',
                'options.values',
                'attributes',
                'brand',
                'categories',
                'tags',
                'saleUnit',
                'productUnit'
            ])
            ->firstOrFail();

        $payload = $product->toArray();
        $payload['attributes'] = $product->attributes;

        $resolver = app(ProductTabResolver::class);
        $payload['custom_tabs'] = $resolver->resolveForProduct($product);

        // Related products based on settings
        $relatedProducts = $this->getRelatedProducts($product);

        return response()->json([
            'product' => $payload,
            'related' => $relatedProducts,
        ]);
    }

    private function getRelatedProducts(Product $product)
    {
        // Check if related products module is enabled
        $enabled = Setting::where('key', 'related_products_enabled')->value('value');
        if ($enabled === '0' || $enabled === false || $enabled === 'false') {
            return [];
        }

        $count = (int) Setting::where('key', 'related_products_count')->value('value') ?: 8;
        $source = Setting::where('key', 'related_products_source')->value('value') ?: 'same_category';

        $query = Product::where('is_active', true)
            ->where('id', '!=', $product->id)
            ->with(['media', 'variants.media', 'defaultVariant.media']);

        switch ($source) {
            case 'selected_category':
                $categoryId = Setting::where('key', 'related_products_category_id')->value('value');
                if ($categoryId) {
                    $query->whereHas('categories', function($q) use ($categoryId) {
                        $q->where('categories.id', $categoryId);
                    });
                } else {
                    // Fallback to same category if no category selected
                    $query->whereHas('categories', function($q) use ($product) {
                        $q->whereIn('categories.id', $product->categories->pluck('id'));
                    });
                }
                break;

            case 'selected_products':
                $productIds = Setting::where('key', 'related_products_product_ids')->value('value');
                if ($productIds) {
                    $ids = is_string($productIds) ? json_decode($productIds, true) : $productIds;
                    if (is_array($ids) && !empty($ids)) {
                        $query->whereIn('id', $ids);
                    } else {
                        // Fallback to same category if no products selected
                        $query->whereHas('categories', function($q) use ($product) {
                            $q->whereIn('categories.id', $product->categories->pluck('id'));
                        });
                    }
                } else {
                    // Fallback to same category if no products selected
                    $query->whereHas('categories', function($q) use ($product) {
                        $q->whereIn('categories.id', $product->categories->pluck('id'));
                    });
                }
                break;

            case 'same_category':
            default:
                $query->whereHas('categories', function($q) use ($product) {
                    $q->whereIn('categories.id', $product->categories->pluck('id'));
                });
                break;
        }

        return $query->take($count)->get();
    }
}
