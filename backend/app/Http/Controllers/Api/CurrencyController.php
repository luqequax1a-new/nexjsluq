<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CurrencyController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:currencies.index')->only(['index']);
        $this->middleware('permission:currencies.create')->only(['store']);
        $this->middleware('permission:currencies.edit')->only(['update', 'setDefault']);
        $this->middleware('permission:currencies.destroy')->only(['destroy']);
    }

    public function index(): JsonResponse
    {
        $currencies = Currency::orderBy('default', 'desc')->orderBy('code')->get();
        return response()->json($currencies);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:3', 'unique:currencies,code'],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:10'],
            'symbol_position' => ['required', 'in:left,right'],
            'thousand_separator' => ['required', 'string', 'max:1'],
            'decimal_separator' => ['required', 'string', 'max:1'],
            'no_of_decimals' => ['required', 'integer', 'min:0', 'max:4'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'boolean'],
        ]);

        $currency = Currency::create($data);

        return response()->json([
            'message' => 'Currency created successfully',
            'currency' => $currency,
        ], 201);
    }

    public function update(Request $request, Currency $currency): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:3', 'unique:currencies,code,' . $currency->id],
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:10'],
            'symbol_position' => ['required', 'in:left,right'],
            'thousand_separator' => ['required', 'string', 'max:1'],
            'decimal_separator' => ['required', 'string', 'max:1'],
            'no_of_decimals' => ['required', 'integer', 'min:0', 'max:4'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'boolean'],
        ]);

        $currency->update($data);

        return response()->json([
            'message' => 'Currency updated successfully',
            'currency' => $currency,
        ]);
    }

    public function setDefault(Currency $currency): JsonResponse
    {
        DB::transaction(function () use ($currency) {
            // Remove default from all currencies
            Currency::where('default', true)->update(['default' => false]);
            
            // Set this currency as default
            $currency->update(['default' => true, 'exchange_rate' => 1.0000]);
        });

        return response()->json([
            'message' => 'Default currency updated successfully',
            'currency' => $currency,
        ]);
    }

    public function destroy(Currency $currency): JsonResponse
    {
        if ($currency->default) {
            return response()->json([
                'message' => 'Cannot delete default currency',
            ], 403);
        }

        $currency->delete();

        return response()->json([
            'message' => 'Currency deleted successfully',
        ]);
    }
}
