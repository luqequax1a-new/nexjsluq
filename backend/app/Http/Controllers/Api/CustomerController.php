<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Services\PostalCodeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:customers.index')->only(['index', 'show', 'search', 'groups']);
        $this->middleware('permission:customers.create')->only(['store']);
        $this->middleware('permission:customers.edit')->only(['update', 'addAddress', 'updateAddress', 'deleteAddress']);
        $this->middleware('permission:customers.destroy')->only(['destroy']);
        $this->middleware('permission:customers.statistics')->only(['statistics']);
    }

    /**
     * List all customers with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::withCount('orders')
            ->with('addresses');

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
                  ->orWhere('national_id', 'ilike', "%{$search}%");
            });
        }

        // Group filter
        if ($group = $request->input('group')) {
            $query->where('group', $group);
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->input('per_page', 20);
        $customers = $query->paginate($perPage);

        return response()->json($customers);
    }

    /**
     * Get single customer with details
     */
    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['addresses', 'orders' => function ($q) {
            $q->latest()->limit(10);
        }]);

        return response()->json($customer);
    }

    /**
     * Create new customer
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'size:11'],
            'group' => ['nullable', Rule::in(['normal', 'vip', 'wholesale'])],
            'notes' => ['nullable', 'string'],
            
            // Optional initial address
            'address' => ['nullable', 'array'],
            'address.title' => ['nullable', 'string'],
            'address.first_name' => ['required_with:address', 'string'],
            'address.last_name' => ['required_with:address', 'string'],
            'address.address_line_1' => ['required_with:address', 'string'],
            'address.city' => ['required_with:address', 'string'],
            'address.state' => ['nullable', 'string'],
        ]);

        try {
            DB::beginTransaction();

            $customer = Customer::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'group' => $validated['group'] ?? 'normal',
                'notes' => $validated['notes'] ?? null,
            ]);

            // Create initial address if provided
            if (!empty($validated['address'])) {
                $addressData = $validated['address'];
                $customer->addresses()->create([
                    ...$addressData,
                    'address_line_2' => null,
                    'postal_code' => PostalCodeResolver::resolve(
                        $addressData['city'] ?? null,
                        $addressData['state'] ?? null
                    ),
                    'is_default_billing' => true,
                    'is_default_shipping' => true,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Müşteri başarıyla oluşturuldu',
                'customer' => $customer->load('addresses'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Müşteri oluşturulurken hata oluştu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update customer
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:20'],
            'group' => ['nullable', Rule::in(['normal', 'vip', 'wholesale'])],
            'notes' => ['nullable', 'string'],
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Müşteri güncellendi',
            'customer' => $customer->fresh(['addresses']),
        ]);
    }

    /**
     * Delete customer (soft delete)
     */
    public function destroy(Customer $customer): JsonResponse
    {
        // Check for active orders
        if ($customer->orders()->whereNotIn('status', ['delivered', 'cancelled', 'refunded'])->exists()) {
            return response()->json([
                'message' => 'Aktif siparişi olan müşteri silinemez',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Müşteri silindi',
        ]);
    }

    /**
     * Add address to customer
     */
    public function addAddress(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:100'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:individual,corporate'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:50'],
            'tax_office' => ['nullable', 'string', 'max:255'],
            'address_line_1' => ['required', 'string'],
            'city' => ['required', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:2'],
            'is_default_billing' => ['boolean'],
            'is_default_shipping' => ['boolean'],
        ]);

        $validated['address_line_2'] = null;
        $validated['postal_code'] = PostalCodeResolver::resolve(
            $validated['city'] ?? null,
            $validated['state'] ?? null
        );

        // Reset other defaults if this is default
        if ($validated['is_default_billing'] ?? false) {
            $customer->addresses()->update(['is_default_billing' => false]);
        }
        if ($validated['is_default_shipping'] ?? false) {
            $customer->addresses()->update(['is_default_shipping' => false]);
        }

        $address = $customer->addresses()->create($validated);

        return response()->json([
            'message' => 'Adres eklendi',
            'address' => $address,
        ], 201);
    }

    /**
     * Update customer address
     */
    public function updateAddress(Request $request, Customer $customer, CustomerAddress $address): JsonResponse
    {
        // Ensure address belongs to customer
        if ($address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Adres bulunamadı'], 404);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:100'],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:individual,corporate'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:50'],
            'tax_office' => ['nullable', 'string', 'max:255'],
            'address_line_1' => ['sometimes', 'string'],
            'city' => ['sometimes', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:2'],
            'is_default_billing' => ['boolean'],
            'is_default_shipping' => ['boolean'],
        ]);

        $city = $validated['city'] ?? $address->city;
        $state = array_key_exists('state', $validated) ? $validated['state'] : $address->state;
        $validated['address_line_2'] = null;
        $validated['postal_code'] = PostalCodeResolver::resolve($city, $state);

        // Reset other defaults if this is default
        if ($validated['is_default_billing'] ?? false) {
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default_billing' => false]);
        }
        if ($validated['is_default_shipping'] ?? false) {
            $customer->addresses()->where('id', '!=', $address->id)->update(['is_default_shipping' => false]);
        }

        $address->update($validated);

        return response()->json([
            'message' => 'Adres güncellendi',
            'address' => $address->fresh(),
        ]);
    }

    /**
     * Delete customer address
     */
    public function deleteAddress(Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            return response()->json(['message' => 'Adres bulunamadı'], 404);
        }

        $address->delete();

        return response()->json([
            'message' => 'Adres silindi',
        ]);
    }

    /**
     * Get customer order history
     */
    public function orders(Request $request, Customer $customer): JsonResponse
    {
        $orders = $customer->orders()
            ->with(['items'])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 10));

        return response()->json($orders);
    }

    /**
     * Search customers (for autocomplete)
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->input('q', '');
        
        $customers = Customer::where('is_active', true)
            ->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            })
            ->with('addresses')
            ->limit(20)
            ->get();

        return response()->json($customers);
    }

    /**
     * Get customer groups
     */
    public function groups(): JsonResponse
    {
        return response()->json(Customer::groupLabels());
    }

    /**
     * Get customer statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_customers' => Customer::count(),
            'active_customers' => Customer::where('is_active', true)->count(),
            'new_this_month' => Customer::whereMonth('created_at', now()->month)->count(),
            'vip_customers' => Customer::where('group', 'vip')->count(),
            'wholesale_customers' => Customer::where('group', 'wholesale')->count(),
            'with_orders' => Customer::has('orders')->count(),
            'average_order_value' => Customer::whereHas('orders')->avg('total_spent'),
            'group_breakdown' => Customer::selectRaw('group, count(*) as count')
                ->groupBy('group')
                ->pluck('count', 'group'),
        ];

        return response()->json($stats);
    }
    /**
     * Get statistics for a single customer
     */
    public function customerStats(Customer $customer): JsonResponse
    {
        $totalOrders = $customer->orders()
            ->where('status', '!=', 'cancelled')
            ->count();
            
        $totalSpent = $customer->orders()
            ->where('status', '!=', 'cancelled')
            ->sum('grand_total');
            
        $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;
        
        $lastOrder = $customer->orders()
            ->where('status', '!=', 'cancelled')
            ->latest()
            ->first();
            
        return response()->json([
            'total_orders' => $totalOrders,
            'total_spent' => (float) $totalSpent,
            'avg_order_value' => (float) $avgOrderValue,
            'last_order_date' => $lastOrder ? $lastOrder->created_at : null,
        ]);
    }
}
