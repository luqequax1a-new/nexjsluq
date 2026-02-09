<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Option;
use App\Models\OptionValue;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OptionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:options.index')->only(['index', 'show']);
        $this->middleware('permission:options.create')->only(['store']);
        $this->middleware('permission:options.edit')->only(['update', 'updateValues', 'importTemplateToProduct', 'saveProductOptions']);
        $this->middleware('permission:options.destroy')->only(['destroy']);
    }

    /**
     * Get global options list (index)
     */
    public function index()
    {
        // Global seçenekler product_id'si null olanlar veya is_global true olanlar
        $options = Option::where('is_global', true)
            ->orWhereNull('product_id')
            ->orderBy('position')
            ->get();
            
        return response()->json($options);
    }

    /**
     * Get single option details
     */
    public function show($id)
    {
        $option = Option::with('values')->findOrFail($id);
        return response()->json($option);
    }

    /**
     * Store a new global option
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'is_required' => 'boolean',
            'values' => 'array',
            'values.*.label' => 'required',
            'values.*.price' => 'nullable|numeric',
            'values.*.price_type' => 'in:fixed,percent',
            'values.*.position' => 'nullable|integer'
        ]);

        DB::beginTransaction();
        try {
            $option = Option::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'is_required' => $request->boolean('is_required'),
                'is_global' => true,
                'product_id' => null,
                'position' => Option::where('is_global', true)->count() + 1
            ]);

            if (!empty($request->input('values'))) {
                foreach ($request->input('values') as $index => $val) {
                    $option->values()->create([
                        'label' => $val['label'],
                        'price' => $val['price'] ?? 0,
                        'price_type' => $val['price_type'] ?? 'fixed',
                        'position' => $val['position'] ?? $index,
                    ]);
                }
            }

            DB::commit();
            return response()->json($option->load('values'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a global option
     */
    public function update(Request $request, $id)
    {
        $option = Option::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'is_required' => 'boolean',
            'values' => 'array',
            'values.*.label' => 'required'
        ]);

        DB::beginTransaction();
        try {
            $option->update([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'is_required' => $request->boolean('is_required'),
            ]);

            // Sync Values: Delete all and recreate (easiest strategy for simple sub-items)
            $option->values()->delete();

            if (!empty($request->input('values'))) {
                foreach ($request->input('values') as $index => $val) {
                    $option->values()->create([
                        'label' => $val['label'],
                        'price' => $val['price'] ?? 0,
                        'price_type' => $val['price_type'] ?? 'fixed',
                        'position' => $val['position'] ?? $index,
                    ]);
                }
            }

            DB::commit();
            return response()->json($option->load('values'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Import a global template into a specific product
     * Not: This creates a COPY (Clone) for that product.
     */
    public function importTemplateToProduct(Request $request, $productId)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:options,id'
        ]);

        $product = Product::findOrFail($productId);
        $template = Option::with('values')->findOrFail($validated['template_id']);

        DB::beginTransaction();
        try {
            // Clone the Option
            $newOption = Option::create([
                'product_id' => $product->id, // Linked to product
                'name' => $template->name,
                'type' => $template->type,
                'is_required' => $template->is_required,
                'is_global' => false, // It is now specific
                'position' => $product->options()->count() + 1
            ]);

            // Clone Values
            foreach ($template->values as $val) {
                $newOption->values()->create([
                    'label' => $val->label,
                    'price' => $val->price,
                    'price_type' => $val->price_type,
                    'position' => $val->position
                ]);
            }

            DB::commit();
            
            return response()->json($newOption->load('values'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Save (Sync) all options for a product
     * This handles creating new, updating existing, and deleting removed options.
     */
    public function saveProductOptions(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $payload = $request->input('options', []); // Array of options

        DB::beginTransaction();
        try {
            // Get current option IDs
            $existingIds = $product->options()->pluck('id')->toArray();
            $keptIds = [];

            foreach ($payload as $index => $optData) {
                $option = null;
                
                // If ID exists and is in our list, update it
                if (isset($optData['id']) && in_array($optData['id'], $existingIds)) {
                    $option = Option::find($optData['id']);
                    $option->update([
                        'name' => $optData['name'],
                        'type' => $optData['type'],
                        'is_required' => $optData['is_required'] ?? false,
                        'position' => $index
                    ]);
                    $keptIds[] = $option->id;
                } else {
                    // Create new product specific option
                    $option = Option::create([
                        'product_id' => $product->id,
                        'name' => $optData['name'],
                        'type' => $optData['type'],
                        'is_required' => $optData['is_required'] ?? false,
                        'is_global' => false,
                        'position' => $index
                    ]);
                    $keptIds[] = $option->id;
                }

                // Sync Values (Delete old, Create/Update new)
                // For simplicity in options, we often just delete all values and recreate them 
                // because it's fast enough and avoids complex matching logix for sub-items.
                $option->values()->delete();

                if (!empty($optData['values'])) {
                    foreach ($optData['values'] as $vIndex => $valData) {
                        $option->values()->create([
                            'label' => $valData['label'],
                            'price' => $valData['price'] ?? 0,
                            'price_type' => $valData['price_type'] ?? 'fixed',
                            'position' => $vIndex
                        ]);
                    }
                }
            }

            // Delete options that were removed from the frontend list
            $product->options()->whereNotIn('id', $keptIds)->delete();

            DB::commit();

            return response()->json($product->options()->with('values')->get());
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete an option
     */
    public function destroy($id)
    {
        $option = Option::findOrFail($id);
        $option->delete();
        return response()->json(['success' => true]);
    }
}
