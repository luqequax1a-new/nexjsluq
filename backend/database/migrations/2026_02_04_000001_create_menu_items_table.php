<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();

            $table->unsignedInteger('sort_order')->default(0);

            $table->string('type'); // url | category
            $table->json('label');

            $table->text('url')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();

            $table->string('target')->default('_self');
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['menu_id', 'parent_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
