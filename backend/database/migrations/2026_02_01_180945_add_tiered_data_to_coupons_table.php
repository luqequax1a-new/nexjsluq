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
            if (!Schema::hasColumn('coupons', 'discount_type')) {
                $table->string('discount_type')->default('simple')->after('type'); // simple, bxgy, tiered
            }
            
            // BXGY
            if (!Schema::hasColumn('coupons', 'buy_quantity')) {
                $table->integer('buy_quantity')->nullable();
            }
            if (!Schema::hasColumn('coupons', 'get_quantity')) {
                $table->integer('get_quantity')->nullable();
            }
            if (!Schema::hasColumn('coupons', 'get_discount_percentage')) {
                $table->decimal('get_discount_percentage', 10, 2)->default(100);
            }
            if (!Schema::hasColumn('coupons', 'buy_product_ids')) {
                $table->json('buy_product_ids')->nullable();
            }
            if (!Schema::hasColumn('coupons', 'get_product_ids')) {
                $table->json('get_product_ids')->nullable();
            }
            
            // Combinations
            if (!Schema::hasColumn('coupons', 'can_combine_with_other_coupons')) {
                $table->boolean('can_combine_with_other_coupons')->default(false);
            }
            if (!Schema::hasColumn('coupons', 'can_combine_with_auto_discounts')) {
                $table->boolean('can_combine_with_auto_discounts')->default(true);
            }
            if (!Schema::hasColumn('coupons', 'priority')) {
                $table->integer('priority')->default(0);
            }

            // Excludes
            if (!Schema::hasColumn('coupons', 'exclude_product_ids')) {
                $table->json('exclude_product_ids')->nullable();
            }
            if (!Schema::hasColumn('coupons', 'exclude_category_ids')) {
                $table->json('exclude_category_ids')->nullable();
            }

            // Tiered
            if (!Schema::hasColumn('coupons', 'tiered_data')) {
                $table->json('tiered_data')->nullable(); // [{"min": 100, "discount": 10, "type": "percentage"}]
            }
        });

        if (!Schema::hasTable('coupon_customer_groups')) {
            Schema::create('coupon_customer_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
                $table->foreignId('customer_group_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not safe to drop shared columns in down if they existed before this migration
    }
};
