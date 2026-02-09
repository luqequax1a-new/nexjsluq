<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Tag;
use App\Models\Media;
use App\Models\Variation;
use App\Models\VariationValue;
use App\Models\Option;
use App\Models\UrlRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;

class ProductController extends Controller
{
    use AuthorizesRequests;

    private function variantDebugEnabled(): bool
    {
        return (bool) env('VARIANT_DEBUG', false);
    }

    private function summarizeVariantPayload($variants): array
    {
        $list = is_array($variants) ? $variants : [];
        $emptyLabelCount = 0;
        $totalValueCount = 0;
        $samples = [];
        foreach (array_slice($list, 0, 5) as $v) {
            $vals = (isset($v['values']) && is_array($v['values'])) ? $v['values'] : [];
            $samples[] = [
                'uids' => $v['uids'] ?? null,
                'name' => $v['name'] ?? null,
                'values' => array_map(function ($x) {
                    return [
                        'valueId' => $x['valueId'] ?? ($x['id'] ?? null),
                        'label' => $x['label'] ?? null,
                    ];
                }, array_slice($vals, 0, 4)),
            ];
        }

        foreach ($list as $v) {
            $vals = (isset($v['values']) && is_array($v['values'])) ? $v['values'] : [];
            foreach ($vals as $x) {
                $totalValueCount++;
                $lbl = trim((string) ($x['label'] ?? ($x['name'] ?? ($x['value'] ?? ''))));
                if ($lbl === '') $emptyLabelCount++;
            }
        }

        return [
            'count' => count($list),
            'totalValueCount' => $totalValueCount,
            'emptyLabelCount' => $emptyLabelCount,
            'samples' => $samples,
        ];
    }

    private function summarizeVariationPayload($variations): array
    {
        $list = is_array($variations) ? $variations : [];

        $count = count($list);
        $emptyNameCount = 0;
        $emptyTypeCount = 0;
        $totalValues = 0;
        $emptyValueLabelCount = 0;
        $samples = [];

        foreach (array_slice($list, 0, 5) as $v) {
            $vals = (isset($v['values']) && is_array($v['values'])) ? $v['values'] : [];
            $samples[] = [
                'id' => $v['id'] ?? null,
                'name' => $v['name'] ?? null,
                'type' => $v['type'] ?? null,
                'is_global' => $v['is_global'] ?? null,
                'global_id' => $v['global_id'] ?? null,
                'values' => array_map(function ($x) {
                    return [
                        'id' => $x['id'] ?? ($x['valueId'] ?? null),
                        'label' => $x['label'] ?? null,
                        'hasColor' => array_key_exists('color', (array) $x) ? !empty($x['color']) : null,
                        'hasImage' => array_key_exists('image', (array) $x) ? !empty($x['image']) : null,
                    ];
                }, array_slice($vals, 0, 4)),
            ];
        }

        foreach ($list as $v) {
            $nm = trim((string) ($v['name'] ?? ''));
            $tp = trim((string) ($v['type'] ?? ''));
            if ($nm === '') $emptyNameCount++;
            if ($tp === '') $emptyTypeCount++;

            $vals = (isset($v['values']) && is_array($v['values'])) ? $v['values'] : [];
            foreach ($vals as $x) {
                $totalValues++;
                $lbl = trim((string) ($x['label'] ?? ''));
                if ($lbl === '') $emptyValueLabelCount++;
            }
        }

        return [
            'count' => $count,
            'emptyNameCount' => $emptyNameCount,
            'emptyTypeCount' => $emptyTypeCount,
            'totalValues' => $totalValues,
            'emptyValueLabelCount' => $emptyValueLabelCount,
            'samples' => $samples,
        ];
    }

    private function deriveBaseFromVariants(array $variants): array
    {
        $active = array_values(array_filter($variants, function ($v) {
            return isset($v['is_active']) && (string) $v['is_active'] !== '0' && $v['is_active'] !== false;
        }));

        if (count($active) === 0) {
            return [];
        }

        $default = null;
        foreach ($active as $v) {
            if (!empty($v['is_default'])) {
                $default = $v;
                break;
            }
        }
        $default = $default ?? $active[0];

        $price = isset($default['price']) ? (float) $default['price'] : 0;
        // Support both discount_price (old) and special_price (FleetCart)
        $specialPrice = $default['special_price'] ?? $default['discount_price'] ?? null;
        $discount = ($specialPrice !== null && $specialPrice !== '') ? (float) $specialPrice : null;

        $totalQty = 0;
        $hasBackorder = false;
        $inStock = false;
        foreach ($active as $v) {
            $qty = isset($v['qty']) ? (float) $v['qty'] : 0;
            $allowBackorder = isset($v['allow_backorder']) ? (bool) $v['allow_backorder'] : false;
            $totalQty += $qty;
            if ($allowBackorder) {
                $hasBackorder = true;
            }
            if ($qty > 0 || $allowBackorder) {
                $inStock = true;
            }
        }

        return [
            'price' => $price,
            'special_price' => $discount,
            'special_price_type' => $default['special_price_type'] ?? null,
            'special_price_start' => $default['special_price_start'] ?? ($default['discount_start'] ?? null),
            'special_price_end' => $default['special_price_end'] ?? ($default['discount_end'] ?? null),
            'selling_price' => $discount !== null ? $discount : $price,
            'qty' => $totalQty,
            'allow_backorder' => $hasBackorder ? 1 : 0,
            'in_stock' => $inStock ? 1 : 0,
        ];
    }

    /**
     * Normalize variant `uids` tokens.
     * Supports both numeric variation_value IDs and string UIDs.
     */
    private function normalizeVariantUids(?string $rawUids, array $valueMapping = []): string
    {
        if ($rawUids === null) {
            return '';
        }

        $tokens = array_values(array_filter(array_map(
            static fn($token) => trim((string) $token),
            explode('.', (string) $rawUids)
        ), static fn($token) => $token !== ''));

        if (empty($tokens)) {
            return '';
        }

        $mapped = array_map(static function ($token) use ($valueMapping) {
            return array_key_exists($token, $valueMapping)
                ? (string) $valueMapping[$token]
                : (string) $token;
        }, $tokens);

        $mapped = array_values(array_unique($mapped));
        sort($mapped, SORT_NATURAL | SORT_FLAG_CASE);

        return implode('.', $mapped);
    }

    /**
     * Build normalized uids string from variation value tokens.
     */
    private function buildVariantUids(array $valueUids): string
    {
        return $this->normalizeVariantUids(implode('.', $valueUids));
    }

    /**
     * Generate variant name from variation labels.
     */
    private function generateVariantName(array $valueUids): string
    {
        $normalizedUids = $this->buildVariantUids($valueUids);
        if ($normalizedUids === '') {
            return '';
        }

        $tokens = explode('.', $normalizedUids);
        $numericIds = array_values(array_map(
            static fn($token) => (int) $token,
            array_filter($tokens, static fn($token) => ctype_digit($token))
        ));
        $uidTokens = array_values(array_filter($tokens, static fn($token) => !ctype_digit($token)));

        $values = VariationValue::query()
            ->with('variation')
            ->where(function ($q) use ($numericIds, $uidTokens) {
                if (!empty($numericIds)) {
                    $q->whereIn('id', $numericIds);
                }
                if (!empty($uidTokens)) {
                    if (!empty($numericIds)) {
                        $q->orWhereIn('uid', $uidTokens);
                    } else {
                        $q->whereIn('uid', $uidTokens);
                    }
                }
            })
            ->get();

        $byId = $values->keyBy(fn($value) => (string) $value->id);
        $byUid = $values->keyBy(fn($value) => (string) $value->uid);
        $labels = [];
        foreach ($tokens as $token) {
            $value = ctype_digit($token)
                ? $byId->get((string) (int) $token)
                : $byUid->get($token);

            if (!$value || empty($value->label) || in_array($value->label, $labels, true)) {
                continue;
            }

            $labels[] = $value->label;
        }

        return implode(' / ', $labels);
    }

