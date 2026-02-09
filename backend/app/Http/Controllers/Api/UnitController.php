<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:units.index')->only(['show']);
        $this->middleware('permission:units.create')->only(['store']);
        $this->middleware('permission:units.edit')->only(['update']);
        $this->middleware('permission:units.destroy')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Unit::query()->orderBy('name');

        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'label' => ['nullable', 'string', 'max:255'],
            'quantity_prefix' => ['nullable', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'min' => ['nullable', 'numeric', 'min:0'],
            'max' => ['nullable', 'numeric', 'min:0'],
            'step' => ['nullable', 'numeric', 'gt:0'],
            'default_qty' => ['nullable', 'numeric', 'min:0'],
            'info_top' => ['nullable', 'string'],
            'info_bottom' => ['nullable', 'string'],
            'price_prefix' => ['nullable', 'string', 'max:255'],
            'stock_prefix' => ['nullable', 'string', 'max:255'],
            'is_decimal_stock' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('max', $data) && $data['max'] !== null) {
            $min = (float) ($data['min'] ?? 0);
            if ((float) $data['max'] < $min) {
                return response()->json(['message' => 'max must be greater than or equal to min'], 422);
            }
        }

        $unit = Unit::create([
            'name' => $data['name'],
            'label' => $data['label'] ?? null,
            'quantity_prefix' => $data['quantity_prefix'] ?? null,
            'short_name' => $data['short_name'] ?? null,
            'suffix' => $data['suffix'] ?? null,
            'min' => $data['min'] ?? 0,
            'max' => $data['max'] ?? null,
            'step' => $data['step'] ?? 1,
            'default_qty' => $data['default_qty'] ?? null,
            'info_top' => $data['info_top'] ?? null,
            'info_bottom' => $data['info_bottom'] ?? null,
            'price_prefix' => $data['price_prefix'] ?? null,
            'stock_prefix' => $data['stock_prefix'] ?? null,
            'is_decimal_stock' => (bool) ($data['is_decimal_stock'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return response()->json($unit, 201);
    }

    public function show(Unit $unit): JsonResponse
    {
        return response()->json($unit);
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'label' => ['nullable', 'string', 'max:255'],
            'quantity_prefix' => ['nullable', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'min' => ['nullable', 'numeric', 'min:0'],
            'max' => ['nullable', 'numeric', 'min:0'],
            'step' => ['nullable', 'numeric', 'gt:0'],
            'default_qty' => ['nullable', 'numeric', 'min:0'],
            'info_top' => ['nullable', 'string'],
            'info_bottom' => ['nullable', 'string'],
            'price_prefix' => ['nullable', 'string', 'max:255'],
            'stock_prefix' => ['nullable', 'string', 'max:255'],
            'is_decimal_stock' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('max', $data) && array_key_exists('min', $data) && $data['max'] !== null) {
            if ((float) $data['max'] < (float) ($data['min'] ?? 0)) {
                return response()->json(['message' => 'max must be greater than or equal to min'], 422);
            }
        }

        $unit->update($data);

        return response()->json($unit);
    }

    public function destroy(Unit $unit): JsonResponse
    {
        $unit->delete();

        return response()->json(['ok' => true]);
    }
}
