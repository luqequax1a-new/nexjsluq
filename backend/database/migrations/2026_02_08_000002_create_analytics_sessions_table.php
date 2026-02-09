<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_sessions', function (Blueprint $table) {
            $table->id();
            
            // Session Info
            $table->string('session_id', 100)->unique();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            
            // Session Timing
            $table->timestamp('started_at')->index();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->integer('page_views')->default(0);
            
            // Traffic Source
            $table->string('source', 50)->nullable()->index(); // 'organic', 'paid_social', 'social', 'direct', 'email', 'referral'
            $table->string('medium', 50)->nullable();
            $table->string('campaign', 100)->nullable();
            $table->string('utm_source', 100)->nullable();
            $table->string('utm_medium', 100)->nullable();
            $table->string('utm_campaign', 100)->nullable();
            
            // Landing & Exit Pages
            $table->text('landing_page')->nullable();
            $table->text('exit_page')->nullable();
            
            // Device Info
            $table->string('device_type', 20)->nullable()->index();
            $table->string('browser', 50)->nullable();
            $table->string('os', 50)->nullable();
            
            // Location
            $table->string('country', 2)->nullable()->index();
            $table->string('city', 100)->nullable();
            
            // Conversion
            $table->boolean('converted')->default(false)->index();
            $table->decimal('conversion_value', 10, 2)->nullable();
            
            $table->timestamps();
            
            // Composite indexes
            $table->index(['source', 'started_at']);
            $table->index(['converted', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_sessions');
    }
};
