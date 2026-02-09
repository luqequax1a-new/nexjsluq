<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_offer_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_offer_id')->constrained('cart_offers')->onDelete('cascade');
            
            // Product
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->onDelete('set null');
            $table->boolean('allow_variant_selection')->default(false);
            
            // Discount
            $table->enum('discount_type', ['percentage', 'fixed', 'none'])->default('none');
            $table->enum('discount_base', ['selling_price', 'regular_price'])->default('selling_price');
            $table->decimal('discount_value', 10, 2)->default(0);
            
            // Display
            $table->integer('display_order')->default(0);
            
            // Condition (for chained offers)
            $table->enum('show_condition', ['always', 'if_accepted', 'if_rejected'])->default('always');
            
            $table->timestamps();
            
            // Indexes
            $table->index(['cart_offer_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_offer_products');
    }
};
