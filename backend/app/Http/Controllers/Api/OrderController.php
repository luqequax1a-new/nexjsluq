<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderAddress;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\PostalCodeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:orders.index')->only(['index', 'show', 'statistics', 'options']);
        $this->middleware('permission:orders.create')->only(['store']);
        $this->middleware('permission:orders.edit')->only(['update', 'addNote']);
        $this->middleware('permission:orders.destroy')->only(['destroy']);
    }

    /**
     * List all orders with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer', 'items', 'billingAddress', 'shippingAddress']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_note', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->input('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $orders = $query->paginate($request->input('per_page', 20));

        // Add proper labels and customer order number
        $orders->getCollection()->transform(function ($order) {
            $order->status_label = $order->status_label;
            $order->payment_status_label = $order->payment_status_label;
            
            // Calculate customer order number (which order is this for the customer)
            if ($order->customer_id) {
                $order->customer_order_number = Order::where('customer_id', $order->customer_id)
                    ->where('status', '!=', 'cancelled')
                    ->where('created_at', '<=', $order->created_at)
                    ->count();
            } else {
                $order->customer_order_number = null;
            }
            
            return $order;
        });

        return response()->json($orders);
    }

    /**
     * Get basic statistics
     */
    public function statistics(): JsonResponse
    {
        $totalOrders = Order::count();
        $totalRevenue = Order::where('payment_status', 'paid')->sum('grand_total');
        $pendingOrders = Order::where('status', 'pending')->count();
        $todaysOrders = Order::whereDate('created_at', today())->count();

        return response()->json([
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'pending_orders' => $pendingOrders,
            'todays_orders' => $todaysOrders,
        ]);
    }

    public function options(): JsonResponse
    {
        return response()->json([
            'statuses' => Order::statusLabels(),
            'payment_statuses' => Order::paymentStatusLabels(),
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['customer', 'items.product', 'items.variant', 'billingAddress', 'shippingAddress', 'histories.user']);
        
        $order->status_label = $order->status_label;
        $order->payment_status_label = $order->payment_status_label;

        // Customer stats
        $customerStats = null;
        $customerOrders = [];
        
        if ($order->customer_id) {
            $customerStats = [
                'total_orders' => Order::where('customer_id', $order->customer_id)->where('status', '!=', 'cancelled')->count(),
                'total_spent' => Order::where('customer_id', $order->customer_id)->where('payment_status', 'paid')->sum('grand_total'),
                'customer_order_number' => Order::where('customer_id', $order->customer_id)
                    ->where('status', '!=', 'cancelled')
                    ->where('created_at', '<=', $order->created_at)
                    ->count(),
            ];

            $customerOrders = Order::where('customer_id', $order->customer_id)
                ->where('id', '!=', $order->id)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get()
                ->map(function ($o) {
                    $o->status_label = $o->status_label;
                    return $o;
                });
        }

        return response()->json([
            'order' => $order,
            'customer_stats' => $customerStats,
            'customer_orders' => $customerOrders,
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validStatuses = array_keys(Order::statusLabels());
        $validPaymentStatuses = array_keys(Order::paymentStatusLabels());

        $validated = $request->validate([
            'status' => ['sometimes', Rule::in($validStatuses)],
            'payment_status' => ['sometimes', Rule::in($validPaymentStatuses)],
            'address_id' => 'sometimes|exists:order_addresses,id',
            'admin_note' => 'nullable|string',
            'shipping_tracking_number' => 'nullable|string',
            'shipping_carrier' => 'nullable|string',
        ]);

        $oldStatus = $order->status;

        // Handle status change via the proper updateStatus method (handles stock, email, timestamps)
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $newStatus = $validated['status'];

            // Restore stock when cancelling a non-cancelled order
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                $order->load(['items.product', 'items.variant']);
                $order->restoreStock();
            }

            // Decrease stock if un-cancelling an order
            if ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                $order->load(['items.product', 'items.variant']);
                $order->decreaseStock();
            }

            $order->updateStatus($newStatus, null, auth()->id());
            unset($validated['status']);
        }

        // Handle payment status change
        if (isset($validated['payment_status']) && $validated['payment_status'] !== $order->payment_status) {
            $order->updatePaymentStatus($validated['payment_status'], null, auth()->id());
            unset($validated['payment_status']);
        }

        // Update remaining fields
        if (!empty($validated)) {
            $order->update($validated);
        }

        $order->load(['customer', 'items.product', 'items.variant', 'billingAddress', 'shippingAddress', 'histories.user']);

        return response()->json($order);
    }
    
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted successfully']);
    }

    public function addNote(Request $request, Order $order): JsonResponse
    {
        $request->validate(['note' => 'required|string']);
        
        $order->update(['admin_note' => $request->note]);
        
        return response()->json(['message' => 'Note added successfully']);
    }

    /**
     * Send manual message to customer
     */
    public function sendMessage(Request $request, Order $order, \App\Services\WhatsAppService $whatsAppService): JsonResponse
    {
        $request->validate([
            'channel' => 'required|in:whatsapp,email',
            'template' => 'required_if:channel,whatsapp',
        ]);

        if ($request->channel === 'whatsapp') {
            if (!$order->billingAddress && (!$order->customer || !$order->customer->phone)) {
                 return response()->json(['message' => 'Müşteri telefonu bulunamadı'], 400);
            }

            $phone = $order->billingAddress ? $order->billingAddress->phone : $order->customer->phone;
            
            // Remove leading + or 00
            $phone = preg_replace('/^(\+|00)/', '', $phone);

            // If template is custom text (not supported by direct template API without setup), handle it.
            // But usually this goes via template parameters.
            
            $result = $whatsAppService->sendTemplateMessage(
                $phone,
                $request->template,
                'tr'
            );
            
            if ($result === true) {
                 return response()->json(['message' => 'WhatsApp mesajı gönderildi']);
            }
            return response()->json(['message' => 'WhatsApp hatası: ' . $result], 500);
        }

        // Email Logic Placeholder
        return response()->json(['message' => 'Email gönderildi (Simülasyon)']);
    }
}
