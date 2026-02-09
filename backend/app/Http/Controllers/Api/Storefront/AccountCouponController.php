<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountCouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();

        $coupons = Coupon::where('is_active', true)
            ->get()
            ->filter(function (Coupon $coupon) use ($customer) {
                return $coupon->isValid() && $coupon->canBeUsedByCustomer($customer->id);
            })
            ->map(function (Coupon $coupon) use ($customer) {
                $usedCount = Order::where('customer_id', $customer->id)
                    ->where('coupon_code', $coupon->code)
                    ->whereNotIn('status', ['cancelled'])
                    ->count();

                $remaining = $coupon->usage_limit_per_customer !== null
                    ? max(0, $coupon->usage_limit_per_customer - $usedCount)
                    : null;

                return [
                    'coupon' => $coupon,
                    'used_count' => $usedCount,
                    'remaining_usage' => $remaining,
                ];
            })
            ->values();

        return response()->json([
            'coupons' => $coupons,
        ]);
    }
}
