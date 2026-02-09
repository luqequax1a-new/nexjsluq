<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    /**
     * Dashboard Overview
     * GET /api/analytics/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'compare_with' => 'nullable|in:yesterday,last_week,last_month,last_year',
            'interval' => 'nullable|in:hour,day',
        ]);

        $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : Carbon::today();
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : Carbon::now();
        $compareWith = $data['compare_with'] ?? null;
        $interval = $data['interval'] ?? 'hour';

        return response()->json([
            'metrics' => $this->analyticsService->getMetrics($startDate, $endDate, $compareWith),
            'chart_data' => [
                'revenue' => $this->analyticsService->getChartData($startDate, $endDate, 'revenue', $interval),
                'orders' => $this->analyticsService->getChartData($startDate, $endDate, 'orders', $interval),
            ],
            'traffic_sources' => $this->analyticsService->getTrafficSources($startDate, $endDate),
            'top_products' => $this->analyticsService->getTopProducts($startDate, $endDate, 10),
            'growth_metrics' => $this->analyticsService->getGrowthMetrics($startDate, $endDate),
        ]);
    }

    /**
     * Top Selling Products (with variant support)
     * GET /api/analytics/top-products
     */
    public function topProducts(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:100',
            'type' => 'nullable|in:revenue,quantity',
        ]);

        $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : Carbon::today()->subDays(30);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : Carbon::now();
        $limit = $data['limit'] ?? 20;
        $type = $data['type'] ?? 'revenue';

        $products = $this->analyticsService->getTopProducts($startDate, $endDate, $limit, $type);

        return response()->json([
            'products' => $products,
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    /**
     * Top Selling Brands
     * GET /api/analytics/top-brands
     */
    public function topBrands(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : Carbon::today()->subDays(30);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : Carbon::now();
        $limit = $data['limit'] ?? 10;

        $brands = $this->analyticsService->getTopBrands($startDate, $endDate, $limit);

        return response()->json([
            'brands' => $brands,
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    /**
     * Top Selling Categories
     * GET /api/analytics/top-categories
     */
    public function topCategories(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : Carbon::today()->subDays(30);
        $endDate = isset($data['end_date']) ? Carbon::parse($data['end_date']) : Carbon::now();
        $limit = $data['limit'] ?? 10;

        $categories = $this->analyticsService->getTopCategories($startDate, $endDate, $limit);

        return response()->json([
            'categories' => $categories,
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }
}
