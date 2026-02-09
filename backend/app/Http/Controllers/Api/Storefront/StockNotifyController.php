<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockNotifyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockNotifyController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first() ?: 'Geçersiz istek.',
            ], 422);
        }

        $validated = $validator->validated();
        $email = (string) $validated['email'];
        $variantId = $validated['variant_id'] ?? null;

        $product = Product::with('variants')->findOrFail((int) $validated['product_id']);

        // Check if variant belongs to product
        if ($variantId !== null) {
            $variant = $product->variants->where('id', (int) $variantId)->first();

            if (!$variant) {
                return response()->json(['status' => 'error', 'message' => 'Geçersiz varyant.'], 422);
            }

            // If variant is already in stock, no need to notify
            if ($variant->in_stock || (float) ($variant->qty ?? 0) > 0) {
                return response()->json(['status' => 'ok', 'message' => 'Ürün şu an stokta.']);
            }
        } else {
            if ($product->in_stock) {
                return response()->json(['status' => 'ok', 'message' => 'Ürün şu an stokta.']);
            }
        }

        // Check for existing pending request
        $existingQuery = StockNotifyRequest::query()
            ->where('product_id', $product->id)
            ->where('email', $email)
            ->whereNull('sent_at');

        if ($variantId === null) {
            $existingQuery->whereNull('variant_id');
        } else {
            $existingQuery->where('variant_id', (int) $variantId);
        }

        if ($existingQuery->exists()) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Talebiniz zaten alındı. Ürün stok açıldığında size haber vereceğiz.',
            ]);
        }

        StockNotifyRequest::create([
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'email' => $email,
            'sent_at' => null,
        ]);

        return response()->json([
            'status' => 'ok',
            'message' => 'Talebiniz alındı. Ürün tekrar stok açıldığında size haber vereceğiz.',
        ]);
    }
}
