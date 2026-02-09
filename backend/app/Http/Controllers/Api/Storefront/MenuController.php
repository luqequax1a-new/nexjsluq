<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    public function show(string $code): JsonResponse
    {
        $code = trim($code);
        if ($code === '') {
            return response()->json(['items' => []]);
        }

        $known = [
            'storefront_primary' => 'Storefront Primary',
            'storefront_categories' => 'Storefront Categories',
        ];

        $menu = null;
        if (array_key_exists($code, $known)) {
            $menu = Menu::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $known[$code], 'is_active' => true]
            );
        } else {
            $menu = Menu::query()->where('code', $code)->first();
        }

        if (!$menu || !$menu->is_active) {
            return response()->json(['items' => []]);
        }

        $items = MenuItem::query()
            ->where('menu_id', $menu->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $categoryIds = $items
            ->where('type', 'category')
            ->pluck('category_id')
            ->filter()
            ->unique()
            ->values();

        $categoriesById = $categoryIds->isEmpty()
            ? collect()
            : Category::query()
                ->whereIn('id', $categoryIds)
                ->get(['id', 'slug', 'image'])
                ->keyBy('id');

        $byParent = [];
        foreach ($items as $it) {
            $pid = $it->parent_id ? (string) $it->parent_id : 'root';
            if (!array_key_exists($pid, $byParent)) $byParent[$pid] = [];
            $byParent[$pid][] = $it;
        }

        $build = function ($parentKey) use (&$build, $byParent, $categoriesById) {
            $arr = $byParent[$parentKey] ?? [];
            return array_map(function (MenuItem $it) use (&$build, $categoriesById) {
                // label: prefer tr, fallback to first value
                $label = $it->label;
                $name = '';
                if (is_array($label)) {
                    $name = (string) ($label['tr'] ?? reset($label) ?? '');
                }

                $url = null;
                $image = null;
                if ($it->type === 'url') {
                    $url = $it->url;
                } elseif ($it->type === 'category' && $it->category_id) {
                    $cat = $categoriesById->get($it->category_id);
                    $slug = $cat ? $cat->slug : null;
                    $image = $cat ? $cat->image : null;
                    $url = $slug ? "/kategoriler/{$slug}" : null;
                }

                return [
                    'id' => $it->id,
                    'type' => $it->type,
                    'label' => $name,
                    'label_i18n' => $label,
                    'url' => $url,
                    'image' => $image,
                    'category_id' => $it->category_id,
                    'target' => $it->target,
                    'children' => $build((string) $it->id),
                ];
            }, $arr);
        };

        return response()->json([
            'menu' => ['id' => $menu->id, 'code' => $menu->code, 'name' => $menu->name],
            'items' => $build('root'),
        ]);
    }
}
