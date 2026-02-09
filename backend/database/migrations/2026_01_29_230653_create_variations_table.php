<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variations', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique(); // FleetCart-style unique identifier
            $table->string('name');
            $table->string('type')->default('text'); // text, color, image
            $table->boolean('is_global')->default(true);
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variations');
    }
};
