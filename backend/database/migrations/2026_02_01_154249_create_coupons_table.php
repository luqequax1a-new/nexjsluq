<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('name');
            $blueprint->string('code')->unique();
            $blueprint->enum('type', ['fixed', 'percentage'])->default('fixed');
            $blueprint->decimal('value', 10, 2);
            $blueprint->decimal('min_spend', 10, 2)->nullable();
            $blueprint->integer('usage_limit')->nullable();
            $blueprint->integer('usage_limit_per_customer')->nullable();
            $blueprint->integer('used_count')->default(0);
            $blueprint->dateTime('start_date')->nullable();
            $blueprint->dateTime('end_date')->nullable();
            $blueprint->boolean('is_active')->default(true);
            $blueprint->text('description')->nullable();
            $blueprint->timestamps();
            $blueprint->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
