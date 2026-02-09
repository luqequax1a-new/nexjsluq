<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_notify_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->string('email');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'email', 'sent_at']);
            $table->index(['variant_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_notify_requests');
    }
};
