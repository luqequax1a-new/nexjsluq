<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    private function normalizeLabel($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        $s = trim((string) $value);
        if ($s === '') return [];

        return ['tr' => $s];
    }

    public function store(Request $request, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'parent_id' => ['nullable', 'integer'],
            'type' => ['required', 'string', Rule::in(['url', 'category'])],
            'label' => ['required'],
            'url' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'target' => ['sometimes', 'string', Rule::in(['_self', '_blank'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $label = $this->normalizeLabel($data['label']);

        $maxSort = MenuItem::query()
            ->where('menu_id', $menu->id)
            ->where('parent_id', Arr::get($data, 'parent_id'))
            ->max('sort_order');

        $item = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => Arr::get($data, 'parent_id'),
            'sort_order' => is_null($maxSort) ? 0 : ((int) $maxSort + 1),
            'type' => $data['type'],
            'label' => $label,
            'url' => $data['type'] === 'url' ? ($data['url'] ?? '') : null,
            'category_id' => $data['type'] === 'category' ? ($data['category_id'] ?? null) : null,
            'target' => $data['target'] ?? '_self',
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(['url', 'category'])],
            'label' => ['required'],
            'url' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'target' => ['sometimes', 'string', Rule::in(['_self', '_blank'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $menuItem->type = $data['type'];
        $menuItem->label = $this->normalizeLabel($data['label']);
        $menuItem->url = $data['type'] === 'url' ? ($data['url'] ?? '') : null;
        $menuItem->category_id = $data['type'] === 'category' ? ($data['category_id'] ?? null) : null;
        $menuItem->target = $data['target'] ?? $menuItem->target;
        if (array_key_exists('is_active', $data)) {
            $menuItem->is_active = (bool) $data['is_active'];
        }

        $menuItem->save();

        return response()->json(['item' => $menuItem]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        DB::transaction(function () use ($menuItem) {
            $this->deleteRecursive($menuItem);
        });

        return response()->json(['ok' => true]);
    }

    private function deleteRecursive(MenuItem $item): void
    {
        $children = MenuItem::query()->where('parent_id', $item->id)->get();
        foreach ($children as $c) {
            $this->deleteRecursive($c);
        }
        $item->delete();
    }
}
