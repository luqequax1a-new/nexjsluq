<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\PageSection;
use App\Models\Product;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $pageType = $request->get('page_type', 'home');

        // Get active sections for this page
        $sections = PageSection::forPage($pageType)
            ->active()
            ->ordered()
            ->with('template')
            ->get();

        // If no sections configured, return legacy static data
        if ($sections->isEmpty()) {
            return $this->legacyResponse();
        }

        // Build section data with resolved content
        $resolvedSections = $sections->map(function (PageSection $section) {
            $settings = $section->getMergedSettings();
            $data = [
                'id' => $section->id,
                'key' => $section->template->key,
                'name' => $section->template->name,
                'icon' => $section->template->icon,
                'settings' => $settings,
                'is_active' => $section->is_active,
                'position' => $section->position,
            ];

            // Resolve dynamic data based on section type
            $data['resolved_data'] = $this->resolveData($section->template->key, $settings);

            return $data;
        });

        return response()->json([
            'sections' => $resolvedSections,
            'is_dynamic' => true,
        ]);
    }

    /**
     * Resolve dynamic data for a section (products, categories, brands)
     */
    private function resolveData(string $templateKey, array $settings): array
    {
        switch ($templateKey) {
            case 'product_carousel':
                return $this->resolveProducts($settings);

            case 'product_tabs':
                return $this->resolveProductTabs($settings);

            case 'category_grid':
                return $this->resolveCategories($settings);

            case 'brand_logos':
                return $this->resolveBrands($settings);

            default:
                return [];
        }
    }

    private function resolveProducts(array $settings): array
    {
        $source = $settings['source'] ?? 'latest';
        $limit = min((int) ($settings['limit'] ?? 10), 24);

        $query = Product::where('is_active', true)
            ->with([
                'media' => function ($q) {
                    $q->where('scope', 'product')->orderBy('position');
                },
                'variants.media',
                'variants',
                'brand',
                'categories',
            ]);

        switch ($source) {
            case 'latest':
                $query->latest();
                break;
            case 'featured':
                $query->where('is_featured', true)->latest();
                break;
            case 'on_sale':
                $query->whereNotNull('discount_price')->where('discount_price', '>', 0)->latest();
                break;
            case 'category':
                $categoryId = $settings['category_id'] ?? null;
                if ($categoryId) {
                    $query->whereHas('categories', fn($q) => $q->where('categories.id', $categoryId));
                }
                $query->latest();
                break;
            case 'brand':
                $brandId = $settings['brand_id'] ?? null;
                if ($brandId) {
                    $query->where('brand_id', $brandId);
                }
                $query->latest();
                break;
            case 'tag':
                $tagId = $settings['tag_id'] ?? null;
                if ($tagId) {
                    $query->whereHas('tags', fn($q) => $q->where('tags.id', $tagId));
                }
                $query->latest();
                break;
            case 'manual':
                $raw = $settings['product_ids'] ?? '';
                $ids = is_array($raw) ? array_map('intval', $raw) : $this->parseIds((string) $raw);
                if (!empty($ids)) {
                    $query->whereIn('id', $ids);
                }
                break;
            default:
                $query->latest();
        }

        return ['products' => $query->take($limit)->get()];
    }

    private function resolveProductTabs(array $settings): array
    {
        $tabs = $settings['tabs'] ?? [];
        $resolvedTabs = [];
        $columns = (int) ($settings['columns'] ?? 5);
        $rows = (int) ($settings['rows'] ?? 2);
        $defaultLimit = $columns * $rows * 3; // 3 pages worth for carousel scrolling

        foreach ($tabs as $tab) {
            $tabSettings = array_merge($settings, $tab);
            // Use tab's own limit if set, otherwise columns * rows
            if (empty($tabSettings['limit'])) {
                $tabSettings['limit'] = $defaultLimit;
            }
            $result = $this->resolveProducts($tabSettings);
            $resolvedTabs[] = [
                'title' => $tab['title'] ?? 'Sekme',
                'products' => $result['products'] ?? [],
            ];
        }

        // If no tabs defined, fall back to default products
        if (empty($resolvedTabs)) {
            $result = $this->resolveProducts($settings);
            $resolvedTabs[] = [
                'title' => $settings['title'] ?? 'Ürünler',
                'products' => $result['products'] ?? [],
            ];
        }

        // Also return first tab's products as flat 'products' for backward compat
        return [
            'tabs' => $resolvedTabs,
            'products' => $resolvedTabs[0]['products'] ?? [],
        ];
    }

    private function resolveCategories(array $settings): array
    {
        $source = $settings['source'] ?? 'root_only';
        $limit = min((int) ($settings['limit'] ?? 8), 20);

        $query = Category::query();

        switch ($source) {
            case 'root_only':
                $query->roots()->normal();
                break;
            case 'manual':
                $ids = $this->parseIds($settings['category_ids'] ?? '');
                if (!empty($ids)) {
                    $query->whereIn('id', $ids);
                }
                break;
            default:
                $query->normal();
        }

        return ['categories' => $query->take($limit)->get(['id', 'name', 'slug', 'image'])];
    }

    private function resolveBrands(array $settings): array
    {
        $source = $settings['source'] ?? 'all';
        $limit = min((int) ($settings['limit'] ?? 12), 30);

        $query = Brand::query();

        if ($source === 'manual') {
            $ids = $this->parseIds($settings['brand_ids'] ?? '');
            if (!empty($ids)) {
                $query->whereIn('id', $ids);
            }
        }

        return ['brands' => $query->take($limit)->get(['id', 'name', 'slug', 'image'])];
    }

    private function parseIds(string $value): array
    {
        if (empty($value)) return [];
        return array_filter(array_map('intval', explode(',', $value)));
    }

    /**
     * Legacy static response (fallback when no sections configured)
     */
    private function legacyResponse()
    {
        $categories = Category::roots()->normal()->get(['id', 'name', 'slug', 'image']);

        $newArrivals = Product::where('is_active', true)
            ->with(['media' => function ($q) {
                $q->where('scope', 'product')->orderBy('position');
            }])
            ->latest()
            ->take(8)
            ->get();

        $hero = [
            [
                'id' => 1,
                'title' => 'Yeni Sezon Kumaşlar',
                'subtitle' => '%20 indirimle hemen keşfedin',
                'image' => 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1920&q=80',
                'link' => '/yeni',
                'button_text' => 'Alışverişe Başla'
            ],
            [
                'id' => 2,
                'title' => 'Premium Koleksiyon',
                'subtitle' => 'İtalyan ipeği ve en özel dokular',
                'image' => 'https://images.unsplash.com/photo-1620714223084-8dfacc6dfdca?auto=format&fit=crop&w=1920&q=80',
                'link' => '/kategoriler/premium',
                'button_text' => 'Koleksiyonu Gör'
            ]
        ];

        return response()->json([
            'categories' => $categories,
            'hero' => $hero,
            'new_arrivals' => $newArrivals,
            'is_dynamic' => false,
        ]);
    }
}
