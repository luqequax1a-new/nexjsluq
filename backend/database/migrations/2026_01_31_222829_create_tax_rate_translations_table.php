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
        Schema::create('tax_rate_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_rate_id')->constrained()->cascadeOnDelete();
            $table->string('locale');
            $table->string('name');
            
            $table->unique(['tax_rate_id', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_rate_translations');
    }
};
