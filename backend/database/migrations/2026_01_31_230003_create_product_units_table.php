<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('quantity_prefix')->nullable();
            $table->decimal('min', 12, 3)->default(0);
            $table->decimal('max', 12, 3)->nullable();
            $table->decimal('step', 12, 3)->default(1);
            $table->decimal('default_qty', 12, 3)->nullable();
            $table->text('info_top')->nullable();
            $table->text('info_bottom')->nullable();
            $table->string('price_prefix')->nullable();
            $table->string('stock_prefix')->nullable();
            $table->boolean('is_decimal_stock')->nullable();
            $table->timestamps();

            $table->index(['product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_units');
    }
};
