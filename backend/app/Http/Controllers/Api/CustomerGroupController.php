<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class CustomerGroupController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:customer_groups.index')->only(['index', 'show']);
        $this->middleware('permission:customer_groups.create')->only(['store']);
        $this->middleware('permission:customer_groups.edit')->only(['update', 'runAutoAssignment']);
        $this->middleware('permission:customer_groups.destroy')->only(['destroy']);
    }

    /**
     * List all customer groups
     */
    public function index(Request $request): JsonResponse
    {
        $query = CustomerGroup::query();

        if ($search = $request->input('search')) {
            $query->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
        }

        $groups = $query->orderBy('name', 'asc')->get();

        return response()->json($groups);
    }

    /**
     * Create new customer group
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:customer_groups,name'],
            'description' => ['nullable', 'string'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
            'auto_assignment_rules' => ['nullable', 'array'],
        ]);

        $group = CustomerGroup::create($validated);

        if ($request->boolean('run_assignment_immediately')) {
            $group->runAutoAssignment();
        }

        return response()->json([
            'message' => 'Müşteri grubu başarıyla oluşturuldu',
            'group' => $group->fresh(),
        ], 201);
    }

    /**
     * Get single customer group
     */
    public function show(CustomerGroup $customerGroup): JsonResponse
    {
        return response()->json($customerGroup->load('customers'));
    }

    /**
     * Update customer group
     */
    public function update(Request $request, CustomerGroup $customerGroup): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('customer_groups', 'name')->ignore($customerGroup->id)],
            'description' => ['nullable', 'string'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
            'auto_assignment_rules' => ['nullable', 'array'],
        ]);

        $customerGroup->update($validated);

        return response()->json([
            'message' => 'Müşteri grubu güncellendi',
            'group' => $customerGroup,
        ]);
    }

    /**
     * Delete customer group
     */
    public function destroy(CustomerGroup $customerGroup): JsonResponse
    {
        // Maybe check if it's used in coupons before deleting?
        $customerGroup->delete();

        return response()->json([
            'message' => 'Müşteri grubu silindi',
        ]);
    }

    /**
     * Execute auto-assignment for a group
     */
    public function runAutoAssignment(CustomerGroup $customerGroup): JsonResponse
    {
        $count = $customerGroup->runAutoAssignment();

        return response()->json([
            'message' => "{$count} müşteri bu gruba eklendi",
            'group' => $customerGroup->fresh(),
        ]);
    }

    /**
     * Add multiple customers to group manually
     */
    public function addCustomers(Request $request, CustomerGroup $customerGroup): JsonResponse
    {
        $request->validate([
            'customer_ids' => ['required', 'array'],
            'customer_ids.*' => ['integer', 'exists:customers,id'],
        ]);

        $customerIds = $request->input('customer_ids');
        $customerGroup->customers()->syncWithoutDetaching($customerIds);
        $customerGroup->updateCustomerCount();

        return response()->json([
            'message' => 'Müşteriler gruba eklendi',
            'group' => $customerGroup->fresh(),
        ]);
    }
}
