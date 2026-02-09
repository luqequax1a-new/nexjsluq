<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartOffer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CartOfferService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CartOfferController extends Controller
{
    protected $offerService;

    public function __construct(CartOfferService $offerService)
    {
        $this->offerService = $offerService;
    }

    public function resolve(Request $request): JsonResponse
    {
        $sessionId = $request->session()->getId();
        $customer = $request->user();
        
        $cart = Cart::getCurrentCart($customer, $sessionId);
        
        $placement = $request->get('placement', 'checkout');
        $productId = $request->get('product_id');
        
        $offerData = $this->offerService->resolveBestOffer(
            $cart, 
            $placement, 
            $customer?->id,
            $productId
        );

        return response()->json($offerData);
    }

    public function accept(Request $request): JsonResponse
    {
        $request->validate([
            'offer_id' => 'required|exists:cart_offers,id',
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|numeric|min:0.001',
        ]);

        $sessionId = $request->session()->getId();
        $customer = $request->user();
        $cart = Cart::getCurrentCart($customer, $sessionId);
        
        $offer = CartOffer::findOrFail($request->offer_id);
        $product = Product::findOrFail($request->product_id);
        $variant = $request->variant_id ? ProductVariant::findOrFail($request->variant_id) : null;

        // Teklif ürün bilgisini bul
        $offerProduct = $offer->products()
            ->where('product_id', $product->id)
            ->first();

        $item = $variant ?? $product;
        $basePrice = ($offerProduct?->discount_base ?? 'selling_price') === 'regular_price'
            ? (float) ($item->price ?? 0)
            : (float) ($item->selling_price ?? $item->price ?? 0);

        $discountType = $offerProduct?->discount_type ?? 'percentage';
        $discountValue = (float) ($offerProduct?->discount_value ?? 0);

        $discountedPrice = match($discountType) {
            'percentage' => round(max($basePrice * (1 - $discountValue / 100), 0), 2),
            'fixed' => round(max($basePrice - $discountValue, 0), 2),
            default => $basePrice,
        };

        $offerData = [
            'offer_id' => $offer->id,
            'offer_name' => $offer->getTitle(),
            'original_price' => $basePrice,
            'discounted_price' => $discountedPrice,
            'discount_amount' => max(0, $basePrice - $discountedPrice),
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
        ];

        // Sepete ekle (offer fiyatıyla)
        $cartItem = $cart->addItem(
            $product,
            $request->quantity,
            [],
            $variant,
            $offer->id,
            $offerData
        );

        // Kullanım sayacını artır
        $offer->incrementUsage($customer?->id);

        return response()->json([
            'message' => 'Teklif kabul edildi ve ürün sepete eklendi',
            'cart' => $cart->fresh()->load('items.product.media', 'items.product', 'items.variant.media', 'items.variant', 'items.saleUnit'),
        ]);
    }
}
