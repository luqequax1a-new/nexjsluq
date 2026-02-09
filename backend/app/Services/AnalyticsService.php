<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get dashboard metrics with comparison
     */
    public function getMetrics(string|Carbon $startDate, string|Carbon $endDate, ?string $compareWith = null): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $current = $this->calculateMetrics($start, $end);
        
        if ($compareWith) {
            $previous = $this->getPreviousPeriod($start, $end, $compareWith);
            $current['comparison'] = $this->calculateComparison($current, $previous);
        }

        return $current;
    }

    /**
     * Calculate metrics for a period
     */
    private function calculateMetrics(Carbon $start, Carbon $end): array
    {
        // Sales metrics
        $orders = Order::whereBetween('created_at', [$start, $end])
            ->where('status', '!=', 'cancelled');

        $totalRevenue = (clone $orders)->sum('grand_total');
        $totalOrders = (clone $orders)->count();
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Refunds
        $refunds = Order::whereBetween('created_at', [$start, $end])
            ->where('status', 'refunded');
        $totalRefunds = (clone $refunds)->sum('grand_total');
        $refundCount = (clone $refunds)->count();

        // Sessions (placeholder - will be implemented with analytics_sessions)
        $totalSessions = 0; // TODO: Implement with analytics_sessions
        $conversionRate = $totalSessions > 0 ? ($totalOrders / $totalSessions) * 100 : 0;

        return [
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'avg_order_value' => round($avgOrderValue, 2),
            'total_refunds' => round($totalRefunds, 2),
            'refund_count' => $refundCount,
            'refund_rate' => $totalOrders > 0 ? round(($refundCount / $totalOrders) * 100, 2) : 0,
            'conversion_rate' => round($conversionRate, 2),
            'total_sessions' => $totalSessions,
        ];
    }

    /**
     * Get chart data for analytics visualization
     */
    public function getChartData(string|Carbon $startDate, string|Carbon $endDate, string $metric = 'revenue', string $interval = 'hour'): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $query = Order::whereBetween('created_at', [$start, $end])
            ->where('status', '!=', 'cancelled');

        if ($interval === 'hour') {
            $data = $query->select(
                DB::raw('EXTRACT(HOUR FROM created_at) as hour'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

            // Fill missing hours with zeros
            $result = collect(range(0, 23))->map(function ($hour) use ($data, $metric) {
                $item = $data->firstWhere('hour', $hour);
                return [
                    'label' => sprintf('%02d:00', $hour),
                    'value' => $item ? ($metric === 'revenue' ? (float)$item->revenue : (int)$item->order_count) : 0,
                ];
            });
        } else {
            // Daily interval
            $data = $query->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

            $result = [];
            $current = $start->copy();
            while ($current->lte($end)) {
                $dateStr = $current->format('Y-m-d');
                $item = $data->firstWhere('date', $dateStr);
                $result[] = [
                    'label' => $current->format('M d'),
                    'value' => $item ? ($metric === 'revenue' ? (float)$item->revenue : (int)$item->order_count) : 0,
                ];
                $current->addDay();
            }
        }

        return $result->toArray();
    }

    /**
     * Get top selling products with VARIANT SUPPORT and UNIT awareness
     * This is the key method for showing variants separately
     */
    public function getTopProducts(string|Carbon $startDate, string|Carbon $endDate, int $limit = 20, string $type = 'revenue'): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $cacheKey = "analytics:top_products:{$start->format('Y-m-d')}:{$end->format('Y-m-d')}:{$limit}:{$type}";

        return Cache::remember($cacheKey, 300, function () use ($start, $end, $limit, $type) {
            // Get order items with product and variant info
            $query = OrderItem::query()
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->leftJoin('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
                ->leftJoin('units', 'products.sale_unit_id', '=', 'units.id')
                ->whereBetween('orders.created_at', [$start, $end])
                ->where('orders.status', '!=', 'cancelled')
                ->select(
                    'order_items.product_id',
                    'order_items.product_variant_id',
                    'products.name as product_name',
                    'products.sku as product_sku',
                    'product_variants.name as variant_name',
                    'product_variants.sku as variant_sku',
                    'units.name as unit_name',
                    DB::raw('SUM(order_items.quantity) as total_quantity'),
                    DB::raw('SUM(order_items.line_total) as total_revenue'),
                    DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                    DB::raw('AVG(order_items.unit_price) as avg_price')
                );

            // Group by product AND variant (this is key for showing variants separately)
            $query->groupBy(
                'order_items.product_id',
                'order_items.product_variant_id',
                'products.name',
                'products.sku',
                'product_variants.name',
                'product_variants.sku',
                'units.name'
            );

            // Order by revenue or quantity
            if ($type === 'revenue') {
                $query->orderByDesc('total_revenue');
            } else {
                $query->orderByDesc('total_quantity');
            }

            $results = $query->limit($limit)->get();

            return $results->map(function ($item) {
                // Build display name with variant
                $displayName = $item->product_name;
                if ($item->variant_name) {
                    $displayName .= ' - ' . $item->variant_name;
                }

                // Format quantity with unit
                $quantityDisplay = number_format($item->total_quantity, 2);
                if ($item->unit_name) {
                    $quantityDisplay .= ' ' . $item->unit_name;
                }

                return [
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'name' => $displayName,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'sku' => $item->variant_sku ?? $item->product_sku,
                    'total_quantity' => (float)$item->total_quantity,
                    'quantity_display' => $quantityDisplay,
                    'unit_name' => $item->unit_name,
                    'total_revenue' => round((float)$item->total_revenue, 2),
                    'order_count' => (int)$item->order_count,
                    'avg_price' => round((float)$item->avg_price, 2),
                ];
            })->toArray();
        });
    }

    /**
     * Get top selling brands
     */
    public function getTopBrands(string|Carbon $startDate, string|Carbon $endDate, int $limit = 10): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $results = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('brands', 'products.brand_id', '=', 'brands.id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'brands.id',
                'brands.name',
                'brands.slug',
                DB::raw('SUM(order_items.line_total) as total_sales'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                DB::raw('COUNT(DISTINCT order_items.product_id) as product_count')
            )
            ->groupBy('brands.id', 'brands.name', 'brands.slug')
            ->orderByDesc('total_sales')
            ->limit($limit)
            ->get();

        return $results->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'total_sales' => round((float)$item->total_sales, 2),
                'order_count' => (int)$item->order_count,
                'product_count' => (int)$item->product_count,
            ];
        })->toArray();
    }

    /**
     * Get top selling categories
     */
    public function getTopCategories(string|Carbon $startDate, string|Carbon $endDate, int $limit = 10): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $results = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('category_product', 'products.id', '=', 'category_product.product_id')
            ->join('categories', 'category_product.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'categories.id',
                'categories.name',
                'categories.slug',
                DB::raw('SUM(order_items.line_total) as total_sales'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
                DB::raw('COUNT(DISTINCT order_items.product_id) as product_count')
            )
            ->groupBy('categories.id', 'categories.name', 'categories.slug')
            ->orderByDesc('total_sales')
            ->limit($limit)
            ->get();

        $totalSales = $results->sum('total_sales');

        return $results->map(function ($item) use ($totalSales) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'total_sales' => round((float)$item->total_sales, 2),
                'order_count' => (int)$item->order_count,
                'product_count' => (int)$item->product_count,
                'percentage' => $totalSales > 0 ? round(((float)$item->total_sales / $totalSales) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get traffic sources
     */
    public function getTrafficSources(string|Carbon $startDate, string|Carbon $endDate): array
    {
        // Placeholder - will be implemented with analytics_sessions
        return [
            ['source' => 'Organik Arama', 'sessions' => 0, 'percentage' => 0],
            ['source' => 'Sosyal Medya', 'sessions' => 0, 'percentage' => 0],
            ['source' => 'Ücretli Sosyal Medya', 'sessions' => 0, 'percentage' => 0],
            ['source' => 'Direkt', 'sessions' => 0, 'percentage' => 0],
        ];
    }

    /**
     * Get growth metrics
     */
    public function getGrowthMetrics(string|Carbon $startDate, string|Carbon $endDate): array
    {
        $start = $startDate instanceof Carbon ? $startDate : Carbon::parse($startDate);
        $end = $endDate instanceof Carbon ? $endDate : Carbon::parse($endDate);

        $orders = Order::whereBetween('created_at', [$start, $end])
            ->where('status', '!=', 'cancelled');

        $refundedOrders = (clone $orders)->where('status', 'refunded')->count();
        $totalOrders = (clone $orders)->count();
        $refundRate = $totalOrders > 0 ? ($refundedOrders / $totalOrders) * 100 : 0;

        // Repeat purchase rate
        $repeatCustomers = Customer::whereHas('orders', function ($q) use ($start, $end) {
            $q->whereBetween('created_at', [$start, $end])
              ->where('status', '!=', 'cancelled');
        }, '>=', 2)->count();

        $totalCustomers = Customer::whereHas('orders', function ($q) use ($start, $end) {
            $q->whereBetween('created_at', [$start, $end])
              ->where('status', '!=', 'cancelled');
        })->count();

        $repeatRate = $totalCustomers > 0 ? ($repeatCustomers / $totalCustomers) * 100 : 0;

        return [
            'refund_rate' => round($refundRate, 2),
            'repeat_purchase_rate' => round($repeatRate, 2),
        ];
    }

    /**
     * Calculate comparison between periods
     */
    private function calculateComparison(array $current, array $previous): array
    {
        $comparison = [];
        foreach ($current as $key => $value) {
            if (is_numeric($value) && isset($previous[$key])) {
                $prevValue = $previous[$key];
                if ($prevValue > 0) {
                    $change = (($value - $prevValue) / $prevValue) * 100;
                    $comparison[$key] = [
                        'change' => round($change, 2),
                        'trend' => $change > 0 ? 'up' : ($change < 0 ? 'down' : 'neutral'),
                    ];
                }
            }
        }
        return $comparison;
    }

    /**
     * Get previous period for comparison
     */
    private function getPreviousPeriod(Carbon $start, Carbon $end, string $compareWith): array
    {
        $diff = $start->diffInDays($end) + 1;
        
        switch ($compareWith) {
            case 'yesterday':
                $prevStart = $start->copy()->subDay();
                $prevEnd = $end->copy()->subDay();
                break;
            case 'last_week':
                $prevStart = $start->copy()->subWeek();
                $prevEnd = $end->copy()->subWeek();
                break;
            case 'last_month':
                $prevStart = $start->copy()->subMonth();
                $prevEnd = $end->copy()->subMonth();
                break;
            case 'last_year':
                $prevStart = $start->copy()->subYear();
                $prevEnd = $end->copy()->subYear();
                break;
            default:
                $prevStart = $start->copy()->subDays($diff);
                $prevEnd = $start->copy()->subDay();
        }

        return $this->calculateMetrics($prevStart, $prevEnd);
    }
}
