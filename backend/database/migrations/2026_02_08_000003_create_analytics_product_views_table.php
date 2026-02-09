<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_product_views', function (Blueprint $table) {
            $table->id();
            
            // Product Info
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->references('id')->on('product_variants')->onDelete('set null');
            
            // Session Info
            $table->string('session_id', 100)->index();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            
            // View Details
            $table->integer('duration_seconds')->nullable(); // How long they viewed
            $table->boolean('added_to_cart')->default(false);
            $table->boolean('purchased')->default(false);
            
            // Context
            $table->text('referrer')->nullable();
            $table->string('source', 50)->nullable();
            
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes for analytics queries
            $table->index(['product_id', 'created_at']);
            $table->index(['variant_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_product_views');
    }
};
