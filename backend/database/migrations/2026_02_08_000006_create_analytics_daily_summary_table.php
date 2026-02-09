<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_daily_summary', function (Blueprint $table) {
            $table->id();
            
            // Date
            $table->date('date')->unique();
            
            // Sales Metrics
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->decimal('avg_order_value', 10, 2)->default(0);
            $table->integer('total_items_sold')->default(0);
            
            // Traffic Metrics
            $table->integer('total_sessions')->default(0);
            $table->integer('total_pageviews')->default(0);
            $table->integer('unique_visitors')->default(0);
            $table->decimal('avg_session_duration', 8, 2)->default(0); // in seconds
            $table->decimal('bounce_rate', 5, 2)->default(0);
            
            // Conversion Metrics
            $table->decimal('conversion_rate', 5, 2)->default(0);
            $table->decimal('cart_abandonment_rate', 5, 2)->default(0);
            $table->integer('carts_created')->default(0);
            $table->integer('carts_abandoned')->default(0);
            $table->integer('carts_recovered')->default(0);
            
            // Product Metrics
            $table->integer('total_product_views')->default(0);
            $table->integer('unique_products_viewed')->default(0);
            $table->integer('total_searches')->default(0);
            $table->integer('unique_search_terms')->default(0);
            
            // Customer Metrics
            $table->integer('new_customers')->default(0);
            $table->integer('returning_customers')->default(0);
            $table->decimal('customer_acquisition_cost', 10, 2)->default(0);
            $table->decimal('customer_lifetime_value', 10, 2)->default(0);
            
            // Refund/Return Metrics
            $table->decimal('total_refunds', 10, 2)->default(0);
            $table->integer('refund_count')->default(0);
            $table->decimal('refund_rate', 5, 2)->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily_summary');
    }
};