    private function syncProductOptions(Product $product, $optionsPayload): void
    {
        $payload = is_array($optionsPayload) ? $optionsPayload : [];

        $existingIds = $product->options()->pluck('id')->toArray();
        $keptIds = [];

        foreach ($payload as $index => $optData) {
            if (!is_array($optData)) continue;

            $optId = $optData['id'] ?? null;
            $name = $optData['name'] ?? null;
            $type = $optData['type'] ?? null;
            $isRequired = isset($optData['is_required'])
                ? filter_var($optData['is_required'], FILTER_VALIDATE_BOOLEAN)
                : false;

            $option = null;
            if ($optId !== null && is_numeric($optId) && in_array((int) $optId, array_map('intval', $existingIds), true)) {
                $option = Option::query()->find((int) $optId);
                if ($option) {
                    $option->update([
                        'name' => $name,
                        'type' => $type,
                        'is_required' => $isRequired,
                        'position' => $index,
                    ]);
                }
            }

            if (!$option) {
                $option = Option::create([
                    'product_id' => $product->id,
                    'name' => $name,
                    'type' => $type,
                    'is_required' => $isRequired,
                    'is_global' => false,
                    'position' => $index,
                ]);
            }

            $keptIds[] = $option->id;

            $option->values()->delete();
            $vals = (isset($optData['values']) && is_array($optData['values'])) ? $optData['values'] : [];
            foreach ($vals as $vIndex => $valData) {
                if (!is_array($valData)) continue;
                $option->values()->create([
                    'label' => $valData['label'] ?? null,
                    'price' => $valData['price'] ?? 0,
                    'price_type' => $valData['price_type'] ?? 'fixed',
                    'position' => $valData['position'] ?? $vIndex,
                ]);
            }
        }

        $product->options()->whereNotIn('id', $keptIds)->delete();
    }

