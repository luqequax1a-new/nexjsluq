<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ProductListController extends Controller
{
    private function normalizeTurkish($str)
    {
        $tr = ['ı', 'İ', 'ü', 'Ü', 'ö', 'Ö', 'ş', 'Ş', 'ç', 'Ç', 'ğ', 'Ğ'];
        $ascii = ['i', 'I', 'u', 'U', 'o', 'O', 's', 'S', 'c', 'C', 'g', 'G'];
        return str_replace($tr, $ascii, $str);
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $categorySlug = trim((string) $request->query('category', ''));
        $brandId = $request->query('brand_id');
        $inStock = $request->query('in_stock');
        $sort = trim((string) $request->query('sort', ''));
        $min = $request->query('min');
        $max = $request->query('max');
        $perPage = (int) $request->query('per_page', 24);

        // Debug log
        \Log::info('[ProductListController] Request params:', [
            'q' => $q,
            'categorySlug' => $categorySlug,
            'brand_id' => $brandId,
            'in_stock' => $inStock,
            'sort' => $sort,
            'min' => $min,
            'max' => $max,
            'per_page' => $perPage,
        ]);

        $query = Product::query()
            ->where('is_active', true)
            ->with(['media', 'defaultVariant.media', 'variants.media', 'brand', 'categories']);

        if ($q !== '') {
            $qNormalized = $this->normalizeTurkish($q);
            $query->where(function ($sub) use ($q, $qNormalized) {
                $sub->where('name', 'ilike', "%{$q}%")
                    ->orWhere('name', 'ilike', "%{$qNormalized}%")
                    ->orWhere('slug', 'ilike', "%{$q}%")
                    ->orWhere('slug', 'ilike', "%{$qNormalized}%")
                    ->orWhere('short_description', 'ilike', "%{$q}%")
                    ->orWhere('short_description', 'ilike', "%{$qNormalized}%");
            });
        }

        if ($categorySlug !== '') {
            // Ürün, ilgili kategoriye bağlıysa (primary veya normal fark etmez) listele
            $query->whereHas('categories', function ($catQ) use ($categorySlug) {
                $catQ->where('slug', $categorySlug);
            });
        }

        if ($brandId !== null && $brandId !== '') {
            $brandIds = [];

            if (is_array($brandId)) {
                $brandIds = $brandId;
            } else {
                $brandIds = preg_split('/\s*,\s*/', (string) $brandId) ?: [];
            }

            $brandIds = array_values(array_filter(array_map(function ($v) {
                if ($v === null) return null;
                $s = trim((string) $v);
                if ($s === '') return null;
                $n = (int) $s;
                return $n > 0 ? $n : null;
            }, $brandIds)));

            if (count($brandIds) === 1) {
                $query->where('brand_id', $brandIds[0]);
            } elseif (count($brandIds) > 1) {
                $query->whereIn('brand_id', $brandIds);
            }
        }

        if ($inStock !== null && $inStock !== '') {
            $val = strtolower(trim((string) $inStock));
            $truthy = in_array($val, ['1', 'true', 'yes', 'on'], true);
            $falsy = in_array($val, ['0', 'false', 'no', 'off'], true);

            if ($truthy) {
                $query->where('in_stock', true);
            } elseif ($falsy) {
                $query->where('in_stock', false);
            }
        }

        if ($min !== null && $min !== '') {
            $query->where('selling_price', '>=', (float) $min);
        }

        if ($max !== null && $max !== '') {
            $query->where('selling_price', '<=', (float) $max);
        }

        switch ($sort) {
            case 'price_asc':
                $query->orderBy('selling_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('selling_price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        $perPage = max(1, min($perPage, 60));

        $products = $query->get();
        $expanded = $this->expandProductsForListing($products);

        // Debug log sonuçları
        \Log::info('[ProductListController] Query results:', [
            'total_products' => $products->count(),
            'expanded_count' => $expanded->count(),
            'category_slug' => $categorySlug,
            'sample_products' => $products->take(3)->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'categories' => $product->categories->map(function ($cat) {
                        return [
                            'id' => $cat->id,
                            'name' => $cat->name,
                            'slug' => $cat->slug,
                            'is_primary' => $cat->pivot->is_primary ?? false,
                        ];
                    }),
                ];
            }),
        ]);

        $page = max(1, (int) $request->query('page', 1));
        $paginated = new LengthAwarePaginator(
            $expanded->forPage($page, $perPage)->values(),
            $expanded->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return response()->json($paginated);
    }

    private function expandProductsForListing(Collection $products): Collection
    {
        return $products->flatMap(function (Product $product) {
            if ($product->list_variants_separately) {
                $variants = $product->variants->filter(function ($variant) {
                    return (bool) ($variant->is_active ?? false);
                });

                if ($variants->isNotEmpty()) {
                    return $variants->map(function ($variant) use ($product) {
                        $item = $product->toArray();
                        $item['id'] = $variant->id;
                        $item['product_id'] = $product->id;
                        $item['variant_id'] = $variant->id;
                        $item['variant'] = $variant->toArray();
                        $item['media'] = $variant->media->isNotEmpty()
                            ? $variant->media
                            : $product->media;
                        $item['selling_price'] = $variant->discount_price
                            ?? $variant->price
                            ?? $product->selling_price
                            ?? $product->price;
                        $item['list_variants_separately'] = true;
                        return $item;
                    });
                }
            }

            $base = $product->toArray();
            $base['list_variants_separately'] = (bool) $product->list_variants_separately;
            return collect([$base]);
        });
    }
}
