<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\DynamicCategoryRule;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CategoryController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->middleware('permission:categories.index')->only(['show']);
        $this->middleware('permission:categories.create')->only(['store']);
        $this->middleware('permission:categories.edit')->only(['update', 'reorder', 'attachProducts', 'detachProducts', 'syncDynamic']);
        $this->middleware('permission:categories.destroy')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->with(['parent', 'children']);

        if ($ids = $request->input('ids')) {
            $query->whereIn('id', (array) $ids);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'ilike', "%{$search}%");
        }

        if ($request->filled('parent_id')) {
            if ($request->input('parent_id') === 'null') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $request->input('parent_id'));
            }
        }

        $query->orderBy('name');

        if ($request->boolean('paginate', true)) {
            $categories = $query->paginate($request->input('per_page', 50));
        } else {
            $categories = $query->get();
        }

        return response()->json($categories);
    }

    public function tree(Request $request): JsonResponse
    {
        $type = $request->input('type', 'normal');
        
        $categories = Category::query()
            ->where('type', $type)
            ->with('allChildren')
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();

        return response()->json(['categories' => $this->buildTree($categories)]);
    }

    private function buildTree($categories, $depth = 0)
    {
        return $categories->map(function ($category) use ($depth) {
            return [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent_id' => $category->parent_id,
                'image' => $category->image,
                'meta_title' => $category->meta_title,
                'meta_description' => $category->meta_description,
                'type' => $category->type,
                'depth' => $depth,
                'children' => $category->allChildren->isNotEmpty() 
                    ? $this->buildTree($category->allChildren, $depth + 1) 
                    : [],
            ];
        })->toArray();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'image' => ['nullable', 'string'],
            'is_searchable' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
            'type' => ['required', 'in:normal,dynamic'],
            'sort_by' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'in:asc,desc'],
            'manual_sort' => ['nullable', 'boolean'],
            'faq_items' => ['nullable', 'array'],
            'faq_items.*.question' => ['required_with:faq_items', 'string'],
            'faq_items.*.answer' => ['required_with:faq_items', 'string'],
            'dynamic_rule' => ['nullable', 'array'],
            'dynamic_rule.match_type' => ['required_with:dynamic_rule', 'in:all,any'],
            'dynamic_rule.rules' => ['required_with:dynamic_rule', 'array'],
        ]);

        return DB::transaction(function () use ($data) {
            if (empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            if (isset($data['parent_id'])) {
                $parent = Category::find($data['parent_id']);
                if ($parent && $parent->type === 'dynamic') {
                    return response()->json([
                        'message' => 'Dynamic categories cannot have children'
                    ], 422);
                }
            }

            $dynamicRule = $data['dynamic_rule'] ?? null;
            unset($data['dynamic_rule']);

            $category = Category::create($data);

            if ($category->type === 'dynamic' && $dynamicRule) {
                DynamicCategoryRule::create([
                    'category_id' => $category->id,
                    'match_type' => $dynamicRule['match_type'],
                    'rules' => $dynamicRule['rules'],
                ]);
            }

            $category->load(['parent', 'dynamicRule']);

            return response()->json(['category' => $category], 201);
        });
    }

    public function show(Category $category): JsonResponse
    {
        $category->load(['parent', 'children', 'dynamicRule']);
        
        return response()->json(['category' => $category]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug,' . $category->id],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'image' => ['nullable', 'string'],
            'is_searchable' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
            'type' => ['required', 'in:normal,dynamic'],
            'sort_by' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'in:asc,desc'],
            'manual_sort' => ['nullable', 'boolean'],
            'faq_items' => ['nullable', 'array'],
            'faq_items.*.question' => ['required_with:faq_items', 'string'],
            'faq_items.*.answer' => ['required_with:faq_items', 'string'],
            'dynamic_rule' => ['nullable', 'array'],
            'dynamic_rule.match_type' => ['required_with:dynamic_rule', 'in:all,any'],
            'dynamic_rule.rules' => ['required_with:dynamic_rule', 'array'],
        ]);

        return DB::transaction(function () use ($data, $category) {
            if (empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            if (isset($data['parent_id'])) {
                if ($data['parent_id'] == $category->id) {
                    return response()->json([
                        'message' => 'Category cannot be its own parent'
                    ], 422);
                }

                if ($this->wouldCreateCycle($category->id, $data['parent_id'])) {
                    return response()->json([
                        'message' => 'This would create a circular reference'
                    ], 422);
                }

                $parent = Category::find($data['parent_id']);
                if ($parent && $parent->type === 'dynamic') {
                    return response()->json([
                        'message' => 'Dynamic categories cannot have children'
                    ], 422);
                }
            }

            $dynamicRule = $data['dynamic_rule'] ?? null;
            unset($data['dynamic_rule']);

            $category->update($data);

            if ($category->type === 'dynamic') {
                if ($dynamicRule) {
                    DynamicCategoryRule::updateOrCreate(
                        ['category_id' => $category->id],
                        [
                            'match_type' => $dynamicRule['match_type'],
                            'rules' => $dynamicRule['rules'],
                        ]
                    );
                }
            } else {
                $category->dynamicRule()?->delete();
            }

            $category->load(['parent', 'children', 'dynamicRule']);

            return response()->json(['category' => $category]);
        });
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(['ok' => true]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:categories,id'],
        ]);

        foreach ($data['ids'] as $position => $id) {
            Category::where('id', $id)->update(['position' => $position]);
        }

        return response()->json(['ok' => true]);
    }

    public function attachProducts(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $isPrimary = $data['is_primary'] ?? false;

        foreach ($data['product_ids'] as $position => $productId) {
            $category->products()->syncWithoutDetaching([
                $productId => [
                    'is_primary' => $isPrimary,
                    'position' => $position,
                ]
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function detachProducts(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $category->products()->detach($data['product_ids']);

        return response()->json(['ok' => true]);
    }

    public function syncDynamic(Category $category): JsonResponse
    {
        if ($category->type !== 'dynamic') {
            return response()->json([
                'message' => 'Category is not dynamic'
            ], 422);
        }

        $rule = $category->dynamicRule;
        if (!$rule) {
            return response()->json([
                'message' => 'No rules defined for this category'
            ], 422);
        }

        $products = Product::with(['brand', 'tags', 'categories'])->get();
        $matchingIds = [];

        foreach ($products as $product) {
            if ($rule->matchesProduct($product)) {
                $matchingIds[] = $product->id;
            }
        }

        $category->products()->sync($matchingIds);

        return response()->json([
            'ok' => true,
            'matched_count' => count($matchingIds),
        ]);
    }

    private function wouldCreateCycle(int $categoryId, ?int $newParentId): bool
    {
        if ($newParentId === null) {
            return false;
        }

        $current = Category::find($newParentId);
        
        while ($current) {
            if ($current->id === $categoryId) {
                return true;
            }
            $current = $current->parent;
        }

        return false;
    }
}
