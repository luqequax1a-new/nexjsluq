<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variation_values', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique(); // FleetCart-style unique identifier
            $table->foreignId('variation_id')->constrained()->onDelete('cascade');
            $table->string('label');
            $table->string('value')->nullable(); // used for color hex code (FleetCart stores color here)
            $table->string('color')->nullable(); // explicit color field for clarity
            $table->string('image')->nullable(); // image path string for FleetCart compatibility
            $table->unsignedBigInteger('image_id')->nullable(); // FK to media table for image type
            $table->integer('position')->default(0);
            $table->timestamps();
            
            $table->foreign('image_id')->references('id')->on('media')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variation_values');
    }
};
