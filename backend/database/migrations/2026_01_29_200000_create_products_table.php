<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->nullable();
            $table->string('gtin')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->decimal('special_price', 12, 2)->nullable();
            $table->string('special_price_type')->nullable();
            $table->timestamp('special_price_start')->nullable();
            $table->timestamp('special_price_end')->nullable();
            $table->timestamp('discount_start')->nullable();
            $table->timestamp('discount_end')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_active')->default(true);
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->boolean('list_variants_separately')->default(false);
            $table->decimal('qty', 15, 3)->default(0);
            $table->boolean('allow_backorder')->default(false);
            $table->boolean('in_stock')->default(true);
            $table->unsignedBigInteger('sale_unit_id')->nullable();
            $table->string('unit_type')->nullable();
            $table->unsignedBigInteger('product_unit_id')->nullable();
            $table->boolean('show_unit_pricing')->default(false);
            $table->unsignedBigInteger('google_product_category_id')->nullable();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->unsignedBigInteger('tax_class_id')->nullable();
            $table->string('redirect_type')->nullable()->default('404'); // 404, 410, 301-category, 302-category, 301-product, 302-product
            $table->unsignedBigInteger('redirect_target_id')->nullable();
            // NOTE: Foreign keys added in separate migration after all referenced tables exist
            $table->timestamps();

            $table->index('brand_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
