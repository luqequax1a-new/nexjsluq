<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:coupons.index')->only(['index', 'show', 'statistics', 'usageLogs', 'allStatistics']);
        $this->middleware('permission:coupons.create')->only(['store']);
        $this->middleware('permission:coupons.edit')->only(['update']);
        $this->middleware('permission:coupons.destroy')->only(['destroy']);
    }

    /**
     * List all coupons with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_automatic')) {
            $query->where('is_automatic', $request->boolean('is_automatic'));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $coupons = $query->paginate($request->input('per_page', 20));

        return response()->json($coupons);
    }

    /**
     * Create new coupon
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateCoupon($request);

        // Auto-generate code for automatic discounts if not provided
        if (($validated['is_automatic'] ?? false) && empty($validated['code'])) {
            $validated['code'] = 'AUTO-' . strtoupper(Str::random(8));
        }

        try {
            DB::beginTransaction();

            $coupon = Coupon::create($validated);
            $this->syncRelations($coupon, $request);

            DB::commit();

            return response()->json([
                'message' => 'Kupon başarıyla oluşturuldu',
                'coupon' => $coupon->load(['products', 'categories', 'customers', 'customerGroups']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get single coupon
     */
    public function show(Coupon $coupon): JsonResponse
    {
        return response()->json($coupon->load(['products', 'categories', 'customers', 'customerGroups']));
    }

    /**
     * Update coupon
     */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $this->validateCoupon($request, $coupon->id);

        try {
            DB::beginTransaction();

            $coupon->update($validated);
            $this->syncRelations($coupon, $request);

            DB::commit();

            return response()->json([
                'message' => 'Kupon güncellendi',
                'coupon' => $coupon->load(['products', 'categories', 'customers', 'customerGroups']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete coupon
     */
    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return response()->json([
            'message' => 'Kupon silindi',
        ]);
    }

    /**
     * Validate coupon code for a cart
     */
    public function validateCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric'],
            'customer_id' => ['nullable', 'integer'],
            'items' => ['nullable', 'array'], // Array of {product_id, variant_id, quantity, unit_price}
        ]);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            return response()->json(['message' => 'Geçersiz kupon kodu'], 422);
        }

        if (!$coupon->isValid()) {
            return response()->json(['message' => 'Bu kuponun süresi dolmuş veya kullanım limiti aşılmış'], 422);
        }

        if ($request->customer_id && !$coupon->canBeUsedByCustomer($request->customer_id)) {
            return response()->json(['message' => 'Bu kuponu daha fazla kullanamazsınız'], 422);
        }
        
        $discount = $coupon->calculateDiscount($request->subtotal, $request->input('items', []));

        if ($discount <= 0) {
            // Check specific reasons if needed (min spend, eligible items)
             return response()->json(['message' => 'Kupon bu sepet için geçerli değil (Alt limit veya ürün kısıtlaması)'], 422);
        }

        return response()->json([
            'message' => 'Kupon uygulandı',
            'coupon' => $coupon,
            'discount' => $discount,
        ]);
    }

    /**
     * Get usage statistics for a coupon
     */
    public function statistics(Coupon $coupon): JsonResponse
    {
        $usages = \App\Models\CouponUsage::where('coupon_id', $coupon->id);
        
        $stats = [
            'total_usage' => $usages->count(),
            'total_discount' => (float)$usages->sum('discount_amount'),
            'total_sales' => (float)\App\Models\Order::whereIn('id', $usages->pluck('order_id'))->sum('grand_total'),
            'daily_usage' => $usages->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Get detailed usage logs for a coupon
     */
    public function usageLogs(Coupon $coupon): JsonResponse
    {
        $logs = \App\Models\CouponUsage::with(['order', 'customer'])
            ->where('coupon_id', $coupon->id)
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    /**
     * Get performance reports for all active campaigns
     */
    public function allStatistics(): JsonResponse
    {
        $topCoupons = \App\Models\CouponUsage::select('coupon_id', DB::raw('count(*) as usage_count'), DB::raw('sum(discount_amount) as total_discount'))
            ->groupBy('coupon_id')
            ->orderBy('usage_count', 'desc')
            ->with(['coupon' => function($q) {
                $q->select('id', 'name', 'code', 'type');
            }])
            ->limit(10)
            ->get();

        $totalDiscountGiven = (float)\App\Models\CouponUsage::sum('discount_amount');
        $totalUsageCount = \App\Models\CouponUsage::count();

        // Trend data: Last 30 days
        $startDate = now()->subDays(30)->startOfDay();
        $usageTrend = \App\Models\CouponUsage::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count'),
            DB::raw('sum(discount_amount) as amount')
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'summary' => [
                'total_discount_given' => $totalDiscountGiven,
                'total_usage_count' => $totalUsageCount,
            ],
            'top_coupons' => $topCoupons,
            'usage_trend' => $usageTrend,
        ]);
    }
    
    private function validateCoupon(Request $request, $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [Rule::requiredIf(!$request->boolean('is_automatic')), 'nullable', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($id)],
            'type' => ['required', Rule::in(['fixed', 'percentage', 'free_shipping'])],
            'value' => ['required', 'numeric', 'min:0'],
            'applies_to' => ['required', Rule::in(['all', 'specific_products', 'specific_categories'])],
            'min_requirement_type' => ['required', Rule::in(['none', 'amount', 'quantity'])],
            'min_requirement_value' => ['nullable', 'numeric', 'min:0'],
            'customer_eligibility' => ['required', Rule::in(['all', 'specific_groups', 'specific_customers'])],
            'is_automatic' => ['boolean'],
            
            // BXGY fields
            'discount_type' => ['nullable', Rule::in(['simple', 'bxgy', 'tiered'])],
            'buy_quantity' => ['nullable', 'integer', 'min:1'],
            'get_quantity' => ['nullable', 'integer', 'min:1'],
            'get_discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'buy_product_ids' => ['nullable', 'array'],
            'buy_product_ids.*' => ['integer', 'exists:products,id'],
            'get_product_ids' => ['nullable', 'array'],
            'get_product_ids.*' => ['integer', 'exists:products,id'],
            
            // Combination and priority
            'can_combine_with_other_coupons' => ['boolean'],
            'can_combine_with_auto_discounts' => ['boolean'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:100'],
            
            // Exclude fields
            'exclude_product_ids' => ['nullable', 'array'],
            'exclude_product_ids.*' => ['integer', 'exists:products,id'],
            'exclude_category_ids' => ['nullable', 'array'],
            'exclude_category_ids.*' => ['integer', 'exists:categories,id'],
            
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_customer' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string'],
            'product_ids' => ['nullable', 'array'],
            'category_ids' => ['nullable', 'array'],
            'customer_ids' => ['nullable', 'array'],
            'customer_group_ids' => ['nullable', 'array'],
            
            // Tiered
            'tiered_data' => ['nullable', 'array'],
            'tiered_data.*.min' => ['required', 'numeric', 'min:0'],
            'tiered_data.*.value' => ['required', 'numeric', 'min:0'],
            'tiered_data.*.type' => ['required', Rule::in(['percentage', 'fixed'])],
        ]);
    }
    
    private function syncRelations(Coupon $coupon, Request $request): void
    {
        if ($request->has('product_ids')) {
            $coupon->products()->sync($request->input('product_ids', []));
        }
        
        if ($request->has('category_ids')) {
            $coupon->categories()->sync($request->input('category_ids', []));
        }
        
        if ($request->has('customer_ids')) {
            $coupon->customers()->sync($request->input('customer_ids', []));
        }

        if ($request->has('customer_group_ids')) {
            $coupon->customerGroups()->sync($request->input('customer_group_ids', []));
        }
    }
}
