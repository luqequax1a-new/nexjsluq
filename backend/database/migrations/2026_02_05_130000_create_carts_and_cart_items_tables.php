<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_total', 10, 2)->default(0);
            $table->decimal('shipping_total', 10, 2)->default(0);
            $table->decimal('discount_total', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->onDelete('set null');
            $table->decimal('coupon_discount', 10, 2)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->timestamps();
            
            $table->index(['customer_id', 'session_id']);
            $table->index(['user_id', 'session_id']);
            $table->index('session_id');
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('sale_unit_id')->nullable()->constrained('units')->onDelete('set null');
            $table->string('product_name');
            $table->string('product_sku');
            $table->decimal('quantity', 10, 3); // Decimal for metre, kg etc.
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->json('options')->nullable(); // Custom options like color, size
            $table->json('variant_values')->nullable(); // Variant combinations
            $table->unsignedBigInteger('cart_offer_id')->nullable();
            $table->json('offer_data')->nullable(); // {offer_id, offer_name, original_price, discount_amount, discount_type}
            $table->timestamps();
            
            $table->index(['cart_id', 'product_id']);
            $table->index(['cart_id', 'product_variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};