    public function __construct()
    {
        $this->authorizeResource(Product::class, 'product');
        $this->middleware('permission:products.create')->only(['duplicate']);
        $this->middleware('permission:products.edit')->only(['getInventory', 'updateInventory', 'getPricing', 'updatePricing', 'bulkUpdate']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['media', 'variants.media', 'variants', 'variations.values.imageMedia', 'brand', 'categories', 'saleUnit', 'productUnit']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%");
            });
        }

        $products = $query->orderByDesc('id')
            ->paginate($request->input('per_page', 20));

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load([
            'googleProductCategory',
            'media',
            'variants.media',
            'variants',
            'variations.values.imageMedia',
            'tags',
            'saleUnit',
            'productUnit',
            'brand',
            'categories',
            'options.values',
            'attributes.values',
        ]);

        $payload = $product->toArray();
        $payload['unit'] = $this->resolveUnitPayload($product);

        if ($product->productUnit) {
            $payload['custom_unit'] = $product->productUnit->toArray();
        }

        return response()->json(['product' => $payload]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            if ($this->variantDebugEnabled()) {
                logger()->info('[ProductController@store] incoming variants summary', $this->summarizeVariantPayload($data['variants'] ?? []));
                logger()->info('[ProductController@store] incoming variations summary', $this->summarizeVariationPayload($data['variations'] ?? []));
            }
            $showUnitPricing = (bool) ($data['show_unit_pricing'] ?? false);
            $unitType = $data['unit_type'] ?? null;

            $base = collect($data)->except(['variations', 'variants', 'tags', 'custom_unit', 'unit_type', 'media_ids', 'is_active'])->toArray();
            $base['is_active'] = $data['is_active'] ?? true;

            // Ensure selling_price is set appropriately (variants override base values)
            $variantBase = isset($data['variants']) ? $this->deriveBaseFromVariants($data['variants']) : [];
            if (!empty($variantBase)) {
                $base = array_merge($base, $variantBase);
            } else {
                $price = $base['price'] ?? 0;
                if (array_key_exists('discount_price', $base) && $base['discount_price'] !== null) {
                    $base['selling_price'] = $base['discount_price'];
                } else {
                    $base['selling_price'] = $price;
                }
            }
            if (array_key_exists('discount_price', $base)) {
                unset($base['discount_price']);
            }

            if (!$showUnitPricing) {
                $base['unit_type'] = null;
                $base['sale_unit_id'] = null;
                $base['product_unit_id'] = null;
            }

            // default behavior: treat provided sale_unit_id as global
            if ($unitType === 'custom') {
                $base['sale_unit_id'] = null;
                $base['unit_type'] = 'custom';
            } elseif (filled($base['sale_unit_id'] ?? null)) {
                $base['unit_type'] = 'global';
            } else {
                $base['unit_type'] = $unitType; // could be null
            }

            if (array_key_exists('qty', $base) && $base['qty'] !== null) {
                $allowBackorder = (bool) ($base['allow_backorder'] ?? false);
                $base['in_stock'] = (float) $base['qty'] > 0 || $allowBackorder;
            }

            $product = Product::create($base);

            if (!empty($data['media_ids']) && is_array($data['media_ids'])) {
                $ids = array_values(array_unique(array_map('intval', $data['media_ids'])));

                $items = Media::query()
                    ->whereIn('id', $ids)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($ids as $pos => $mid) {
                    $m = $items->get($mid);
                    if (!$m) continue;

                    // Only allow attaching orphan/global media
                    if (($m->scope ?? null) !== 'global') continue;
                    if ($m->product_id !== null || $m->product_variant_id !== null) continue;

                    $m->update([
                        'scope' => 'product',
                        'product_id' => $product->id,
                        'position' => $pos,
                    ]);
                }
            }

            if ($showUnitPricing && ($data['unit_type'] ?? null) === 'custom') {
                $cu = $data['custom_unit'] ?? [];

                if (array_key_exists('max', $cu) && $cu['max'] !== null) {
                    $min = (float) ($cu['min'] ?? 0);
                    if ((float) $cu['max'] < $min) {
                        return response()->json(['message' => 'custom_unit.max must be greater than or equal to custom_unit.min'], 422);
                    }
                }

                $productUnit = ProductUnit::create([
                    'product_id' => $product->id,
                    'label' => $cu['label'] ?? null,
                    'quantity_prefix' => $cu['quantity_prefix'] ?? null,
                    'min' => $cu['min'] ?? 0,
                    'max' => $cu['max'] ?? null,
                    'step' => $cu['step'] ?? 1,
                    'default_qty' => $cu['default_qty'] ?? null,
                    'info_top' => $cu['info_top'] ?? null,
                    'info_bottom' => $cu['info_bottom'] ?? null,
                    'price_prefix' => $cu['price_prefix'] ?? null,
                    'stock_prefix' => $cu['stock_prefix'] ?? null,
                    'is_decimal_stock' => isset($cu['is_decimal_stock'])
                        ? (bool) $cu['is_decimal_stock']
                        : null,
                ]);

                $product->update([
                    'product_unit_id' => $productUnit->id,
                    'unit_type' => 'custom',
                    'sale_unit_id' => null,
                ]);
            } else {
                $product->update([
                    'product_unit_id' => null,
                ]);
            }

            // --- Handle Main Product Media ---
            if (!empty($data['media_ids'])) {
                $mediaIds = array_values(array_unique(array_map('intval', $data['media_ids'])));
                $items = Media::query()
                    ->whereIn('id', $mediaIds)
                    ->where('scope', 'global')
                    ->whereNull('product_id')
                    ->whereNull('product_variant_id')
                    ->get()
                    ->keyBy('id');

                foreach ($mediaIds as $pos => $mid) {
                    $m = $items->get($mid);
                    if ($m) {
                        $m->update([
                            'scope' => 'product',
                            'product_id' => $product->id,
                            'position' => $pos,
                        ]);
                    }
                }
            }

            if (isset($data['tags'])) {
                $tagIds = $this->resolveTagIds($data['tags']);
                $product->tags()->sync($tagIds);
            }

            if (isset($data['categories'])) {
                $primaryCategoryId = $data['primary_category_id'] ?? null;
                $syncData = [];
                
                foreach ($data['categories'] as $position => $categoryId) {
                    $syncData[$categoryId] = [
                        'is_primary' => $categoryId == $primaryCategoryId,
                        'position' => $position,
                    ];
                }
                
                $product->categories()->sync($syncData);
            }

            if (array_key_exists('options', $data)) {
                $this->syncProductOptions($product, $data['options']);
            }

            $valueMapping = []; // Maps temp value IDs to real value IDs

            if (!empty($data['variations'])) {
                foreach ($data['variations'] as $variationData) {
                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@store] variation loop begin', [
                            'id' => $variationData['id'] ?? null,
                            'name' => $variationData['name'] ?? null,
                            'type' => $variationData['type'] ?? null,
                            'is_global' => $variationData['is_global'] ?? null,
                            'global_id' => $variationData['global_id'] ?? null,
                            'valuesCount' => isset($variationData['values']) && is_array($variationData['values']) ? count($variationData['values']) : 0,
                        ]);
                    }
                    if (isset($variationData['id']) && !str_starts_with($variationData['id'], 'temp')) {
                        // Global variation (optionally with a subset of values)
                        $selectedValues = (isset($variationData['values']) && is_array($variationData['values']))
                            ? $variationData['values']
                            : [];

                        $globalVar = Variation::query()
                            ->with('values')
                            ->find($variationData['id']);

                        $isSubset = $globalVar
                            && !empty($selectedValues)
                            && $globalVar->values->count() > 0
                            && count($selectedValues) < $globalVar->values->count();

                        if ($isSubset) {
                            $variation = Variation::create([
                                'name' => $globalVar->name,
                                'type' => $globalVar->type,
                                'is_global' => false,
                            ]);
                            $product->variations()->attach($variation->id);

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@store] global subset => created local variation', [
                                    'global_id' => $variationData['id'] ?? null,
                                    'new_local_variation_id' => $variation->id,
                                    'name' => $variation->name,
                                    'type' => $variation->type,
                                    'selectedValuesCount' => count($selectedValues),
                                ]);
                            }

                            foreach ($selectedValues as $valData) {
                                $img = $valData['image'] ?? null;
                                if (is_array($img)) {
                                    $img = $img['path'] ?? ($img['url'] ?? null);
                                }

                                $newValue = $variation->values()->create([
                                    'label' => $valData['label'] ?? null,
                                    'value' => $valData['value'] ?? null,
                                    'color' => $valData['color'] ?? null,
                                    'image' => $img,
                                    'position' => $valData['position'] ?? null,
                                ]);

                                if (isset($valData['id'])) {
                                    $valueMapping[$valData['id']] = $newValue->id;
                                }

                                if ($this->variantDebugEnabled()) {
                                    logger()->info('[ProductController@store] global subset => created value', [
                                        'old_id' => $valData['id'] ?? null,
                                        'new_id' => $newValue->id,
                                        'label' => $newValue->label,
                                        'variation_id' => $variation->id,
                                    ]);
                                }
                            }
                        } else {
                            $product->variations()->attach($variationData['id']);

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@store] attached global variation', [
                                    'variation_id' => $variationData['id'] ?? null,
                                ]);
                            }
                        }
                    } else {
                        // New variation
                        $variationName = $variationData['name'] ?? ($variationData['label'] ?? ($variationData['title'] ?? null));
                        $variationType = $variationData['type'] ?? 'text';
                        $variation = Variation::create([
                            'name' => $variationName,
                            'type' => $variationType,
                            'is_global' => false,
                        ]);
                        $product->variations()->attach($variation->id);

                        if ($this->variantDebugEnabled()) {
                            logger()->info('[ProductController@store] created local variation', [
                                'new_local_variation_id' => $variation->id,
                                'name' => $variation->name,
                                'type' => $variation->type,
                            ]);
                        }

                        foreach ($variationData['values'] as $valData) {
                            $img = $valData['image'] ?? null;
                            if (is_array($img)) {
                                $img = $img['path'] ?? ($img['url'] ?? null);
                            }
                            $newValue = $variation->values()->create([
                                'label' => $valData['label'],
                                'value' => $valData['value'] ?? null,
                                'color' => $valData['color'] ?? null,
                                'image' => $img,
                                'position' => $valData['position'] ?? null,
                            ]);
                            if (isset($valData['id'])) {
                                $valueMapping[$valData['id']] = $newValue->id;
                            }

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@store] created local variation value', [
                                    'old_id' => $valData['id'] ?? null,
                                    'new_id' => $newValue->id,
                                    'label' => $newValue->label,
                                    'variation_id' => $variation->id,
                                ]);
                            }
                        }
                    }
                }
            }

            if (!empty($data['variants'])) {
                foreach ($data['variants'] as $variantData) {
                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@store] before remap variant', [
                            'uids' => $variantData['uids'] ?? null,
                            'payload' => $variantData,
                        ]);
                    }

                    // Support admin payload using discount_price naming
                    if (array_key_exists('discount_price', $variantData) && !array_key_exists('special_price', $variantData)) {
                        $variantData['special_price'] = $variantData['discount_price'];
                    }
                    if (array_key_exists('discount_start', $variantData) && !array_key_exists('special_price_start', $variantData)) {
                        $variantData['special_price_start'] = $variantData['discount_start'];
                    }
                    if (array_key_exists('discount_end', $variantData) && !array_key_exists('special_price_end', $variantData)) {
                        $variantData['special_price_end'] = $variantData['discount_end'];
                    }
                    unset($variantData['discount_price'], $variantData['discount_start'], $variantData['discount_end']);

                    // PostgreSQL: product_variants.qty is NOT NULL. Frontend may send null for new variants.
                    if (!array_key_exists('qty', $variantData) || $variantData['qty'] === null || $variantData['qty'] === '') {
                        $variantData['qty'] = 0;
                    }
                    $allowBackorder = (bool) ($variantData['allow_backorder'] ?? false);
                    $variantData['in_stock'] = (float) $variantData['qty'] > 0 || $allowBackorder;
                    $variantMediaIds = [];
                    if (!empty($variantData['media_ids']) && is_array($variantData['media_ids'])) {
                        $variantMediaIds = array_values(array_unique(array_map('intval', $variantData['media_ids'])));
                    }

                    unset($variantData['media_ids']);
                    unset($variantData['media']);

                    // Map temp uids to real uids
                    if (isset($variantData['uids'])) {
                        $variantData['uids'] = $this->normalizeVariantUids((string) $variantData['uids'], $valueMapping);
                        if ($variantData['uids'] === '') {
                            $variantData['uids'] = null;
                        }
                    }

                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@store] variant uids remap', [
                            'incoming_uids' => $variantData['uids'] ?? null,
                            'value_mapping_count' => count($valueMapping),
                        ]);
                    }

                    if (!empty($variantData['values']) && is_array($variantData['values'])) {
                        $idsToFetch = [];
                        foreach ($variantData['values'] as $i => $val) {
                            if (!is_array($val)) continue;
                            $vid = $val['valueId'] ?? $val['id'] ?? null;
                            if ($vid !== null && isset($valueMapping[$vid])) {
                                $mapped = $valueMapping[$vid];
                                $variantData['values'][$i]['valueId'] = $mapped;
                                $variantData['values'][$i]['id'] = $mapped;
                            }
                            $finalId = $variantData['values'][$i]['valueId'] ?? $variantData['values'][$i]['id'] ?? null;
                            if ($finalId !== null && ctype_digit((string) $finalId)) {
                                $idsToFetch[] = (int) $finalId;
                            }
                        }

                        $idsToFetch = array_values(array_unique($idsToFetch));
                        if (!empty($idsToFetch)) {
                            $vvMap = VariationValue::query()
                                ->whereIn('id', $idsToFetch)
                                ->get(['id', 'variation_id', 'label', 'value', 'color', 'image', 'position'])
                                ->keyBy('id');

                            foreach ($variantData['values'] as $i => $val) {
                                if (!is_array($val)) continue;
                                $finalId = $val['valueId'] ?? $val['id'] ?? null;
                                if ($finalId === null || !ctype_digit((string) $finalId)) continue;
                                $vv = $vvMap->get((int) $finalId);
                                if (!$vv) continue;
                                if (empty($variantData['values'][$i]['variationId'])) {
                                    $variantData['values'][$i]['variationId'] = $vv->variation_id;
                                }
                                if (empty($variantData['values'][$i]['label'])) {
                                    $variantData['values'][$i]['label'] = $vv->label ?? $vv->value;
                                }
                                if (empty($variantData['values'][$i]['color']) && !empty($vv->color)) {
                                    $variantData['values'][$i]['color'] = $vv->color;
                                }
                                if (empty($variantData['values'][$i]['image']) && !empty($vv->image)) {
                                    $variantData['values'][$i]['image'] = $vv->image;
                                }
                                if (!isset($variantData['values'][$i]['position'])) {
                                    $variantData['values'][$i]['position'] = $vv->position;
                                }
                            }
                        }
                    }

                    // Auto-generate name from values if not present
                    if (empty($variantData['name']) && !empty($variantData['values']) && is_array($variantData['values'])) {
                        $labels = array_filter(array_map(function($val) {
                            return $val['label'] ?? ($val['name'] ?? ($val['value'] ?? null));
                        }, $variantData['values']));
                        if (!empty($labels)) {
                            $variantData['name'] = implode(' / ', $labels);
                        }
                    }

                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@update] after remap variant', [
                            'uids' => $variantData['uids'] ?? null,
                            'values' => $variantData['values'] ?? null,
                            'name' => $variantData['name'] ?? null,
                        ]);
                    }

                    $variant = $product->variants()->create($variantData);

                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@store] created product variant', [
                            'id' => $variant->id,
                            'uids' => $variant->uids,
                            'name' => $variant->name,
                            'valuesCount' => is_array($variantData['values'] ?? null) ? count($variantData['values']) : null,
                        ]);
                    }

                    if (!empty($variantMediaIds)) {
                        \Log::info('[ProductController@store] variant media attach start', [
                            'variant_id' => $variant->id,
                            'variant_name' => $variant->name,
                            'media_ids' => $variantMediaIds,
                        ]);

                        $items = Media::query()
                            ->whereIn('id', $variantMediaIds)
                            ->lockForUpdate()
                            ->get()
                            ->keyBy('id');

                        foreach ($variantMediaIds as $pos => $mid) {
                            $m = $items->get($mid);
                            if (!$m) {
                                \Log::warning('[ProductController@store] media not found', ['id' => $mid]);
                                continue;
                            }

                            // Only allow attaching orphan/global media
                            if (($m->scope ?? null) !== 'global') {
                                \Log::warning('[ProductController@store] media not global', [
                                    'id' => $mid,
                                    'scope' => $m->scope,
                                ]);
                                continue;
                            }
                            if ($m->product_id !== null || $m->product_variant_id !== null) {
                                \Log::warning('[ProductController@store] media already attached', [
                                    'id' => $mid,
                                    'product_id' => $m->product_id,
                                    'product_variant_id' => $m->product_variant_id,
                                ]);
                                continue;
                            }

                            \Log::info('[ProductController@store] attaching media', [
                                'media_id' => $mid,
                                'variant_id' => $variant->id,
                                'position' => $pos,
                            ]);

                            $m->update([
                                'scope' => 'variant',
                                'product_variant_id' => $variant->id,
                                'position' => $pos,
                            ]);
                        }

                        \Log::info('[ProductController@store] variant media attach complete', [
                            'variant_id' => $variant->id,
                            'attached_count' => Media::where('product_variant_id', $variant->id)->count(),
                        ]);
                    }
                }
                
                // Ensure exactly one default variant
                try {
                    $defaultId = $product->variants()->where('is_active', true)->where('is_default', true)->orderBy('position')->value('id');
                    $defaultId = $defaultId ?: $product->variants()->where('is_active', true)->orderBy('position')->value('id');
                    if ($defaultId) {
                        $product->variants()->where('id', '!=', $defaultId)->update(['is_default' => false]);
                        $product->variants()->where('id', $defaultId)->update(['is_default' => true]);
                    }
                } catch (\Throwable $e) {
                    // Silent fail
                }
            }

            $product->load(['googleProductCategory', 'media', 'variants.media', 'variants', 'variations.values.imageMedia', 'tags', 'saleUnit', 'productUnit', 'brand', 'categories', 'options.values', 'attributes']);
            $payload = $product->toArray();
            $payload['unit'] = $this->resolveUnitPayload($product);

            if ($this->variantDebugEnabled()) {
                logger()->info('[ProductController@store] final payload variations snapshot', $this->summarizeVariationPayload($payload['variations'] ?? []));
            }

            return response()->json(['product' => $payload], 201);
        });
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $product) {
            if ($this->variantDebugEnabled()) {
                logger()->info('[ProductController@update] incoming variants summary', $this->summarizeVariantPayload($data['variants'] ?? []));
                logger()->info('[ProductController@update] incoming variations summary', $this->summarizeVariationPayload($data['variations'] ?? []));
            }
            $showUnitPricing = (bool) ($data['show_unit_pricing'] ?? $product->show_unit_pricing);
            $unitType = $data['unit_type'] ?? null;
            $base = collect($data)->except(['variations', 'variants', 'tags', 'custom_unit', 'unit_type', 'media_ids', 'is_active'])->toArray();

            if (isset($data['is_active'])) {
                $base['is_active'] = (bool) $data['is_active'];
            }

            if (array_key_exists('show_unit_pricing', $data) && !$showUnitPricing) {
                $base['unit_type'] = null;
                $base['sale_unit_id'] = null;
                $base['product_unit_id'] = null;
            }

            if ($unitType === 'custom') {
                $base['sale_unit_id'] = null;
                $base['unit_type'] = 'custom';
            } elseif (array_key_exists('sale_unit_id', $base) && filled($base['sale_unit_id'])) {
                $base['unit_type'] = 'global';
            } elseif ($unitType === 'global') {
                $base['unit_type'] = 'global';
            }

            if (array_key_exists('qty', $base) && $base['qty'] !== null) {
                $allowBackorder = (bool) ($base['allow_backorder'] ?? ($product->allow_backorder ?? false));
                $base['in_stock'] = (float) $base['qty'] > 0 || $allowBackorder;
            }

            $variantBase = isset($data['variants']) ? $this->deriveBaseFromVariants($data['variants']) : [];
            if (!empty($variantBase)) {
                $base = array_merge($base, $variantBase);
            } else {
                if (array_key_exists('discount_price', $base)) {
                    if ($base['discount_price'] !== null) {
                        $base['selling_price'] = $base['discount_price'];
                    } else {
                        $newPrice = $base['price'] ?? $product->price;
                        $base['selling_price'] = $newPrice;
                    }
                    unset($base['discount_price']);
                } elseif (array_key_exists('price', $base)) {
                    if ($product->selling_price == $product->price) {
                        $base['selling_price'] = $base['price'];
                    }
                }
            }
            if (array_key_exists('discount_price', $base)) {
                unset($base['discount_price']);
            }

            $oldSlug = $product->slug;
            $product->update($base);

            // Handle slug change redirect creation
            if (!empty($data['create_redirect_on_slug_change']) && !empty($data['slug']) && $oldSlug !== $data['slug']) {
                try {
                    $oldPath = '/urun/' . $oldSlug;
                    $newPath = '/urun/' . $data['slug'];
                    
                    UrlRedirect::createRedirect(
                        sourcePath: $oldPath,
                        targetUrl: $newPath,
                        statusCode: 301,
                        isAuto: true,
                        targetType: 'product',
                        targetId: $product->id
                    );
                } catch (\Throwable $e) {
                    // Silently fail - don't stop the update process
                    \Log::warning('Failed to create slug change redirect', [
                        'product_id' => $product->id,
                        'old_slug' => $oldSlug,
                        'new_slug' => $data['slug'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if (array_key_exists('options', $data)) {
                $this->syncProductOptions($product, $data['options']);
            }

            if (($data['unit_type'] ?? null) === 'custom') {
                $cu = $data['custom_unit'] ?? [];

                if (array_key_exists('max', $cu) && $cu['max'] !== null) {
                    $min = (float) ($cu['min'] ?? 0);
                    if ((float) $cu['max'] < $min) {
                        return response()->json(['message' => 'custom_unit.max must be greater than or equal to custom_unit.min'], 422);
                    }
                }

                $productUnit = $product->productUnit;
                if (!$productUnit) {
                    $productUnit = ProductUnit::create(['product_id' => $product->id]);
                }

                $productUnit->update([
                    'label' => $cu['label'] ?? $productUnit->label,
                    'quantity_prefix' => array_key_exists('quantity_prefix', $cu) ? ($cu['quantity_prefix'] ?? null) : $productUnit->quantity_prefix,
                    'min' => $cu['min'] ?? $productUnit->min ?? 0,
                    'max' => array_key_exists('max', $cu) ? ($cu['max'] ?? null) : $productUnit->max,
                    'step' => $cu['step'] ?? $productUnit->step ?? 1,
                    'default_qty' => array_key_exists('default_qty', $cu) ? ($cu['default_qty'] ?? null) : $productUnit->default_qty,
                    'info_top' => $cu['info_top'] ?? $productUnit->info_top,
                    'info_bottom' => $cu['info_bottom'] ?? $productUnit->info_bottom,
                    'price_prefix' => $cu['price_prefix'] ?? $productUnit->price_prefix,
                    'stock_prefix' => $cu['stock_prefix'] ?? $productUnit->stock_prefix,
                    'is_decimal_stock' => array_key_exists('is_decimal_stock', $cu)
                        ? (bool) ($cu['is_decimal_stock'] ?? false)
                        : $productUnit->is_decimal_stock,
                ]);

                $product->update([
                    'product_unit_id' => $productUnit->id,
                    'unit_type' => 'custom',
                    'sale_unit_id' => null,
                ]);
            } elseif ($showUnitPricing && $unitType === 'global') {
                $product->update([
                    'product_unit_id' => null,
                ]);
            } elseif (!$showUnitPricing) {
                $product->update([
                    'product_unit_id' => null,
                    'unit_type' => null,
                    'sale_unit_id' => null,
                ]);
            }

            if (array_key_exists('media_ids', $data)) {
                $ids = array_values(array_unique(array_map('intval', $data['media_ids'])));
                
                Media::query()
                    ->where('scope', 'product')
                    ->where('product_id', $product->id)
                    ->update([
                        'scope' => 'global',
                        'product_id' => null,
                        'position' => 0,
                    ]);

                if (!empty($ids)) {
                    $items = Media::query()
                        ->whereIn('id', $ids)
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');

                    foreach ($ids as $pos => $mid) {
                        $m = $items->get($mid);
                        if (!$m) continue;

                        $m->update([
                            'scope' => 'product',
                            'product_id' => $product->id,
                            'position' => $pos,
                        ]);
                    }
                }
            }

            if (array_key_exists('tags', $data)) {
                $tagIds = $this->resolveTagIds($data['tags'] ?? []);
                $product->tags()->sync($tagIds);
            }

            if (array_key_exists('categories', $data)) {
                $primaryCategoryId = $data['primary_category_id'] ?? null;
                $syncData = [];
                
                foreach (($data['categories'] ?? []) as $position => $categoryId) {
                    $syncData[$categoryId] = [
                        'is_primary' => $categoryId == $primaryCategoryId,
                        'position' => $position,
                    ];
                }
                
                $product->categories()->sync($syncData);
            }

            // Simplified for now: delete and recreate logic as starting point for solid updates
            if (isset($data['variations'])) {
                 $product->variations()->detach();
                 $valueMapping = [];
                 foreach ($data['variations'] as $variationData) {
                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@update] variation loop begin', [
                            'id' => $variationData['id'] ?? null,
                            'name' => $variationData['name'] ?? null,
                            'type' => $variationData['type'] ?? null,
                            'is_global' => $variationData['is_global'] ?? null,
                            'global_id' => $variationData['global_id'] ?? null,
                            'valuesCount' => isset($variationData['values']) && is_array($variationData['values']) ? count($variationData['values']) : 0,
                        ]);
                    }
                    $isGlobal = isset($variationData['is_global'])
                        ? filter_var($variationData['is_global'], FILTER_VALIDATE_BOOLEAN)
                        : false;

                    $globalId = $variationData['global_id'] ?? null;
                    if ($globalId === null && $isGlobal && isset($variationData['id']) && is_numeric($variationData['id'])) {
                        $globalId = $variationData['id'];
                    }

                    if ($isGlobal && $globalId !== null && is_numeric($globalId)) {
                        $selectedValues = (isset($variationData['values']) && is_array($variationData['values']))
                            ? $variationData['values']
                            : [];

                        $globalVar = Variation::query()
                            ->with('values')
                            ->find($globalId);

                        $isSubset = $globalVar
                            && !empty($selectedValues)
                            && $globalVar->values->count() > 0
                            && count($selectedValues) < $globalVar->values->count();

                        if ($isSubset) {
                            $variation = Variation::create([
                                'name' => $globalVar->name,
                                'type' => $globalVar->type,
                                'is_global' => false,
                            ]);
                            $product->variations()->attach($variation->id);

                            foreach ($selectedValues as $valData) {
                                $img = $valData['image'] ?? null;
                                if (is_array($img)) {
                                    $img = $img['path'] ?? ($img['url'] ?? null);
                                }

                                $newValue = $variation->values()->create([
                                    'label' => $valData['label'] ?? null,
                                    'value' => $valData['value'] ?? null,
                                    'color' => $valData['color'] ?? null,
                                    'image' => $img,
                                    'position' => $valData['position'] ?? null,
                                ]);
                                if (isset($valData['id'])) {
                                    $valueMapping[$valData['id']] = $newValue->id;
                                }

                                if ($this->variantDebugEnabled()) {
                                    logger()->info('[ProductController@update] global subset => created value', [
                                        'old_id' => $valData['id'] ?? null,
                                        'new_id' => $newValue->id,
                                        'label' => $newValue->label,
                                        'variation_id' => $variation->id,
                                    ]);
                                }
                            }
                        } else {
                            $product->variations()->attach($globalId);

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@update] attached global variation', [
                                    'variation_id' => $globalId,
                                ]);
                            }
                        }
                    } else {
                        // Product-specific (local) variation.
                        // If a numeric id is sent for a local variation, it's an existing local variation.
                        // We'll create a fresh variation record and remap value ids to keep update logic simple,
                        // then soft-delete the old local variation to avoid orphan buildup.
                        if (isset($variationData['id']) && is_numeric($variationData['id'])) {
                            $oldLocal = Variation::query()->find($variationData['id']);
                            if ($oldLocal && !$oldLocal->is_global) {
                                $oldLocal->delete();

                                if ($this->variantDebugEnabled()) {
                                    logger()->info('[ProductController@update] soft-deleted old local variation', [
                                        'old_id' => $variationData['id'],
                                    ]);
                                }
                            }
                        }

                        $variationName = $variationData['name'] ?? ($variationData['label'] ?? ($variationData['title'] ?? null));
                        $variationType = $variationData['type'] ?? 'text';
                        $variation = Variation::create([
                            'name' => $variationName,
                            'type' => $variationType,
                            'is_global' => false,
                        ]);
                        $product->variations()->attach($variation->id);

                        if ($this->variantDebugEnabled()) {
                            logger()->info('[ProductController@update] created local variation', [
                                'new_local_variation_id' => $variation->id,
                                'name' => $variation->name,
                                'type' => $variation->type,
                            ]);
                        }
                        foreach ($variationData['values'] as $valData) {
                            $img = $valData['image'] ?? null;
                            if (is_array($img)) {
                                $img = $img['path'] ?? ($img['url'] ?? null);
                            }
                            $newValue = $variation->values()->create([
                                'label' => $valData['label'],
                                'value' => $valData['value'] ?? null,
                                'color' => $valData['color'] ?? null,
                                'image' => $img,
                                'position' => $valData['position'] ?? null,
                            ]);
                            if (isset($valData['id'])) {
                                $valueMapping[$valData['id']] = $newValue->id;
                            }

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@update] created local variation value', [
                                    'old_id' => $valData['id'] ?? null,
                                    'new_id' => $newValue->id,
                                    'label' => $newValue->label,
                                    'variation_id' => $variation->id,
                                ]);
                            }
                        }
                    }
                 }

                 if ($this->variantDebugEnabled()) {
                    logger()->info('[ProductController@update] value mapping summary', [
                        'count' => count($valueMapping),
                        'sample' => array_slice($valueMapping, 0, 10, true),
                    ]);
                 }
            }

            if (isset($data['variants'])) {
                $existingVariantIds = [];
                
                foreach ($data['variants'] as $variantData) {
                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@update] before remap variant', [
                            'uids' => $variantData['uids'] ?? null,
                            'payload' => $variantData,
                        ]);
                    }

                    // Support admin payload using discount_price naming
                    if (array_key_exists('discount_price', $variantData) && !array_key_exists('special_price', $variantData)) {
                        $variantData['special_price'] = $variantData['discount_price'];
                    }
                    if (array_key_exists('discount_start', $variantData) && !array_key_exists('special_price_start', $variantData)) {
                        $variantData['special_price_start'] = $variantData['discount_start'];
                    }
                    if (array_key_exists('discount_end', $variantData) && !array_key_exists('special_price_end', $variantData)) {
                        $variantData['special_price_end'] = $variantData['discount_end'];
                    }
                    unset($variantData['discount_price'], $variantData['discount_start'], $variantData['discount_end']);

                    // PostgreSQL: product_variants.qty is NOT NULL. Frontend may send null for new variants.
                    if (!array_key_exists('qty', $variantData) || $variantData['qty'] === null || $variantData['qty'] === '') {
                        $variantData['qty'] = 0;
                    }
                    $allowBackorder = (bool) ($variantData['allow_backorder'] ?? false);
                    $variantData['in_stock'] = (float) $variantData['qty'] > 0 || $allowBackorder;
                    $variantMediaIds = [];
                    if (!empty($variantData['media_ids']) && is_array($variantData['media_ids'])) {
                        $variantMediaIds = array_values(array_unique(array_map('intval', $variantData['media_ids'])));
                    }

                    unset($variantData['media_ids']);
                    unset($variantData['media']);

                    if (isset($variantData['uids']) && isset($valueMapping)) {
                        $variantData['uids'] = $this->normalizeVariantUids((string) $variantData['uids'], $valueMapping);
                        if ($variantData['uids'] === '') {
                            $variantData['uids'] = null;
                        }
                    }

                    if ($this->variantDebugEnabled()) {
                        logger()->info('[ProductController@update] variant uids remap', [
                            'uids' => $variantData['uids'] ?? null,
                            'has_value_mapping' => isset($valueMapping),
                        ]);
                    }

                    if (!empty($variantData['values']) && is_array($variantData['values'])) {
                        $idsToFetch = [];
                        foreach ($variantData['values'] as $i => $val) {
                            if (!is_array($val)) continue;
                            $vid = $val['valueId'] ?? $val['id'] ?? null;
                            if ($vid !== null && isset($valueMapping[$vid])) {
                                $mapped = $valueMapping[$vid];
                                $variantData['values'][$i]['valueId'] = $mapped;
                                $variantData['values'][$i]['id'] = $mapped;
                            }
                            $finalId = $variantData['values'][$i]['valueId'] ?? $variantData['values'][$i]['id'] ?? null;
                            if ($finalId !== null && ctype_digit((string) $finalId)) {
                                $idsToFetch[] = (int) $finalId;
                            }
                        }

                        $idsToFetch = array_values(array_unique($idsToFetch));
                        if (!empty($idsToFetch)) {
                            $vvMap = VariationValue::query()
                                ->whereIn('id', $idsToFetch)
                                ->get(['id', 'variation_id', 'label', 'value', 'color', 'image', 'position'])
                                ->keyBy('id');

                            foreach ($variantData['values'] as $i => $val) {
                                if (!is_array($val)) continue;
                                $finalId = $val['valueId'] ?? $val['id'] ?? null;
                                if ($finalId === null || !ctype_digit((string) $finalId)) continue;
                                $vv = $vvMap->get((int) $finalId);
                                if (!$vv) continue;
                                if (empty($variantData['values'][$i]['variationId'])) {
                                    $variantData['values'][$i]['variationId'] = $vv->variation_id;
                                }
                                if (empty($variantData['values'][$i]['label'])) {
                                    $variantData['values'][$i]['label'] = $vv->label ?? $vv->value;
                                }
                                if (empty($variantData['values'][$i]['color']) && !empty($vv->color)) {
                                    $variantData['values'][$i]['color'] = $vv->color;
                                }
                                if (empty($variantData['values'][$i]['image']) && !empty($vv->image)) {
                                    $variantData['values'][$i]['image'] = $vv->image;
                                }
                                if (!isset($variantData['values'][$i]['position'])) {
                                    $variantData['values'][$i]['position'] = $vv->position;
                                }
                            }
                        }
                    }

                    // Auto-generate name from values if not present
                    if (empty($variantData['name']) && !empty($variantData['values']) && is_array($variantData['values'])) {
                        $labels = array_filter(array_map(function($val) {
                            return $val['label'] ?? ($val['name'] ?? ($val['value'] ?? null));
                        }, $variantData['values']));
                        if (!empty($labels)) {
                            $variantData['name'] = implode(' / ', $labels);
                        }
                    }

                    // UPDATE or CREATE variant
                    if (!empty($variantData['id'])) {
                        // Try to update existing variant
                        $variant = $product->variants()->find($variantData['id']);
                        if ($variant) {
                            $variant->update($variantData);
                            $existingVariantIds[] = $variant->id;

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@update] updated product variant', [
                                    'id' => $variant->id,
                                    'uids' => $variant->uids,
                                    'name' => $variant->name,
                                ]);
                            }
                        } else {
                            // ID provided but not found - create new without ID
                            unset($variantData['id']);
                            $variant = $product->variants()->create($variantData);
                            $existingVariantIds[] = $variant->id;

                            if ($this->variantDebugEnabled()) {
                                logger()->info('[ProductController@update] created product variant (id missing)', [
                                    'id' => $variant->id,
                                    'uids' => $variant->uids,
                                    'name' => $variant->name,
                                ]);
                            }
                        }
                    } else {
                        // No ID - create new variant
                        $variant = $product->variants()->create($variantData);
                        $existingVariantIds[] = $variant->id;

                        if ($this->variantDebugEnabled()) {
                            logger()->info('[ProductController@update] created product variant', [
                                'id' => $variant->id,
                                'uids' => $variant->uids,
                                'name' => $variant->name,
                            ]);
                        }
                    }

                    if (!empty($variantMediaIds)) {
                        // Clear existing media for this variant
                        Media::query()
                            ->where('product_variant_id', $variant->id)
                            ->update([
                                'scope' => 'global',
                                'product_variant_id' => null,
                                'position' => 0,
                            ]);

                        $items = Media::query()
                            ->whereIn('id', $variantMediaIds)
                            ->lockForUpdate()
                            ->get()
                            ->keyBy('id');

                        foreach ($variantMediaIds as $pos => $mid) {
                            $m = $items->get($mid);
                            if (!$m) continue;

                            $m->update([
                                'scope' => 'variant',
                                'product_variant_id' => $variant->id,
                                'position' => $pos,
                            ]);
                        }
                    }
                }
                
                // Delete variants that are not in the submitted list
                $product->variants()->whereNotIn('id', $existingVariantIds)->delete();

                // Ensure exactly one default variant
                try {
                    $defaultId = $product->variants()->where('is_active', true)->where('is_default', true)->orderBy('position')->value('id');
                    $defaultId = $defaultId ?: $product->variants()->where('is_active', true)->orderBy('position')->value('id');
                    if ($defaultId) {
                        $product->variants()->where('id', '!=', $defaultId)->update(['is_default' => false]);
                        $product->variants()->where('id', $defaultId)->update(['is_default' => true]);
                    }
                } catch (\Throwable $e) {
                    // Silent fail
                }
            }

            $fresh = $product->fresh(['googleProductCategory', 'media', 'variants.media', 'variants', 'variations.values.imageMedia', 'tags', 'saleUnit', 'productUnit', 'brand', 'categories', 'options.values', 'attributes']);
            $payload = $fresh->toArray();
            $payload['unit'] = $this->resolveUnitPayload($fresh);
            if ($fresh->productUnit) {
                $payload['custom_unit'] = $fresh->productUnit->toArray();
            }

            return response()->json(['product' => $payload]);
        });
    }

    public function getInventory(Product $product): JsonResponse
    {
        $product->load(['variants', 'media', 'variants.media', 'saleUnit', 'productUnit']);
        $payload = $product->toArray();
        $payload['unit'] = $this->resolveUnitPayload($product);

        return response()->json([
            'product' => $payload
        ]);
    }

    public function updateInventory(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'qty' => 'nullable|numeric',
            'allow_backorder' => 'nullable|boolean',
            'in_stock' => 'nullable|boolean',
            'variants' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($data, $product) {
            $productPayload = collect($data)->only(['qty', 'allow_backorder', 'in_stock'])->toArray();
            if (array_key_exists('qty', $productPayload) && $productPayload['qty'] !== null) {
                $productPayload['in_stock'] = (float) $productPayload['qty'] > 0 || (bool) ($productPayload['allow_backorder'] ?? $product->allow_backorder);
            }
            $product->update($productPayload);

            if (isset($data['variants'])) {
                foreach ($data['variants'] as $id => $vData) {
                    $variant = $product->variants()->find($id);
                    if ($variant) {
                        $variantPayload = collect($vData)->only(['qty', 'allow_backorder', 'in_stock'])->toArray();
                        if (array_key_exists('qty', $variantPayload) && $variantPayload['qty'] !== null) {
                            $variantPayload['in_stock'] = (float) $variantPayload['qty'] > 0 || (bool) ($variantPayload['allow_backorder'] ?? $variant->allow_backorder);
                        }
                        $variant->update($variantPayload);
                    }
                }
            }

            return response()->json(['success' => true]);
        });
    }

    public function getPricing(Product $product): JsonResponse
    {
        $product->load(['variants', 'media', 'variants.media', 'saleUnit', 'productUnit']);
        $payload = $product->toArray();
        $payload['unit'] = $this->resolveUnitPayload($product);

        return response()->json([
            'product' => $payload
        ]);
    }

    public function updatePricing(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'price' => 'nullable|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'variants' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($data, $product) {
            $pData = collect($data)->only(['price', 'discount_price'])->toArray();
            if (isset($pData['discount_price'])) {
                $pData['selling_price'] = $pData['discount_price'];
                unset($pData['discount_price']);
            }
            $product->update($pData);

            if (isset($data['variants'])) {
                foreach ($data['variants'] as $id => $vData) {
                    $variant = $product->variants()->find($id);
                    if ($variant) {
                        $payload = collect($vData)->only(['price', 'discount_price', 'special_price'])->toArray();
                        if (array_key_exists('discount_price', $payload) && !array_key_exists('special_price', $payload)) {
                            $payload['special_price'] = $payload['discount_price'];
                        }
                        unset($payload['discount_price']);
                        $variant->update($payload);
                    }
                }
            }

            return response()->json(['success' => true]);
        });
    }

    private function resolveUnitPayload(Product $product): array
    {
        if (!$product->show_unit_pricing) {
            return [
                'type' => 'default',
                'label' => 'Adet',
                'suffix' => 'adet',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => null,
                'info_bottom' => null,
                'price_prefix' => null,
                'stock_prefix' => null,
                'is_decimal_stock' => false,
            ];
        }

        if ($product->unit_type === 'custom' && $product->productUnit) {
            $u = $product->productUnit;
            $step = (float) ($u->step ?? 1);
            $isDecimal = fmod($step, 1.0) !== 0.0;
            return [
                'type' => 'custom',
                'label' => $u->label,
                'quantity_prefix' => $u->quantity_prefix,
                'min' => $u->min,
                'max' => $u->max,
                'step' => $u->step,
                'default_qty' => $u->default_qty,
                'info_top' => $u->info_top,
                'info_bottom' => $u->info_bottom,
                'price_prefix' => $u->price_prefix,
                'stock_prefix' => $u->stock_prefix,
                'suffix' => $u->label,
                'is_decimal_stock' => $isDecimal,
            ];
        }

        if ($product->saleUnit) {
            $u = $product->saleUnit;
            $suffix = $u->suffix ?: ($u->short_name ?: ($u->label ?: $u->name));
            $pricePrefix = $u->price_prefix;
            if (blank($pricePrefix)) {
                $short = $u->short_name;
                if (filled($short)) {
                    $pricePrefix = '/' . ltrim((string) $short, '/');
                }
            }

            return [
                'type' => 'global',
                'label' => $u->label,
                'quantity_prefix' => $u->quantity_prefix,
                'suffix' => $suffix,
                'min' => (float)$u->min,
                'max' => $u->max ? (float)$u->max : null,
                'step' => (float)$u->step,
                'default_qty' => $u->default_qty ? (float)$u->default_qty : null,
                'info_top' => $u->info_top,
                'info_bottom' => $u->info_bottom,
                'price_prefix' => $pricePrefix,
                'stock_prefix' => $u->stock_prefix,
                'is_decimal_stock' => (bool)$u->is_decimal_stock,
            ];
        }

        return [
            'type' => 'default',
            'label' => 'Adet',
            'suffix' => 'adet',
            'min' => 1,
            'max' => null,
            'step' => 1,
            'default_qty' => 1,
            'info_top' => null,
            'info_bottom' => null,
            'price_prefix' => null,
            'stock_prefix' => null,
            'is_decimal_stock' => false,
        ];
    }

    private function resolveTagIds(array $rawTags): array
    {
        $ids = [];

        foreach ($rawTags as $t) {
            if ($t === null) continue;

            if (is_numeric($t)) {
                $ids[] = (int) $t;
                continue;
            }

            $name = trim((string) $t);
            if ($name === '') continue;

            $normalized = Str::of($name)->lower()->squish()->value();

            $tag = Tag::query()->firstOrCreate(
                ['normalized_name' => $normalized],
                ['name' => $name, 'normalized_name' => $normalized],
            );

            $ids[] = (int) $tag->id;
        }

        return array_values(array_unique($ids));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['ok' => true]);
    }

    public function duplicate(Product $product): JsonResponse
    {
        return DB::transaction(function () use ($product) {
            $newProduct = $product->replicate();
            
            // Generate unique SKU
            if ($product->sku) {
                $newProduct->sku = $product->sku . '-COPY-' . Str::upper(Str::random(4));
            }
            
            // Generate unique Slug
            $newProduct->slug = $product->slug . '-copy-' . Str::lower(Str::random(4));
            $newProduct->name = $product->name . ' (Kopya)';
            $newProduct->is_active = false;
            $newProduct->save();

            // Clone Tags
            if ($product->tags) {
                $newProduct->tags()->sync($product->tags->pluck('id'));
            }

            // Clone Categories
            foreach ($product->categories as $category) {
                $newProduct->categories()->attach($category->id, [
                    'is_primary' => $category->pivot->is_primary
                ]);
            }

            // Clone Media
            if ($product->media) {
                $newProduct->media()->sync($product->media->pluck('id'));
            }

            // Clone Variants
            foreach ($product->variants as $variant) {
                $newVariant = $variant->replicate();
                $newVariant->product_id = $newProduct->id;
                
                if ($variant->sku) {
                    $newVariant->sku = $variant->sku . '-COPY-' . Str::upper(Str::random(4));
                }
                
                $newVariant->save();

                // Clone Variant Media
                if ($variant->media) {
                    $newVariant->media()->sync($variant->media->pluck('id'));
                }
            }

            return response()->json(['product' => $newProduct->load(['media', 'variants.media', 'variants', 'brand', 'categories'])]);
        });
    }

    /**
     * Bulk update products (FleetCart-style multi-action bulk editor).
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => 'array',
            'product_ids.*' => 'integer|exists:products,id',
            'actions' => 'required|array|min:1',
            'actions.*.attribute' => 'required|string',
            'actions.*.mode' => 'required|string',
            'apply_to_variants' => 'boolean',
        ]);

        $productIds = $request->input('product_ids', []);
        $actions = $request->input('actions', []);
        $applyToVariants = $request->boolean('apply_to_variants', true);

        // If product_ids is empty, apply to ALL products (scope=all)
        $query = Product::query();
        if (!empty($productIds)) {
            $query->whereIn('id', $productIds);
        }

        $updatedCount = 0;

        return DB::transaction(function () use ($query, $actions, $applyToVariants, &$updatedCount) {
            $query->chunk(200, function ($products) use ($actions, $applyToVariants, &$updatedCount) {
                foreach ($products as $product) {
                    $this->applyBulkActions($product, $actions, $applyToVariants);
                    $updatedCount++;
                }
            });

            return response()->json([
                'message' => "{$updatedCount} ürün başarıyla güncellendi.",
                'updated_count' => $updatedCount,
            ]);
        });
    }

    private function applyBulkActions(Product $product, array $actions, bool $applyToVariants): void
    {
        $productUpdates = [];

        foreach ($actions as $action) {
            $attr = $action['attribute'] ?? null;
            $mode = $action['mode'] ?? 'set';
            $value = $action['value'] ?? null;

            if (!$attr) continue;

            switch ($attr) {
                case 'price':
                    $productUpdates['price'] = $this->computeNumericValue((float) $product->price, $mode, $value);
                    // Recalculate selling_price
                    $sp = $product->special_price;
                    $newPrice = $productUpdates['price'];
                    $productUpdates['selling_price'] = ($sp !== null && $sp > 0 && $sp < $newPrice) ? $sp : $newPrice;
                    break;

                case 'special_price':
                    if ($mode === 'clear') {
                        $productUpdates['special_price'] = null;
                        $productUpdates['selling_price'] = $product->price;
                    } else {
                        $currentSp = (float) ($product->special_price ?? $product->price);
                        $newSp = $this->computeNumericValue($currentSp, $mode, $value);
                        $productUpdates['special_price'] = $newSp;
                        $productUpdates['selling_price'] = $newSp;
                    }
                    break;

                case 'manage_stock':
                    // Not a direct column on our model, but we handle it for variant compatibility
                    break;

                case 'qty':
                    $productUpdates['qty'] = $this->computeNumericValue((float) $product->qty, $mode, $value);
                    break;

                case 'in_stock':
                    $productUpdates['in_stock'] = (bool) $value;
                    break;

                case 'is_active':
                    $productUpdates['is_active'] = (bool) $value;
                    break;

                case 'brand_id':
                    if ($mode === 'clear') {
                        $productUpdates['brand_id'] = null;
                    } else {
                        $productUpdates['brand_id'] = $value ? (int) $value : null;
                    }
                    break;

                case 'name':
                    $productUpdates['name'] = $this->computeTextValue($product->name ?? '', $mode, $value);
                    break;

                case 'description':
                    $productUpdates['description'] = $this->computeTextValue($product->description ?? '', $mode, $value);
                    break;

                case 'short_description':
                    $productUpdates['short_description'] = $this->computeTextValue($product->short_description ?? '', $mode, $value);
                    break;

                case 'primary_category':
                    if ($mode === 'clear') {
                        // Remove primary flag from all categories
                        $product->categories()->updateExistingPivot(
                            $product->categories->pluck('id')->toArray(),
                            ['is_primary' => false]
                        );
                    } elseif ($value) {
                        // Set new primary category
                        $catIds = $product->categories->pluck('id')->toArray();
                        if (!in_array((int) $value, $catIds)) {
                            $product->categories()->attach($value, ['is_primary' => true, 'position' => 0]);
                        }
                        // Reset all to non-primary, then set the target
                        foreach ($catIds as $cid) {
                            $product->categories()->updateExistingPivot($cid, ['is_primary' => $cid == (int) $value]);
                        }
                    }
                    break;

                case 'category_action':
                    if ($mode === 'add' && $value) {
                        $catIds = is_array($value) ? $value : [$value];
                        foreach ($catIds as $cid) {
                            if (!$product->categories()->where('category_id', $cid)->exists()) {
                                $product->categories()->attach($cid, ['is_primary' => false, 'position' => 999]);
                            }
                        }
                    } elseif ($mode === 'remove' && $value) {
                        $catIds = is_array($value) ? $value : [$value];
                        $product->categories()->detach($catIds);
                    }
                    break;

                case 'tax_class_id':
                    if ($mode === 'clear') {
                        $productUpdates['tax_class_id'] = null;
                    } else {
                        $productUpdates['tax_class_id'] = $value ? (int) $value : null;
                    }
                    break;
            }
        }

        // Apply product-level updates
        if (!empty($productUpdates)) {
            // Auto-calculate in_stock if qty changed
            if (array_key_exists('qty', $productUpdates) && !array_key_exists('in_stock', $productUpdates)) {
                $allowBackorder = (bool) $product->allow_backorder;
                $productUpdates['in_stock'] = (float) $productUpdates['qty'] > 0 || $allowBackorder;
            }

            // Auto-recalculate slug if name changed
            if (array_key_exists('name', $productUpdates)) {
                $productUpdates['slug'] = Str::slug($productUpdates['name']);
            }

            $product->update($productUpdates);
        }

        // Apply to variants if requested
        if ($applyToVariants && $product->variants()->exists()) {
            $variants = $product->variants()->get();
            foreach ($variants as $variant) {
                $variantUpdates = [];

                foreach ($actions as $action) {
                    $attr = $action['attribute'] ?? null;
                    $mode = $action['mode'] ?? 'set';
                    $value = $action['value'] ?? null;

                    switch ($attr) {
                        case 'price':
                            $variantUpdates['price'] = $this->computeNumericValue((float) $variant->price, $mode, $value);
                            $sp = $variant->special_price;
                            $newPrice = $variantUpdates['price'];
                            $variantUpdates['selling_price'] = ($sp !== null && $sp > 0 && $sp < $newPrice) ? $sp : $newPrice;
                            break;

                        case 'special_price':
                            if ($mode === 'clear') {
                                $variantUpdates['special_price'] = null;
                                $variantUpdates['selling_price'] = $variant->price;
                            } else {
                                $currentSp = (float) ($variant->special_price ?? $variant->price);
                                $newSp = $this->computeNumericValue($currentSp, $mode, $value);
                                $variantUpdates['special_price'] = $newSp;
                                $variantUpdates['selling_price'] = $newSp;
                            }
                            break;

                        case 'qty':
                            $variantUpdates['qty'] = $this->computeNumericValue((float) $variant->qty, $mode, $value);
                            break;

                        case 'in_stock':
                            $variantUpdates['in_stock'] = (bool) $value;
                            break;

                        case 'is_active':
                            $variantUpdates['is_active'] = (bool) $value;
                            break;
                    }
                }

                if (!empty($variantUpdates)) {
                    if (array_key_exists('qty', $variantUpdates) && !array_key_exists('in_stock', $variantUpdates)) {
                        $allowBackorder = (bool) ($variant->allow_backorder ?? false);
                        $variantUpdates['in_stock'] = (float) $variantUpdates['qty'] > 0 || $allowBackorder;
                    }
                    $variant->update($variantUpdates);
                }
            }
        }
    }

    private function computeNumericValue(float $current, string $mode, $value): float
    {
        $val = is_numeric($value) ? (float) $value : 0;

        return match ($mode) {
            'set' => $val,
            'increase_percent' => round($current * (1 + $val / 100), 2),
            'decrease_percent' => round($current * (1 - $val / 100), 2),
            'increase_fixed' => round($current + $val, 2),
            'decrease_fixed' => round($current - $val, 2),
            default => $current,
        };
    }

    private function computeTextValue(string $current, string $mode, $value): string
    {
        if ($mode === 'set') {
            return (string) $value;
        }

        if ($mode === 'prefix') {
            return ((string) $value) . $current;
        }

        if ($mode === 'suffix') {
            return $current . ((string) $value);
        }

        if ($mode === 'search_replace' && is_array($value)) {
            $search = $value['search'] ?? '';
            $replace = $value['replace'] ?? '';
            return str_replace($search, $replace, $current);
        }

        return $current;
    }
}
