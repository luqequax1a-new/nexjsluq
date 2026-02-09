<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_offers', function (Blueprint $table) {
            $table->id();
            
            // Basic Info
            $table->string('name');
            $table->string('title', 500)->nullable();
            $table->text('description')->nullable();
            
            // Placement
            $table->enum('placement', ['cart', 'checkout', 'product_page', 'post_checkout'])->default('checkout');
            
            // Trigger
            $table->enum('trigger_type', ['all_products', 'specific_products', 'specific_categories', 'cart_total'])->default('all_products');
            $table->json('trigger_config')->nullable(); // {product_ids: [], category_ids: [], min_total: 0, max_total: 0}
            
            // Conditions
            $table->json('conditions')->nullable(); // {min_cart_total, max_cart_total, exclude_discounted, hide_if_in_cart}
            
            // Usage
            $table->integer('used_count')->default(0);
            
            // Dates
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            
            // Display
            $table->json('display_config')->nullable(); // {countdown_enabled, countdown_minutes, badge_color, badge_text}
            
            // Status
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['placement', 'is_active', 'priority']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_offers');
    }
};
