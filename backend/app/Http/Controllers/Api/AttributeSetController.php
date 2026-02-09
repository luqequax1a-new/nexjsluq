<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeSet;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttributeSetController extends Controller
{
    public function __construct()
    {
        // Keep consistent with existing controllers.
        $this->middleware('permission:attributes.index')->only(['index', 'show']);
        $this->middleware('permission:attributes.create')->only(['store']);
        $this->middleware('permission:attributes.edit')->only(['update']);
        $this->middleware('permission:attributes.destroy')->only(['destroy']);
    }

    public function index(): JsonResponse
    {
        $sets = AttributeSet::query()
            ->with(['attributes.values'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($sets);
    }

    public function show(AttributeSet $attributeSet): JsonResponse
    {
        return response()->json($attributeSet->load(['attributes.values']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'attributes' => ['nullable', 'array'],
            'attributes.*.name' => ['required', 'string', 'max:255'],
            'attributes.*.position' => ['nullable', 'integer', 'min:0'],
            'attributes.*.values' => ['nullable', 'array'],
            'attributes.*.values.*.value' => ['required', 'string', 'max:255'],
            'attributes.*.values.*.position' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($data) {
            $set = AttributeSet::create(['name' => $data['name']]);

            $attrs = $data['attributes'] ?? [];
            foreach ($attrs as $aIndex => $attrData) {
                $attr = Attribute::create([
                    'attribute_set_id' => $set->id,
                    'name' => $attrData['name'],
                    'position' => $attrData['position'] ?? $aIndex,
                ]);

                $vals = $attrData['values'] ?? [];
                foreach ($vals as $vIndex => $valData) {
                    AttributeValue::create([
                        'attribute_id' => $attr->id,
                        'value' => $valData['value'],
                        'position' => $valData['position'] ?? $vIndex,
                    ]);
                }
            }

            return response()->json($set->load(['attributes.values']), 201);
        });
    }

    public function update(Request $request, AttributeSet $attributeSet): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'attributes' => ['nullable', 'array'],
            'attributes.*.id' => ['nullable', 'integer'],
            'attributes.*.name' => ['required', 'string', 'max:255'],
            'attributes.*.position' => ['nullable', 'integer', 'min:0'],
            'attributes.*.values' => ['nullable', 'array'],
            'attributes.*.values.*.id' => ['nullable', 'integer'],
            'attributes.*.values.*.value' => ['required', 'string', 'max:255'],
            'attributes.*.values.*.position' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($data, $attributeSet) {
            $attributeSet->update(['name' => $data['name']]);

            $existingAttrIds = $attributeSet->attributes()->pluck('id')->all();
            $keepAttrIds = [];

            $attrs = $data['attributes'] ?? [];
            foreach ($attrs as $aIndex => $attrData) {
                $attr = null;
                $attrId = $attrData['id'] ?? null;

                if ($attrId && in_array((int) $attrId, array_map('intval', $existingAttrIds), true)) {
                    $attr = $attributeSet->attributes()->whereKey((int) $attrId)->first();
                    if ($attr) {
                        $attr->update([
                            'name' => $attrData['name'],
                            'position' => $attrData['position'] ?? $aIndex,
                        ]);
                    }
                }

                if (!$attr) {
                    $attr = Attribute::create([
                        'attribute_set_id' => $attributeSet->id,
                        'name' => $attrData['name'],
                        'position' => $attrData['position'] ?? $aIndex,
                    ]);
                }

                $keepAttrIds[] = $attr->id;

                // Values: delete & recreate for simplicity.
                $attr->values()->delete();
                $vals = $attrData['values'] ?? [];
                foreach ($vals as $vIndex => $valData) {
                    AttributeValue::create([
                        'attribute_id' => $attr->id,
                        'value' => $valData['value'],
                        'position' => $valData['position'] ?? $vIndex,
                    ]);
                }
            }

            $attributeSet->attributes()->whereNotIn('id', $keepAttrIds)->delete();

            return response()->json($attributeSet->load(['attributes.values']));
        });
    }

    public function destroy(AttributeSet $attributeSet): JsonResponse
    {
        $attributeSet->delete();
        return response()->json(['ok' => true]);
    }
}
