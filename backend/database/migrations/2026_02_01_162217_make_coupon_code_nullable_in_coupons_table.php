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
            // Make code nullable for automatic discounts
            $table->string('code')->nullable()->change();
            
            // Add BXGY (Buy X Get Y) fields
            $table->enum('discount_type', ['simple', 'bxgy', 'tiered'])->default('simple')->after('type');
            $table->integer('buy_quantity')->nullable()->after('discount_type');
            $table->integer('get_quantity')->nullable()->after('buy_quantity');
            $table->decimal('get_discount_percentage', 5, 2)->default(100)->nullable()->after('get_quantity');
            $table->json('buy_product_ids')->nullable()->after('get_discount_percentage');
            $table->json('get_product_ids')->nullable()->after('buy_product_ids');
            
            // Add combination and priority fields
            $table->boolean('can_combine_with_other_coupons')->default(false)->after('is_automatic');
            $table->boolean('can_combine_with_auto_discounts')->default(true)->after('can_combine_with_other_coupons');
            $table->integer('priority')->default(0)->after('can_combine_with_auto_discounts');
            
            // Add exclude fields for better filtering
            $table->json('exclude_product_ids')->nullable()->after('applies_to');
            $table->json('exclude_category_ids')->nullable()->after('exclude_product_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn([
                'discount_type',
                'buy_quantity',
                'get_quantity',
                'get_discount_percentage',
                'buy_product_ids',
                'get_product_ids',
                'can_combine_with_other_coupons',
                'can_combine_with_auto_discounts',
                'priority',
                'exclude_product_ids',
                'exclude_category_ids',
            ]);
            
            // Revert code to non-nullable
            $table->string('code')->nullable(false)->change();
        });
    }
};
