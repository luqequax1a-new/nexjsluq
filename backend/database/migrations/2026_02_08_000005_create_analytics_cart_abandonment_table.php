<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_cart_abandonment', function (Blueprint $table) {
            $table->id();
            
            // Cart Info
            $table->foreignId('cart_id')->constrained()->onDelete('cascade');
            $table->string('session_id', 100)->index();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            
            // Cart Details
            $table->integer('items_count')->default(0);
            $table->decimal('cart_value', 10, 2)->default(0);
            
            // Abandonment Stage
            $table->string('stage', 50)->default('cart'); // 'cart', 'checkout_info', 'checkout_shipping', 'checkout_payment'
            $table->text('last_url')->nullable();
            
            // Recovery
            $table->boolean('recovered')->default(false)->index();
            $table->timestamp('recovered_at')->nullable();
            $table->foreignId('recovered_order_id')->nullable()->constrained('orders')->onDelete('set null');
            
            // Email Reminder
            $table->boolean('reminder_sent')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['cart_id', 'created_at']);
            $table->index(['recovered', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_cart_abandonment');
    }
};
