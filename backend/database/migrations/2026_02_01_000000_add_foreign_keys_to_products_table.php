<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('sale_unit_id')->references('id')->on('units')->nullOnDelete();
            $table->foreign('product_unit_id')->references('id')->on('product_units')->nullOnDelete();
            $table->foreign('google_product_category_id')->references('id')->on('google_product_categories')->nullOnDelete();
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->foreign('tax_class_id')->references('id')->on('tax_classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['sale_unit_id']);
            $table->dropForeign(['product_unit_id']);
            $table->dropForeign(['google_product_category_id']);
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['tax_class_id']);
        });
    }
};
