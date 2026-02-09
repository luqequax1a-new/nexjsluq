<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->boolean('is_primary')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->unique(['category_id', 'product_id']);
            $table->index('product_id');
            $table->index('is_primary');
            $table->index('position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_product');
    }
};
