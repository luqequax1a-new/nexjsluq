<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Variation;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VariationController extends Controller
{
    public function __construct()
    {
        // Temporarily disabled for testing
        // $this->middleware('permission:variations.index')->only(['index', 'show']);
        // $this->middleware('permission:variations.create')->only(['store']);
        // $this->middleware('permission:variations.edit')->only(['update']);
        // $this->middleware('permission:variations.destroy')->only(['destroy']);
    }

    public function index(): JsonResponse
    {
        $variations = Variation::query()
            ->globals()
            ->with(['values.imageMedia'])
            ->orderBy('position')
            ->get();
        return response()->json($variations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', 'string', Rule::in(Variation::TYPES)],
            'values' => 'required|array|min:1',
            'values.*.label' => 'required|string|max:255',
            'values.*.value' => 'nullable|string',
            'values.*.color' => 'nullable|string|max:255',
            'values.*.image_id' => 'nullable|integer|exists:media,id',
            'values.*.position' => 'nullable|integer',
        ]);

        $variation = Variation::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'position' => $request->get('position', 0),
            'is_global' => true,
        ]);

        foreach ($data['values'] as $index => $valueData) {
            $variation->values()->create([
                'label' => $valueData['label'],
                'value' => $valueData['value'] ?? $valueData['color'] ?? null,
                'color' => $valueData['color'] ?? null,
                'image_id' => $valueData['image_id'] ?? null,
                'position' => $valueData['position'] ?? $index,
            ]);
        }

        return response()->json($variation->load(['values.imageMedia']), 201);
    }

    public function show(Variation $variation): JsonResponse
    {
        return response()->json($variation->load(['values.imageMedia']));
    }

    public function update(Request $request, Variation $variation): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', 'string', Rule::in(Variation::TYPES)],
            'values' => 'required|array|min:1',
            'values.*.id' => 'nullable|exists:variation_values,id',
            'values.*.uid' => 'nullable|string',
            'values.*.label' => 'required|string|max:255',
            'values.*.value' => 'nullable|string',
            'values.*.color' => 'nullable|string|max:255',
            'values.*.image_id' => 'nullable|integer|exists:media,id',
            'values.*.position' => 'nullable|integer',
        ]);

        $variation->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'position' => $request->get('position', 0),
            'is_global' => true,
        ]);

        $valueIds = [];
        foreach ($data['values'] as $index => $valueData) {
            $valuePayload = [
                'label' => $valueData['label'],
                'value' => $valueData['value'] ?? $valueData['color'] ?? null,
                'color' => $valueData['color'] ?? null,
                'image_id' => $valueData['image_id'] ?? null,
                'position' => $valueData['position'] ?? $index,
            ];

            if (isset($valueData['id'])) {
                $value = $variation->values()->find($valueData['id']);
                if ($value) {
                    $value->update($valuePayload);
                    $valueIds[] = $value->id;
                }
            } else {
                $newValue = $variation->values()->create($valuePayload);
                $valueIds[] = $newValue->id;
            }
        }
        $variation->values()->whereNotIn('id', $valueIds)->delete();

        return response()->json($variation->load(['values.imageMedia']));
    }

    public function destroy(Variation $variation): JsonResponse
    {
        $variation->delete();
        return response()->json(['ok' => true]);
    }
}
