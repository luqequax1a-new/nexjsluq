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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // USD, TRY
            $table->string('name'); // US Dollar, Turkish Lira
            $table->string('symbol'); // $, ₺
            $table->string('symbol_position')->default('left'); // left, right
            $table->string('thousand_separator')->default('.');
            $table->string('decimal_separator')->default(',');
            $table->integer('no_of_decimals')->default(2);
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->boolean('default')->default(false);
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
