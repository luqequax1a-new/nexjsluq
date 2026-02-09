<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:shipping_methods.index')->only(['index', 'show']);
        $this->middleware('permission:shipping_methods.create')->only(['store']);
        $this->middleware('permission:shipping_methods.edit')->only(['update']);
        $this->middleware('permission:shipping_methods.destroy')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $methods = ShippingMethod::orderBy('position')->get();
        return response()->json($methods);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'logo' => 'nullable|string',
            'is_active' => 'boolean',
            'base_rate' => 'numeric|min:0',
            'free_threshold' => 'nullable|numeric|min:0',
            'cod_enabled' => 'boolean',
            'cod_fee' => 'numeric|min:0',
            'position' => 'integer',
        ]);

        $validated['code'] = \Illuminate\Support\Str::slug($validated['name']);

        // Ensure uniqueness for code
        $baseCode = $validated['code'];
        $counter = 1;
        while (ShippingMethod::where('code', $validated['code'])->exists()) {
            $validated['code'] = $baseCode . '-' . $counter++;
        }

        $method = ShippingMethod::create($validated);
        return response()->json($method, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ShippingMethod $shippingMethod): JsonResponse
    {
        return response()->json($shippingMethod);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ShippingMethod $shippingMethod): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'logo' => 'nullable|string',
            'is_active' => 'boolean',
            'base_rate' => 'numeric|min:0',
            'free_threshold' => 'nullable|numeric|min:0',
            'cod_enabled' => 'boolean',
            'cod_fee' => 'numeric|min:0',
            'position' => 'integer',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $shippingMethod->name) {
             $validated['code'] = \Illuminate\Support\Str::slug($validated['name']);
             
             // Ensure uniqueness if code changed
             $baseCode = $validated['code'];
             $counter = 1;
             while (ShippingMethod::where('code', $validated['code'])->where('id', '!=', $shippingMethod->id)->exists()) {
                 $validated['code'] = $baseCode . '-' . $counter++;
             }
        }

        $shippingMethod->update($validated);
        return response()->json($shippingMethod);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ShippingMethod $shippingMethod): JsonResponse
    {
        $shippingMethod->delete();
        return response()->json(null, 204);
    }
}
