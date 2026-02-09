<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SkuGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SkuGeneratorController extends Controller
{
    public function __construct(
        private readonly SkuGeneratorService $skuGenerator
    ) {
    }

    public function generate(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->can('products.create') && !$user->can('products.edit'))) {
            return response()->json([
                'message' => 'Bu işlem için yetkiniz bulunmuyor.',
            ], 403);
        }

        $data = $request->validate([
            'type' => ['required', Rule::in(['product', 'variant'])],
            'name' => ['nullable', 'string', 'max:255'],
            'product_name' => ['nullable', 'string', 'max:255'],
            'product_sku' => ['nullable', 'string', 'max:255'],
            'variant_name' => ['nullable', 'string', 'max:255'],
            'values' => ['nullable', 'array'],
            'values.*' => ['nullable', 'string', 'max:255'],
            'exclude_product_id' => ['nullable', 'integer', 'min:1'],
            'exclude_variant_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $excludeProductId = isset($data['exclude_product_id']) ? (int) $data['exclude_product_id'] : null;
        $excludeVariantId = isset($data['exclude_variant_id']) ? (int) $data['exclude_variant_id'] : null;

        if ($data['type'] === 'product') {
            $name = $data['name'] ?? ($data['product_name'] ?? null);

            return response()->json([
                'sku' => $this->skuGenerator->generateProductSku($name, $excludeProductId, $excludeVariantId),
            ]);
        }

        $values = array_values(array_filter(
            array_map(
                static fn ($value) => is_scalar($value) ? trim((string) $value) : '',
                $data['values'] ?? []
            ),
            static fn ($value) => $value !== ''
        ));

        $result = $this->skuGenerator->generateVariantSku(
            $data['product_sku'] ?? null,
            $data['product_name'] ?? ($data['name'] ?? null),
            $data['variant_name'] ?? null,
            $values,
            $excludeProductId,
            $excludeVariantId
        );

        return response()->json($result);
    }

    /**
     * Return all SKU generator settings.
     */
    public function settings(): JsonResponse
    {
        return response()->json($this->skuGenerator->getSettings());
    }

    /**
     * Update SKU generator settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->can('settings.edit')) {
            return response()->json(['message' => 'Bu işlem için yetkiniz bulunmuyor.'], 403);
        }

        $allowedKeys = array_keys(SkuGeneratorService::settingsDefaults());

        $data = $request->validate([
            'sku_format'                    => ['nullable', 'string', Rule::in(['digits', 'digits_letters', 'custom'])],
            'sku_digits_min_length'         => ['nullable'],
            'sku_digits_prefix'             => ['nullable', 'string', 'max:20'],
            'sku_digits_letters_min_length' => ['nullable'],
            'sku_digits_letters_prefix'     => ['nullable', 'string', 'max:20'],
            'sku_digits_letters_uppercase'  => ['nullable'],
            'sku_custom_template'           => ['nullable', 'string', 'max:255'],
            'sku_product_separator'          => ['nullable', 'string', 'max:5'],
            'sku_variant_format'            => ['nullable', 'string', Rule::in(['', 'regular', 'product'])],
            'sku_variant_suffix'            => ['nullable', 'string', Rule::in(['', 'name', 'name_num'])],
            'sku_variant_separator'         => ['nullable', 'string', 'max:5'],
            'sku_auto_generate'             => ['nullable'],
            'sku_auto_regenerate'           => ['nullable'],

            // Order reference settings
            'order_ref_prefix'              => ['nullable', 'string', 'max:20'],
            'order_ref_year'                => ['nullable'],
            'order_ref_min_digits'          => ['nullable'],
            'order_ref_format'              => ['nullable', 'string', Rule::in(['sequential', 'random_digits', 'random_alphanumeric'])],
            'order_ref_separator'           => ['nullable', 'string', 'max:5'],
        ]);

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedKeys, true)) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => (string) ($value ?? '')]
                );
            }
        }

        return response()->json([
            'message' => 'SKU ayarları kaydedildi.',
            'settings' => $this->skuGenerator->getSettings(),
        ]);
    }

    /**
     * Generate a preview based on provided or saved settings.
     */
    public function preview(Request $request): JsonResponse
    {
        $name = $request->input('name', 'Pamuk Kumaş');

        $allowedKeys = array_keys(SkuGeneratorService::settingsDefaults());
        $override = collect($request->only($allowedKeys))
            ->filter(fn ($v) => $v !== null)
            ->map(fn ($v) => (string) $v)
            ->toArray();

        $settings = !empty($override) ? $override : null;

        $preview = $this->skuGenerator->preview($name, $settings);
        $preview['order_number'] = $this->skuGenerator->previewOrderNumber($settings);

        return response()->json($preview);
    }
}
