<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductAttributeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:products.edit|products.create')->only(['sync']);
    }

    public function sync(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'attributes' => ['nullable', 'array'],
            'attributes.*.attribute_id' => ['required', 'integer', 'exists:attributes,id'],
            'attributes.*.value_ids' => ['nullable', 'array'],
            'attributes.*.value_ids.*' => ['integer', 'exists:attribute_values,id'],
        ]);

        $payload = $data['attributes'] ?? [];

        return DB::transaction(function () use ($product, $payload) {
            // Clear existing mappings
            $existing = $product->attributes()->get();
            foreach ($existing as $pa) {
                $pa->values()->delete();
            }
            $product->attributes()->delete();

            foreach ($payload as $row) {
                $attributeId = (int) ($row['attribute_id'] ?? 0);
                if ($attributeId <= 0) {
                    continue;
                }

                $attr = Attribute::query()->with('values')->find($attributeId);
                if (!$attr) {
                    continue;
                }

                $valueIds = array_values(array_unique(array_map('intval', $row['value_ids'] ?? [])));
                if (empty($valueIds)) {
                    continue;
                }

                // Ensure values belong to the attribute
                $valid = AttributeValue::query()
                    ->where('attribute_id', $attributeId)
                    ->whereIn('id', $valueIds)
                    ->pluck('id')
                    ->all();

                if (empty($valid)) {
                    continue;
                }

                $productAttr = ProductAttribute::create([
                    'product_id' => $product->id,
                    'attribute_id' => $attributeId,
                ]);

                foreach ($valid as $vid) {
                    ProductAttributeValue::create([
                        'product_attribute_id' => $productAttr->id,
                        'attribute_value_id' => (int) $vid,
                    ]);
                }
            }

            $fresh = $product->fresh(['attributes']);

            return response()->json([
                'product' => $fresh,
                'attributes' => $fresh->attributes,
            ]);
        });
    }
}
