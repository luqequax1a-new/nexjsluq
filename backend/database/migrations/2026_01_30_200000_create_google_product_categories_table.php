<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('google_product_categories');

        Schema::create('google_product_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('google_id')->unique()->comment('Google assigned numeric ID');
            $table->unsignedBigInteger('parent_google_id')->nullable()->index();
            $table->json('name')->comment('JSON for multilingual names: {"en": "...", "tr": "..."}');
            $table->json('full_path')->comment('JSON for full path string multilingual');
            $table->integer('level')->default(0)->index();
            $table->boolean('is_leaf')->default(true);
            $table->timestamps();
        });

        // NOTE: google_product_category_id column is now in create_products_table.php
    }

    public function down(): void
    {
        Schema::dropIfExists('google_product_categories');
    }
};
