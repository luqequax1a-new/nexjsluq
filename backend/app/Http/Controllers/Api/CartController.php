<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Coupon;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    /**
     * Get current cart
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getCurrentCart($request);
        
        return response()->json([
            'cart' => $cart->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
            'item_count' => $cart->itemCount(),
            'is_empty' => $cart->isEmpty(),
        ]);
    }

    /**
     * Add item to cart
     */
    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.001',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'options' => 'nullable|array',
        ]);

        $cart = $this->getCurrentCart($request);
        $product = Product::findOrFail($request->product_id);
        $variant = $request->product_variant_id ? ProductVariant::findOrFail($request->product_variant_id) : null;

        // Check if product is active
        if (!$product->is_active || ($variant && !$variant->is_active)) {
            throw ValidationException::withMessages([
                'product' => 'Bu ürün şu anda satışta değil.',
            ]);
        }

        $stockQuantity = (float) ($variant?->qty ?? $product->qty);
        $allowBackorder = (bool) ($variant?->allow_backorder ?? $product->allow_backorder);
        $backorderLimit = (int) ($variant?->backorder_limit ?? $product->backorder_limit ?? 0);

        // Check existing cart item to account for already-added quantity
        $existingItem = $cart->items()
            ->where('product_id', $product->id)
            ->where('product_variant_id', $variant?->id)
            ->first();

        $totalQtyAfterAdd = (float) $request->quantity + (float) ($existingItem?->quantity ?? 0);

        // Check stock unless backorder is allowed
        if (!$allowBackorder && $totalQtyAfterAdd > $stockQuantity) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok miktarından fazla ürün ekleyemezsiniz.',
            ]);
        }

        // Check backorder limit if backorder is allowed
        if ($allowBackorder && $backorderLimit > 0) {
            $backorderQuantity = max(0, $totalQtyAfterAdd - $stockQuantity);
            if ($backorderQuantity > $backorderLimit) {
                throw ValidationException::withMessages([
                    'quantity' => "Sipariş limiti aşıldı. Maksimum {$backorderLimit} adet ön sipariş alınabilir.",
                ]);
            }
        }

        // Cart::addItem handles merge internally (increases qty if same product/variant exists)
        $cartItem = $cart->addItem(
            $product,
            $request->quantity,
            $request->options ?? [],
            $variant
        );

        return response()->json([
            'message' => 'Ürün sepete eklendi',
            'cart_item' => $cartItem->load('product.media', 'product', 'variant.media', 'variant', 'saleUnit'),
            'cart' => $cart->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
            'item_count' => $cart->itemCount(),
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.001',
        ]);

        // Check if cart item belongs to current user/session
        $cart = $this->getCurrentCart($request);
        
        if ($cartItem->cart_id !== $cart->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if product is still active
        $product = $cartItem->product;
        $variant = $cartItem->variant;
        if (!$product || !$product->is_active || ($variant && !$variant->is_active)) {
            throw ValidationException::withMessages([
                'product' => 'Bu ürün şu anda satışta değil.',
            ]);
        }

        // Check stock unless backorder is allowed
        $stockQuantity = (float) ($variant?->qty ?? $product->qty);
        $allowBackorder = (bool) ($variant?->allow_backorder ?? $product->allow_backorder);
        $backorderLimit = (int) ($variant?->backorder_limit ?? $product->backorder_limit ?? 0);
        $newQty = (float) $request->quantity;

        if (!$allowBackorder && $newQty > $stockQuantity) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok miktarından fazla ürün ekleyemezsiniz.',
            ]);
        }

        if ($allowBackorder && $backorderLimit > 0) {
            $backorderQuantity = max(0, $newQty - $stockQuantity);
            if ($backorderQuantity > $backorderLimit) {
                throw ValidationException::withMessages([
                    'quantity' => "Sipariş limiti aşıldı. Maksimum {$backorderLimit} adet ön sipariş alınabilir.",
                ]);
            }
        }

        $cartItem->updateQuantity($newQty);

        return response()->json([
            'message' => 'Sepet güncellendi',
            'cart_item' => $cartItem->load('product.media', 'product', 'variant.media', 'variant', 'saleUnit'),
            'cart' => $cart->fresh()->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
            'item_count' => $cart->itemCount(),
        ]);
    }

    /**
     * Remove item from cart
     */
    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->getCurrentCart($request);
        
        if ($cartItem->cart_id !== $cart->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $cart->removeItem($cartItem);

        return response()->json([
            'message' => 'Ürün sepetten kaldırıldı',
            'cart' => $cart->fresh()->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
            'item_count' => $cart->itemCount(),
        ]);
    }

    /**
     * Clear cart
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getCurrentCart($request);
        $cart->clear();

        return response()->json([
            'message' => 'Sepet temizlendi',
            'cart' => $cart->fresh(),
            'item_count' => 0,
        ]);
    }

    /**
     * Apply coupon
     */
    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $cart = $this->getCurrentCart($request);
        $coupon = Coupon::where('code', $request->code)
            ->where('is_active', true)
            ->first();

        if (!$coupon) {
            return response()->json(['error' => 'Kupon kodu geçersiz'], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json(['error' => 'Kupon kodu geçerli değil veya süresi dolmuş'], 400);
        }

        // Check customer eligibility
        $authUser = $request->user();
        $customer = $authUser instanceof Customer ? $authUser : null;

        if ($coupon->customer_eligibility !== 'all' && !$customer) {
            return response()->json(['error' => 'Bu kupon için müşteri girişi gerekir.'], 400);
        }

        if ($customer && !$coupon->canBeUsedByCustomer($customer->id)) {
            return response()->json(['error' => 'Bu kupon hesabınız için geçerli değil.'], 400);
        }

        // Check minimum spend requirements
        $subtotal = (float) $cart->subtotal;
        if ($coupon->min_requirement_type === 'amount' && $subtotal < (float) $coupon->min_requirement_value) {
            return response()->json(['error' => 'Minimum sepet tutarı: ' . number_format($coupon->min_requirement_value, 2) . ' TL'], 400);
        }
        if ($coupon->min_requirement_type === 'none' && $coupon->min_spend > 0 && $subtotal < (float) $coupon->min_spend) {
            return response()->json(['error' => 'Minimum sepet tutarı: ' . number_format($coupon->min_spend, 2) . ' TL'], 400);
        }

        $discount = $coupon->calculateDiscount($subtotal);
        
        $cart->update([
            'coupon_id' => $coupon->id,
            'coupon_discount' => $discount,
        ]);
        
        $cart->calculateTotals();

        return response()->json([
            'message' => 'Kupon uygulandı',
            'coupon' => $coupon,
            'discount' => $discount,
            'cart' => $cart->fresh()->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
        ]);
    }

    /**
     * Remove coupon
     */
    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->getCurrentCart($request);
        
        $cart->update([
            'coupon_id' => null,
            'coupon_discount' => 0,
        ]);
        
        $cart->calculateTotals();

        return response()->json([
            'message' => 'Kupon kaldırıldı',
            'cart' => $cart->fresh()->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
        ]);
    }

    /**
     * Validate current coupon
     */
    public function validateCoupon(Request $request): JsonResponse
    {
        $cart = $this->getCurrentCart($request);
        
        if (!$cart->coupon_id) {
            return response()->json([
                'valid' => true,
                'message' => 'Sepette kupon yok',
            ]);
        }

        $coupon = $cart->coupon;
        
        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Kupon bulunamadı',
            ]);
        }

        // Check if coupon is still valid
        if (!$coupon->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Kupon artık geçerli değil',
            ]);
        }

        // Check customer eligibility if logged in
        $customer = $request->user();
        if ($customer instanceof Customer && !$coupon->canBeUsedByCustomer($customer->id)) {
            return response()->json([
                'valid' => false,
                'message' => 'Bu kupon sizin için geçerli değil',
            ]);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Kupon geçerli',
        ]);
    }

    /**
     * Get current cart based on user or session
     */
    private function getCurrentCart(Request $request): Cart
    {
        $sessionId = $request->session()->getId();
        $authUser = $request->user();
        $customer = $authUser instanceof Customer ? $authUser : null;

        if ($customer) {
            // If customer is logged in, get or create their cart
            $cart = Cart::where('customer_id', $customer->id)->first();
            
            if (!$cart) {
                // Try to migrate session cart to user cart
                $sessionCart = Cart::where('session_id', $sessionId)
                    ->whereNull('customer_id')
                    ->first();
                if ($sessionCart) {
                    $sessionCart->update([
                        'customer_id' => $customer->id,
                        'session_id' => null,
                    ]);
                    $cart = $sessionCart;
                } else {
                    $cart = Cart::create([
                        'customer_id' => $customer->id,
                        'currency' => 'TRY',
                    ]);
                }
            }
            
            return $cart;
        }

        // For guest users, get or create session cart
        return Cart::firstOrCreate([
            'session_id' => $sessionId,
            'customer_id' => null,
        ], [
            'currency' => 'TRY',
        ]);
    }
}
