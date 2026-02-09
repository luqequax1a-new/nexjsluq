<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxClassController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:tax_classes.index')->only(['show']);
    }

    public function index(): JsonResponse
    {
        try {
            // Return simpler list for dropdowns
            $classes = TaxClass::get()->map(function ($taxClass) {
                return [
                    'id' => $taxClass->id,
                    'label' => $taxClass->label ?? 'Tax Class ' . $taxClass->id,
                ];
            });

            return response()->json($classes);
        } catch (\Exception $e) {
            \Log::error('TaxClass index error: ' . $e->getMessage());
            return response()->json([]);
        }
    }
    
    public function show(TaxClass $taxClass): JsonResponse
    {
        return response()->json($taxClass->load('taxRates'));
    }
}
