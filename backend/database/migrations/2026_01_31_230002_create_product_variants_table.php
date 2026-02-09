<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique(); // FleetCart-style unique identifier for this variant
            $table->string('uids')->nullable()->index(); // Combined variation value UIDs like "abc123.def456" for lookup
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('name')->nullable(); // Combined name like "Kırmızı / XL"
            $table->string('sku')->nullable();
            $table->string('gtin')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('special_price', 12, 2)->nullable(); // FleetCart naming
            $table->string('special_price_type')->nullable(); // fixed or percent
            $table->timestamp('special_price_start')->nullable();
            $table->timestamp('special_price_end')->nullable();
            $table->decimal('selling_price', 12, 2)->nullable(); // Computed final price
            $table->decimal('qty', 10, 3)->default(0); // Support decimal qty
            $table->boolean('allow_backorder')->default(false);
            $table->boolean('in_stock')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('position')->default(0);
            $table->json('values')->nullable(); // Stores variation value details for this variant
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['product_id', 'is_active']);
            $table->index(['product_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
