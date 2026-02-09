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
        Schema::create('options', function (Blueprint $table) {
            $table->id();
            // If product_id is null, it is a global "Template" option.
            // If product_id is set, it is a specific option belonging to that product.
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->string('name');
            $table->string('type'); // field, textarea, dropdown, checkbox, radio, date, file, etc.
            $table->boolean('is_required')->default(false);
            $table->boolean('is_global')->default(false); // True if it's a template
            $table->integer('position')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('options');
    }
};
