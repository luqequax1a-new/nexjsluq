<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_searches', function (Blueprint $table) {
            $table->id();
            
            // Search Info
            $table->text('query');
            $table->string('session_id', 100)->index();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            
            // Results
            $table->integer('results_count')->default(0);
            $table->foreignId('clicked_product_id')->nullable()->constrained('products')->onDelete('set null');
            $table->integer('click_position')->nullable(); // Which position in results was clicked
            
            // Context
            $table->string('source', 50)->nullable(); // 'header_search', 'category_filter', 'autocomplete'
            $table->string('filters_applied', 255)->nullable(); // JSON string of applied filters
            
            $table->timestamp('created_at')->useCurrent();
            
            // Full-text search index on query
            $table->index('query');
            $table->index(['session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_searches');
    }
};
