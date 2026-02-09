<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Unit;
use App\Models\Variation;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $hasActiveVariants = $this->hasActiveVariants();
        
        return array_merge(
            $this->getProductRules($hasActiveVariants),
            $this->getVariantRules()
        );
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();
        $normalize = function ($value) {
            if (is_string($value)) {
                return str_replace(',', '.', $value);
            }
            return $value;
        };

        foreach (['price', 'discount_price', 'qty'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $normalize($data[$field]);
            }
        }

        if (isset($data['variants']) && is_array($data['variants'])) {
            foreach ($data['variants'] as $index => $variant) {
                foreach (['price', 'discount_price', 'qty'] as $field) {
                    if (array_key_exists($field, $variant)) {
                        $data['variants'][$index][$field] = $normalize($variant[$field]);
                    }
                }
            }

            $data['has_active_variants'] = collect($data['variants'])
                ->filter(function ($variant) {
                    return isset($variant['is_active']) && (string) $variant['is_active'] !== '0' && $variant['is_active'] !== false;
                })
                ->isNotEmpty() ? 1 : 0;

            if (($data['has_active_variants'] ?? 0) === 1) {
                if (!array_key_exists('qty', $data) || $data['qty'] === null || $data['qty'] === '') {
                    unset($data['qty']);
                }
            }
        }

        $this->merge($data);
    }

    protected function getProductRules(bool $hasActiveVariants): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255'],
            'gtin' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'google_product_category_id' => ['nullable', 'integer', 'exists:google_product_categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'tax_class_id' => ['nullable', 'integer', 'exists:tax_classes,id'],
            'price' => $hasActiveVariants ? ['nullable', 'numeric', 'min:0'] : ['required', 'numeric', 'min:0'],
            'discount_price' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) {
                    $price = $this->input('price');
                    if ($value !== null && $value !== '' && is_numeric($price) && is_numeric($value) && (float) $value > (float) $price) {
                        $fail('Discount price cannot be greater than regular price.');
                    }
                },
            ],
            'discount_start' => ['nullable', 'date'],
            'discount_end' => ['nullable', 'date', 'after_or_equal:discount_start'],
            'status' => ['sometimes', 'required', 'in:draft,published'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'show_unit_pricing' => ['nullable', 'boolean'],
            'sale_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'unit_type' => ['nullable', 'in:global,custom'],
            'custom_unit' => ['nullable', 'array'],
            'custom_unit.label' => ['nullable', 'string', 'max:255'],
            'custom_unit.min' => ['nullable', 'numeric', 'min:0'],
            'custom_unit.max' => ['nullable', 'numeric', 'min:0'],
            'custom_unit.step' => ['nullable', 'numeric', 'gt:0'],
            'custom_unit.default_qty' => ['nullable', 'numeric', 'min:0'],
            'custom_unit.info_top' => ['nullable', 'string'],
            'custom_unit.info_bottom' => ['nullable', 'string'],
            'custom_unit.quantity_prefix' => ['nullable', 'string', 'max:255'],
            'custom_unit.price_prefix' => ['nullable', 'string', 'max:255'],
            'custom_unit.stock_prefix' => ['nullable', 'string', 'max:255'],
            'custom_unit.is_decimal_stock' => ['nullable', 'boolean'],
            'list_variants_separately' => ['nullable', 'boolean'],
            'allow_backorder' => ['nullable', 'boolean'],
            'qty' => $this->getQtyRules($hasActiveVariants),
            'in_stock' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['nullable'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'exists:categories,id'],
            'primary_category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'variations' => ['nullable', 'array'],
            'variations.*.id' => ['nullable'],
            'variations.*.name' => ['nullable', 'string', 'max:255'],
            'variations.*.type' => ['nullable', Rule::in(Variation::TYPES)],
            'variations.*.is_global' => ['nullable', 'boolean'],
            'variations.*.global_id' => ['nullable'],
            'variations.*.values' => ['nullable', 'array'],
            'variations.*.values.*.id' => ['nullable'],
            'variations.*.values.*.label' => ['nullable', 'string', 'max:255'],
            'variations.*.values.*.value' => ['nullable'],
            'variations.*.values.*.color' => ['nullable', 'string', 'max:50'],
            'variations.*.values.*.image' => ['nullable'],
            'variations.*.values.*.position' => ['nullable', 'integer'],
            'media_ids' => ['nullable', 'array'],
            'media_ids.*' => ['integer', 'exists:media,id'],
            'is_active' => ['nullable', 'boolean'],
            'redirect_type' => ['nullable', 'string', 'in:404,410,301-category,302-category,301-product,302-product'],
            'redirect_target_id' => ['nullable', 'integer'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['nullable'],
            'options.*.name' => ['nullable', 'string', 'max:255'],
            'options.*.type' => ['nullable', 'string', 'max:50'],
            'options.*.is_required' => ['nullable', 'boolean'],
            'options.*.position' => ['nullable', 'integer'],
            'options.*.values' => ['nullable', 'array'],
            'options.*.values.*.id' => ['nullable'],
            'options.*.values.*.label' => ['nullable', 'string', 'max:255'],
            'options.*.values.*.price' => ['nullable', 'numeric'],
            'options.*.values.*.price_type' => ['nullable', 'in:fixed,percent'],
            'options.*.values.*.position' => ['nullable', 'integer'],
        ];
    }

    protected function getVariantRules(): array
    {
        $isDecimal = $this->allowsDecimalQty();
        $qtyPattern = $isDecimal ? '/^\d+(\.\d{1,2})?$/' : '/^\d+$/';

        return [
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.name' => ['nullable', 'string'],
            'variants.*.sku' => ['nullable', 'string', 'max:255'],
            'variants.*.gtin' => ['nullable', 'string', 'max:255'],
            'variants.*.price' => [
                function ($attribute, $value, $fail) {
                    if (preg_match('/variants\.(\d+)\.price/', $attribute, $matches)) {
                        $index = $matches[1];
                        $variants = $this->input('variants', []);
                        $variant = $variants[$index] ?? null;
                        
                        if ($variant && ($variant['is_active'] ?? false)) {
                            if ($value === null || $value === '') {
                                $fail('Price is required for active variants.');
                            }
                        }
                    }
                },
                'nullable',
                'numeric',
                'min:0',
            ],
            'variants.*.discount_price' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) {
                    if ($value === null || $value === '') return;
                    
                    if (preg_match('/variants\.(\d+)\.discount_price/', $attribute, $matches)) {
                        $index = $matches[1];
                        $variants = $this->input('variants', []);
                        $price = $variants[$index]['price'] ?? null;
                        
                        if (is_numeric($price) && is_numeric($value) && (float) $value > (float) $price) {
                            $fail('Discount price cannot be greater than regular price.');
                        }
                    }
                },
            ],
            'variants.*.discount_start' => ['nullable', 'date'],
            'variants.*.discount_end' => ['nullable', 'date', 'after_or_equal:variants.*.discount_start'],
            'variants.*.allow_backorder' => ['nullable', 'boolean'],
            'variants.*.qty' => [
                function ($attribute, $value, $fail) use ($qtyPattern) {
                    if (preg_match('/variants\.(\d+)\.qty/', $attribute, $matches)) {
                        $index = $matches[1];
                        $variants = $this->input('variants', []);
                        $variant = $variants[$index] ?? null;
                        
                        if ($variant && ($variant['is_active'] ?? false)) {
                            if ($value === null || $value === '') {
                                $fail('Quantity is required for active variants.');
                                return;
                            }
                            
                            if (!preg_match($qtyPattern, (string) $value)) {
                                $fail('Invalid quantity format.');
                            }
                        }
                    }
                },
                'nullable',
                'numeric',
                'min:0',
            ],
            'variants.*.in_stock' => ['nullable', 'boolean'],
            'variants.*.is_active' => ['nullable', 'boolean'],
            'variants.*.is_default' => ['nullable', 'boolean'],
            'variants.*.uids' => ['nullable', 'string'],
            'variants.*.values' => ['nullable'],
            'variants.*.values.*.id' => ['nullable'],
            'variants.*.values.*.label' => ['nullable', 'string'],
            'variants.*.values.*.variationId' => ['nullable'],
            'variants.*.values.*.valueId' => ['nullable'],
            'variants.*.values.*.color' => ['nullable', 'string'],
            'variants.*.values.*.image' => ['nullable', 'string'],
            'variants.*.values.*.position' => ['nullable', 'integer'],
            'variants.*.media_ids' => ['nullable', 'array'],
            'variants.*.media_ids.*' => ['integer', 'exists:media,id'],
        ];
    }

    protected function getQtyRules(bool $hasActiveVariants): array
    {
        if ($hasActiveVariants) {
            return ['nullable', 'numeric', 'min:0'];
        }

        $isDecimal = $this->allowsDecimalQty();
        $qtyPattern = $isDecimal ? '/^\d+(\.\d{1,2})?$/' : '/^\d+$/';

        return [
            function ($attribute, $value, $fail) use ($qtyPattern) {
                if ($value === null || $value === '') {
                    $fail('Quantity is required.');
                    return;
                }

                if (!preg_match($qtyPattern, (string) $value)) {
                    $fail('Invalid quantity format.');
                }
            },
            'required',
            'numeric',
            'min:0',
        ];
    }

    protected function hasActiveVariants(): bool
    {
        $variants = $this->input('variants', []);
        
        foreach ($variants as $variant) {
            if (isset($variant['is_active']) && $variant['is_active']) {
                return true;
            }
        }
        
        return false;
    }

    protected function allowsDecimalQty(): bool
    {
        $unitType = $this->input('unit_type');
        
        // Custom unit: check step value
        if ($unitType === 'custom') {
            $step = $this->input('custom_unit.step');
            if ($step !== null && is_numeric($step)) {
                return fmod((float) $step, 1.0) !== 0.0;
            }
            return false;
        }
        
        // Global unit: check sale_unit_id
        $unitId = $this->input('sale_unit_id');
        if (!$unitId) {
            return false;
        }
        
        $unit = Unit::query()->select(['id', 'is_decimal_stock'])->find($unitId);
        return (bool) optional($unit)->is_decimal_stock;
    }
}
