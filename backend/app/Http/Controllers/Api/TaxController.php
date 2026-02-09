<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxClass;
use App\Models\TaxRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaxController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:tax.index')->only(['indexClasses']);
        $this->middleware('permission:tax.create')->only(['storeClass', 'storeRate']);
        $this->middleware('permission:tax.edit')->only(['updateClass', 'updateRate']);
        $this->middleware('permission:tax.destroy')->only(['destroyClass', 'destroyRate']);
    }

    public function indexClasses(): JsonResponse
    {
        $classes = TaxClass::with(['translations', 'taxRates.translations'])->get();
        return response()->json($classes);
    }

    public function storeClass(Request $request): JsonResponse
    {
        $data = $request->validate([
            'based_on' => ['required', 'in:shipping_address,billing_address,store_address'],
            'label' => ['required', 'string', 'max:255'],
            'label_tr' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($data) {
            $taxClass = TaxClass::create([
                'based_on' => $data['based_on'],
            ]);

            $taxClass->translations()->create([
                'locale' => 'en',
                'label' => $data['label'],
            ]);

            if (!empty($data['label_tr'])) {
                $taxClass->translations()->create([
                    'locale' => 'tr',
                    'label' => $data['label_tr'],
                ]);
            }

            return response()->json([
                'message' => 'Tax class created successfully',
                'tax_class' => $taxClass->load('translations'),
            ], 201);
        });
    }

    public function updateClass(Request $request, TaxClass $taxClass): JsonResponse
    {
        $data = $request->validate([
            'based_on' => ['required', 'in:shipping_address,billing_address,store_address'],
            'label' => ['required', 'string', 'max:255'],
            'label_tr' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($data, $taxClass) {
            $taxClass->update(['based_on' => $data['based_on']]);

            $taxClass->translations()->updateOrCreate(
                ['locale' => 'en'],
                ['label' => $data['label']]
            );

            if (!empty($data['label_tr'])) {
                $taxClass->translations()->updateOrCreate(
                    ['locale' => 'tr'],
                    ['label' => $data['label_tr']]
                );
            }

            return response()->json([
                'message' => 'Tax class updated successfully',
                'tax_class' => $taxClass->fresh(['translations']),
            ]);
        });
    }

    public function destroyClass(TaxClass $taxClass): JsonResponse
    {
        $taxClass->delete();
        return response()->json(['message' => 'Tax class deleted successfully']);
    }

    public function storeRate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tax_class_id' => ['required', 'integer', 'exists:tax_classes,id'],
            'country' => ['nullable', 'string', 'max:2'],
            'state' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'zip' => ['nullable', 'string', 'max:20'],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'position' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'name_tr' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($data) {
            $rate = TaxRate::create([
                'tax_class_id' => $data['tax_class_id'],
                'country' => $data['country'] ?? '*',
                'state' => $data['state'] ?? '*',
                'city' => $data['city'] ?? '*',
                'zip' => $data['zip'] ?? '*',
                'rate' => $data['rate'],
                'position' => $data['position'] ?? 0,
            ]);

            $rate->translations()->create([
                'locale' => 'en',
                'name' => $data['name'],
            ]);

            if (!empty($data['name_tr'])) {
                $rate->translations()->create([
                    'locale' => 'tr',
                    'name' => $data['name_tr'],
                ]);
            }

            return response()->json([
                'message' => 'Tax rate created successfully',
                'tax_rate' => $rate->load('translations'),
            ], 201);
        });
    }

    public function updateRate(Request $request, TaxRate $taxRate): JsonResponse
    {
        $data = $request->validate([
            'country' => ['nullable', 'string', 'max:2'],
            'state' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'zip' => ['nullable', 'string', 'max:20'],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'position' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'name_tr' => ['nullable', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($data, $taxRate) {
            $taxRate->update([
                'country' => $data['country'] ?? '*',
                'state' => $data['state'] ?? '*',
                'city' => $data['city'] ?? '*',
                'zip' => $data['zip'] ?? '*',
                'rate' => $data['rate'],
                'position' => $data['position'] ?? 0,
            ]);

            $taxRate->translations()->updateOrCreate(
                ['locale' => 'en'],
                ['name' => $data['name']]
            );

            if (!empty($data['name_tr'])) {
                $taxRate->translations()->updateOrCreate(
                    ['locale' => 'tr'],
                    ['name' => $data['name_tr']]
                );
            }

            return response()->json([
                'message' => 'Tax rate updated successfully',
                'tax_rate' => $taxRate->fresh(['translations']),
            ]);
        });
    }

    public function destroyRate(TaxRate $taxRate): JsonResponse
    {
        $taxRate->delete();
        return response()->json(['message' => 'Tax rate deleted successfully']);
    }
}
