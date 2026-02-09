<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_offer_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_offer_id')->constrained('cart_offers')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->string('session_id')->nullable();
            $table->timestamp('used_at');
            $table->timestamps();
            
            // Indexes
            $table->index(['cart_offer_id', 'customer_id']);
            $table->index('used_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_offer_usage');
    }
};
