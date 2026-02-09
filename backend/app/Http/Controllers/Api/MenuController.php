<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MenuController extends Controller
{
    public function default(): JsonResponse
    {
        $nameMap = [
            'storefront_primary' => 'Storefront Primary',
            'storefront_categories' => 'Storefront Categories',
            'storefront_categories_top' => 'Storefront Top Categories',
            'storefront_more' => 'Storefront More',
        ];

        foreach ($nameMap as $code => $name) {
            Menu::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $name, 'is_active' => true]
            );
        }

        $menu = Menu::query()->where('code', 'storefront_primary')->first();

        return response()->json(['menu' => $menu]);
    }

    public function byCode(string $code): JsonResponse
    {
        $code = trim($code);
        if ($code === '') {
            return response()->json(['message' => 'Invalid code'], 422);
        }

        $nameMap = [
            'storefront_primary' => 'Storefront Primary',
            'storefront_categories' => 'Storefront Categories',
            'storefront_categories_top' => 'Storefront Top Categories',
            'storefront_more' => 'Storefront More',
        ];

        $menu = Menu::query()->firstOrCreate(
            ['code' => $code],
            ['name' => $nameMap[$code] ?? $code, 'is_active' => true]
        );

        return response()->json(['menu' => $menu]);
    }

    public function index(): JsonResponse
    {
        $menus = Menu::query()->orderBy('name')->get();
        return response()->json(['menus' => $menus]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:menus,code'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $menu = Menu::create($data);
        return response()->json(['menu' => $menu], 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        return response()->json(['menu' => $menu]);
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('menus', 'code')->ignore($menu->id)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $menu->update($data);
        return response()->json(['menu' => $menu]);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $menu->delete();
        return response()->json(['ok' => true]);
    }

    public function tree(Menu $menu): JsonResponse
    {
        $items = MenuItem::query()
            ->where('menu_id', $menu->id)
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->with(['childrenRecursive'])
            ->get();

        $map = function (MenuItem $it) use (&$map): array {
            return [
                'id' => $it->id,
                'menu_id' => $it->menu_id,
                'parent_id' => $it->parent_id,
                'sort_order' => $it->sort_order,
                'type' => $it->type,
                'label' => $it->label,
                'url' => $it->url,
                'category_id' => $it->category_id,
                'target' => $it->target,
                'is_active' => $it->is_active,
                'children' => $it->childrenRecursive
                    ? $it->childrenRecursive->map(fn (MenuItem $c) => $map($c))->values()->all()
                    : [],
            ];
        };

        return response()->json([
            'items' => $items->map(fn (MenuItem $it) => $map($it))->values()->all(),
        ]);
    }

    public function reorder(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
        ]);

        $items = $data['items'];

        DB::transaction(function () use ($menu, $items) {
            $seen = [];

            $apply = function (array $nodes, ?int $parentId) use (&$apply, $menu, &$seen) {
                foreach (array_values($nodes) as $idx => $node) {
                    $id = (int) Arr::get($node, 'id', 0);
                    if ($id <= 0) continue;

                    /** @var MenuItem $it */
                    $it = MenuItem::query()
                        ->where('menu_id', $menu->id)
                        ->where('id', $id)
                        ->first();

                    if (!$it) continue;

                    $it->parent_id = $parentId;
                    $it->sort_order = $idx;
                    $it->save();

                    $seen[$id] = true;

                    $children = Arr::get($node, 'children');
                    if (is_array($children) && count($children)) {
                        $apply($children, $id);
                    }
                }
            };

            $apply($items, null);
        });

        return response()->json(['ok' => true]);
    }

    public function importCategories(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'mode' => ['nullable', 'in:replace,append'],
            'max_depth' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $mode = $data['mode'] ?? 'replace';
        $maxDepth = array_key_exists('max_depth', $data) ? $data['max_depth'] : null;

        $categories = Category::query()
            ->where('type', 'normal')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        $childrenByParentId = [];
        foreach ($categories as $cat) {
            $pid = $cat->parent_id;
            if (!array_key_exists($pid, $childrenByParentId)) {
                $childrenByParentId[$pid] = [];
            }
            $childrenByParentId[$pid][] = $cat;
        }

        DB::transaction(function () use ($menu, $mode, $childrenByParentId, $maxDepth): void {
            if ($mode === 'replace') {
                MenuItem::query()->where('menu_id', $menu->id)->delete();
            }

            $createNodes = function (?int $parentCategoryId, ?int $parentMenuItemId, int $depth) use (&$createNodes, $menu, $childrenByParentId, $maxDepth): void {
                $children = $childrenByParentId[$parentCategoryId] ?? [];
                foreach (array_values($children) as $idx => $cat) {
                    $item = MenuItem::query()->create([
                        'menu_id' => $menu->id,
                        'parent_id' => $parentMenuItemId,
                        'sort_order' => $idx,
                        'type' => 'category',
                        'label' => ['tr' => $cat->name],
                        'url' => null,
                        'category_id' => $cat->id,
                        'target' => '_self',
                        'is_active' => true,
                    ]);

                    if ($maxDepth === null || $depth < (int) $maxDepth) {
                        $createNodes($cat->id, $item->id, $depth + 1);
                    }
                }
            };

            $createNodes(null, null, 1);
        });

        return response()->json(['ok' => true]);
    }
}
