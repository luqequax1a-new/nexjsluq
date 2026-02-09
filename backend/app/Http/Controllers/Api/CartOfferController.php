<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartOffer;
use App\Models\CartOfferProduct;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CartOfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CartOffer::with(['products.product', 'products.variant'])
            ->withCount('usage');

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('title', 'ILIKE', "%{$search}%");
            });
        }

        if ($request->filled('placement')) {
            $query->where('placement', $request->placement);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('trigger_type')) {
            $query->where('trigger_type', $request->trigger_type);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'priority');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $offers = $query->paginate($perPage);

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'title' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'placement' => 'required|in:cart,checkout,product_page,post_checkout',
            'trigger_type' => 'required|in:all_products,specific_products,specific_categories,cart_total',
            'trigger_config' => 'nullable|array',
            'conditions' => 'nullable|array',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'display_config' => 'nullable|array',
            'priority' => 'nullable|integer',
            'is_active' => 'boolean',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.variant_id' => 'nullable|exists:product_variants,id',
            'products.*.allow_variant_selection' => 'boolean',
            'products.*.discount_type' => 'required|in:percentage,fixed,none',
            'products.*.discount_base' => 'required|in:selling_price,regular_price',
            'products.*.discount_value' => 'required|numeric|min:0',
            'products.*.display_order' => 'nullable|integer',
            'products.*.show_condition' => 'required|in:always,if_accepted,if_rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $offer = CartOffer::create($request->except('products'));

            foreach ($request->products as $index => $productData) {
                $productData['display_order'] = $productData['display_order'] ?? $index;
                $offer->products()->create($productData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Sepet teklifi başarıyla oluşturuldu',
                'data' => $offer->load('products.product', 'products.variant')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Bir hata oluştu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(CartOffer $cartOffer): JsonResponse
    {
        $cartOffer->load([
            'products.product.media',
            'products.product.saleUnit',
            'products.product.productUnit',
            'products.product.variants',
            'products.variant',
            'usage'
        ]);

        return response()->json($cartOffer);
    }

    public function update(Request $request, CartOffer $cartOffer): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'title' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'placement' => 'sometimes|required|in:cart,checkout,product_page,post_checkout',
            'trigger_type' => 'sometimes|required|in:all_products,specific_products,specific_categories,cart_total',
            'trigger_config' => 'nullable|array',
            'conditions' => 'nullable|array',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'display_config' => 'nullable|array',
            'priority' => 'nullable|integer',
            'is_active' => 'boolean',
            'products' => 'sometimes|required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.variant_id' => 'nullable|exists:product_variants,id',
            'products.*.allow_variant_selection' => 'boolean',
            'products.*.discount_type' => 'required|in:percentage,fixed,none',
            'products.*.discount_base' => 'required|in:selling_price,regular_price',
            'products.*.discount_value' => 'required|numeric|min:0',
            'products.*.display_order' => 'nullable|integer',
            'products.*.show_condition' => 'required|in:always,if_accepted,if_rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $cartOffer->update($request->except('products'));

            if ($request->has('products')) {
                // Delete old products
                $cartOffer->products()->delete();

                // Create new products
                foreach ($request->products as $index => $productData) {
                    $productData['display_order'] = $productData['display_order'] ?? $index;
                    $cartOffer->products()->create($productData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Sepet teklifi başarıyla güncellendi',
                'data' => $cartOffer->load('products.product', 'products.variant')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Bir hata oluştu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(CartOffer $cartOffer): JsonResponse
    {
        try {
            $cartOffer->delete();

            return response()->json([
                'message' => 'Sepet teklifi başarıyla silindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bir hata oluştu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stats(CartOffer $cartOffer): JsonResponse
    {
        $stats = [
            'total_usage' => $cartOffer->used_count,
            'is_active' => $cartOffer->is_active,
            'is_valid' => $cartOffer->isValid(),
            'starts_at' => $cartOffer->starts_at,
            'ends_at' => $cartOffer->ends_at,
            'days_remaining' => $cartOffer->ends_at ? now()->diffInDays($cartOffer->ends_at, false) : null,
        ];

        return response()->json($stats);
    }

    public function toggleStatus(CartOffer $cartOffer): JsonResponse
    {
        $cartOffer->update([
            'is_active' => !$cartOffer->is_active
        ]);

        return response()->json([
            'message' => 'Durum başarıyla güncellendi',
            'is_active' => $cartOffer->is_active
        ]);
    }
}
