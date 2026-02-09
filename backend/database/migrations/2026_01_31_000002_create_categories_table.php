<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('slug')->unique();
            $table->string('image')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_searchable')->default(true);
            $table->integer('position')->default(0);
            $table->string('type')->default('normal'); // normal, dynamic
            $table->string('sort_by')->nullable();
            $table->enum('sort_order', ['asc', 'desc'])->default('asc');
            $table->boolean('manual_sort')->default(false);
            $table->json('faq_items')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('cascade');
            
            $table->index('slug');
            $table->index('parent_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
