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
        Schema::table('coupons', function (Blueprint $table) {
            $table->string('applies_to')->default('all'); // all, specific_products, specific_categories
            $table->string('min_requirement_type')->default('none'); // none, amount, quantity
            $table->decimal('min_requirement_value', 10, 2)->nullable();
            $table->string('customer_eligibility')->default('all'); // all, specific_groups, specific_customers
            $table->boolean('is_automatic')->default(false);
        });

        Schema::create('coupon_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->boolean('exclude')->default(false);
            $table->timestamps();
        });

        Schema::create('coupon_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->boolean('exclude')->default(false);
            $table->timestamps();
        });
        
        Schema::create('coupon_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_customers');
        Schema::dropIfExists('coupon_categories');
        Schema::dropIfExists('coupon_products');
        
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn([
                'applies_to',
                'min_requirement_type',
                'min_requirement_value',
                'customer_eligibility',
                'is_automatic'
            ]);
        });
    }
};
