<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            
            // Event Info
            $table->string('event_type', 50)->index(); // 'page_view', 'product_view', 'add_to_cart', 'purchase', etc.
            $table->string('session_id', 100)->index();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            
            // Event Data (JSON)
            $table->jsonb('event_data')->nullable();
            
            // Context
            $table->text('url')->nullable();
            $table->text('referrer')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable(); // IPv4 or IPv6
            
            // Device Info
            $table->string('device_type', 20)->nullable()->index(); // 'desktop', 'mobile', 'tablet'
            $table->string('browser', 50)->nullable();
            $table->string('os', 50)->nullable();
            
            // Location
            $table->string('country', 2)->nullable()->index();
            $table->string('city', 100)->nullable();
            
            // Timestamps
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes for performance
            $table->index(['event_type', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
