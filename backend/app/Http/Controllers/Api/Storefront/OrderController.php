<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderAddress;
use App\Models\OrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingMethod;
use App\Services\PostalCodeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $orderNumber = trim((string) $validated['order_number']);
        $email = strtolower(trim((string) $validated['email']));

        $order = Order::query()
            ->whereRaw('LOWER(order_number) = ?', [strtolower($orderNumber)])
            ->where(function ($query) use ($email) {
                $query->whereHas('billingAddress', function ($addressQuery) use ($email) {
                    $addressQuery->whereRaw('LOWER(email) = ?', [$email]);
                })->orWhereHas('shippingAddress', function ($addressQuery) use ($email) {
                    $addressQuery->whereRaw('LOWER(email) = ?', [$email]);
                })->orWhereHas('customer', function ($customerQuery) use ($email) {
                    $customerQuery->whereRaw('LOWER(email) = ?', [$email]);
                });
            })
            ->with(['items.product.saleUnit', 'items.product.productUnit', 'items.variant.media', 'billingAddress', 'shippingAddress'])
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Siparis bulunamadi.',
            ], 404);
        }

        return response()->json([
            'order' => $order,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user();
        if ($authUser && !($authUser instanceof Customer)) {
            return response()->json([
                'message' => 'Bu işlem yalnızca müşteri hesabı ile yapılabilir.',
            ], 403);
        }

        /** @var Customer|null $customer */
        $customer = $authUser instanceof Customer ? $authUser : null;
        if ($customer && !$customer->is_active) {
            return response()->json([
                'message' => 'Hesabınız pasif durumdadır.',
            ], 403);
        }

        $validated = $request->validate([
            'billing_address' => ['required', 'array'],
            'billing_address.first_name' => ['required', 'string'],
            'billing_address.last_name' => ['required', 'string'],
            'billing_address.phone' => ['nullable', 'string'],
            'billing_address.email' => ['nullable', 'email'],
            'billing_address.company' => ['nullable', 'string'],
            'billing_address.tax_number' => ['nullable', 'string'],
            'billing_address.tax_office' => ['nullable', 'string'],
            'billing_address.address_line_1' => ['required', 'string'],
            'billing_address.city' => ['required', 'string'],
            'billing_address.state' => ['nullable', 'string'],
            'billing_address.country' => ['nullable', 'string'],

            'shipping_address' => ['nullable', 'array'],
            'shipping_address.first_name' => ['required_with:shipping_address', 'string'],
            'shipping_address.last_name' => ['required_with:shipping_address', 'string'],
            'shipping_address.phone' => ['nullable', 'string'],
            'shipping_address.email' => ['nullable', 'email'],
            'shipping_address.company' => ['nullable', 'string'],
            'shipping_address.tax_number' => ['nullable', 'string'],
            'shipping_address.tax_office' => ['nullable', 'string'],
            'shipping_address.address_line_1' => ['required_with:shipping_address', 'string'],
            'shipping_address.city' => ['required_with:shipping_address', 'string'],
            'shipping_address.state' => ['nullable', 'string'],
            'shipping_address.country' => ['nullable', 'string'],

            'same_as_billing' => ['boolean'],
            'payment_method' => ['required', 'string'],
            'shipping_method' => ['required', 'string'],
            'customer_note' => ['nullable', 'string'],
        ]);

        if (!($validated['same_as_billing'] ?? false) && empty($validated['shipping_address'])) {
            throw ValidationException::withMessages([
                'shipping_address' => 'Teslimat adresi zorunludur.',
            ]);
        }

        $sessionId = $request->session()->getId();
        $cart = Cart::getCurrentCart($customer, $sessionId);
        $cart->load(['items.product.taxClass', 'items.product.media', 'items.variant.media', 'items.variant', 'coupon']);

        if ($cart->items->isEmpty()) {
            return response()->json(['message' => 'Sepet boş.'], 422);
        }

        $shippingMethod = ShippingMethod::query()
            ->where('code', $validated['shipping_method'])
            ->where('is_active', true)
            ->first();

        if (!$shippingMethod) {
            return response()->json(['message' => 'Kargo yöntemi bulunamadı.'], 422);
        }

        $paymentMethod = PaymentMethod::enabled()
            ->where('code', $validated['payment_method'])
            ->first();

        if (!$paymentMethod) {
            return response()->json(['message' => 'Ödeme yöntemi bulunamadı.'], 422);
        }

        if ($validated['payment_method'] === 'cash_on_delivery' && !$shippingMethod->cod_enabled) {
            return response()->json(['message' => 'Seçilen kargo yöntemi kapıda ödeme desteklemiyor.'], 422);
        }


        $amountForAvailability = (float) $cart->total;
        if (!$paymentMethod->isAvailableForAmount($amountForAvailability)) {
            return response()->json(['message' => 'Ödeme yöntemi bu tutar için uygun değil.'], 422);
        }

        try {
            DB::beginTransaction();

            $order = Order::create([
                'customer_id' => $customer?->id,
                'user_id' => null,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $validated['payment_method'],
                'shipping_method' => $validated['shipping_method'],
                'customer_note' => $validated['customer_note'] ?? null,
                'source' => 'web',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'currency_code' => $cart->currency ?? 'TRY',
                'currency_rate' => 1,
            ]);

            $subtotal = 0;
            $taxTotal = 0;
            $orderItemsForCoupon = [];

            foreach ($cart->items as $cartItem) {
                $product = $cartItem->product ?? Product::with('taxClass', 'media')->find($cartItem->product_id);
                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => 'Sepette satışta olmayan ürün var.',
                    ]);
                }

                $variant = null;
                if ($cartItem->product_variant_id) {
                    $variant = $cartItem->variant ?? ProductVariant::with('media')->find($cartItem->product_variant_id);
                    if ($variant && !$variant->is_active) {
                        throw ValidationException::withMessages([
                            'items' => 'Sepette satışta olmayan varyant var.',
                        ]);
                    }
                }

                $quantity = (float) $cartItem->quantity;
                $stockQuantity = (float) ($variant?->qty ?? $product->qty);
                $allowBackorder = (bool) ($variant?->allow_backorder ?? $product->allow_backorder);
                $backorderLimit = (int) ($variant?->backorder_limit ?? $product->backorder_limit ?? 0);

                // Check stock availability
                if (!$allowBackorder && $quantity > $stockQuantity) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name} için stok yetersiz.",
                    ]);
                }

                // Check backorder limit if backorder is allowed
                if ($allowBackorder && $backorderLimit > 0) {
                    $backorderQuantity = max(0, $quantity - $stockQuantity);
                    if ($backorderQuantity > $backorderLimit) {
                        throw ValidationException::withMessages([
                            'items' => "{$product->name} için sipariş limiti aşıldı. Maksimum {$backorderLimit} adet ön sipariş alınabilir.",
                        ]);
                    }
                }

                // Offer item ise indirimli fiyatla oluştur
                $customPrice = null;
                if ($cartItem->cart_offer_id && $cartItem->offer_data) {
                    $customPrice = (float) ($cartItem->offer_data['discounted_price'] ?? null);
                }

                $item = OrderItem::createFromProduct(
                    $order->id,
                    $product,
                    $quantity,
                    $variant,
                    $customPrice
                );

                // Offer data'yı order item'a taşı
                if ($cartItem->offer_data) {
                    $offerDiscount = (float) ($cartItem->offer_data['discount_amount'] ?? 0) * $quantity;
                    $item->update([
                        'offer_data' => $cartItem->offer_data,
                        'discount_amount' => $offerDiscount,
                    ]);
                    // line_total'ı yeniden hesapla
                    $item->calculateTotal();
                }

                // Merge cart item options (product extra options) with variant options from createFromProduct
                $cartOptions = !empty($cartItem->options) ? $cartItem->options : (!empty($cartItem->variant_values) ? $cartItem->variant_values : null);
                if ($cartOptions) {
                    $existingOptions = $item->options ?? [];
                    // If both are arrays/objects, merge them; otherwise cart options take precedence only if item has none
                    if (is_array($existingOptions) && !empty($existingOptions) && is_array($cartOptions)) {
                        $merged = array_merge($existingOptions, $cartOptions);
                        $item->update(['options' => $merged]);
                    } elseif (empty($existingOptions)) {
                        $item->update(['options' => $cartOptions]);
                    }
                }

                // subtotal = unit_price * quantity (before tax), not line_total (which includes tax)
                $subtotal += (float) $item->unit_price * (float) $item->quantity;
                $taxTotal += (float) $item->tax_amount;

                $orderItemsForCoupon[] = [
                    'product_id' => $product->id,
                    'variant_id' => $variant?->id,
                    'quantity' => $quantity,
                    'unit_price' => (float) $item->unit_price,
                ];
            }

            // Apply customer group discount if applicable
            $groupDiscount = 0;
            if ($customer) {
                $maxDiscountPercentage = $customer->groups()
                    ->where('is_active', true)
                    ->max('discount_percentage');
                
                if ($maxDiscountPercentage > 0) {
                    $groupDiscount = ($subtotal * $maxDiscountPercentage) / 100;
                }
            }


            $shippingBase = (float) $cart->subtotal;
            $shippingTotal = (float) $shippingMethod->calculateCost($shippingBase);
            if ($validated['payment_method'] === 'cash_on_delivery' && $shippingMethod->cod_enabled) {
                $shippingTotal += (float) $shippingMethod->cod_fee;
            }

            $couponDiscount = 0;
            $couponCode = null;
            $coupon = $cart->coupon;

            if ($coupon) {
                if (!$coupon->isValid()) {
                    throw ValidationException::withMessages([
                        'coupon' => 'Kupon kodu geçersiz veya süresi dolmuş.',
                    ]);
                }

                if ($coupon->customer_eligibility !== 'all' && !$customer) {
                    throw ValidationException::withMessages([
                        'coupon' => 'Bu kupon için müşteri girişi gerekir.',
                    ]);
                }

                if ($customer && !$coupon->canBeUsedByCustomer($customer->id)) {
                    throw ValidationException::withMessages([
                        'coupon' => 'Bu kupon bu müşteri için geçerli değil.',
                    ]);
                }

                $couponDiscount = $coupon->calculateDiscount($subtotal, $orderItemsForCoupon);
                if ($coupon->type === 'free_shipping') {
                    $shippingTotal = 0;
                }

                if ($couponDiscount <= 0 && $coupon->type !== 'free_shipping') {
                    throw ValidationException::withMessages([
                        'coupon' => 'Kupon bu sepet için uygulanamaz.',
                    ]);
                }

                $couponCode = $coupon->code;
            }

            // Calculate payment fee based on subtotal + tax + shipping - discounts
            $totalDiscount = $couponDiscount + $groupDiscount;
            $baseForPaymentFee = max(0, $subtotal + $taxTotal + $shippingTotal - $totalDiscount);
            $paymentFee = (float) $paymentMethod->getFeeAmount($baseForPaymentFee);

            // Grand total includes tax and all discounts
            $grandTotal = $subtotal + $taxTotal + $shippingTotal + $paymentFee - $totalDiscount;

            $order->update([
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'shipping_total' => $shippingTotal,
                'payment_fee' => $paymentFee,
                'discount_total' => $totalDiscount,
                'coupon_code' => $couponCode,
                'coupon_discount' => $couponDiscount,
                'grand_total' => $grandTotal,
            ]);

            $billingAddress = $validated['billing_address'];
            $billingAddress['email'] = $billingAddress['email'] ?? $customer?->email;
            $billingAddress['country'] = $billingAddress['country'] ?? 'TR';
            $billingAddress['address_line_2'] = null;
            $billingAddress['postal_code'] = PostalCodeResolver::resolve(
                $billingAddress['city'] ?? null,
                $billingAddress['state'] ?? null
            ) ?? '00000'; // Default postal code if resolution fails

            OrderAddress::create([
                'order_id' => $order->id,
                'type' => 'billing',
                ...$billingAddress,
            ]);

            $shippingData = $validated['same_as_billing'] ?? false
                ? $billingAddress
                : ($validated['shipping_address'] ?? $billingAddress);

            $shippingData['email'] = $shippingData['email'] ?? $billingAddress['email'];
            $shippingData['country'] = $shippingData['country'] ?? 'TR';
            $shippingData['address_line_2'] = null;
            $shippingData['postal_code'] = PostalCodeResolver::resolve(
                $shippingData['city'] ?? null,
                $shippingData['state'] ?? null
            ) ?? '00000'; // Default postal code if resolution fails

            OrderAddress::create([
                'order_id' => $order->id,
                'type' => 'shipping',
                ...$shippingData,
            ]);

            // Reserve stock for all non-cancelled orders.
            if ($order->status !== 'cancelled') {
                $order->load(['items.product', 'items.variant']);
                $order->decreaseStock();
            }

            $order->addHistory(
                'created',
                'Sipariş oluşturuldu',
                $order->status,
                $order->payment_status,
                null
            );

            if ($coupon && $couponCode && ($couponDiscount > 0 || $coupon->type === 'free_shipping')) {
                CouponUsage::create([
                    'coupon_id' => $coupon->id,
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'discount_amount' => $couponDiscount,
                    'coupon_code' => $couponCode,
                ]);
                $coupon->increment('used_count');
            }

            // Update customer stats asynchronously after response
            if ($order->customer) {
                $customerId = $order->customer->id;
                DB::afterCommit(function () use ($customerId) {
                    dispatch(function () use ($customerId) {
                        $customer = \App\Models\Customer::find($customerId);
                        if ($customer) {
                            $customer->updateStats();
                        }
                    })->afterResponse();
                });
            }

            $cart->clear();

            DB::commit();

            return response()->json([
                'message' => 'Sipariş başarıyla oluşturuldu',
                'order' => $order->load(['items', 'billingAddress', 'shippingAddress', 'customer']),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            if ($e instanceof ValidationException) {
                throw $e;
            }

            return response()->json([
                'message' => 'Sipariş oluşturulurken hata oluştu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}





