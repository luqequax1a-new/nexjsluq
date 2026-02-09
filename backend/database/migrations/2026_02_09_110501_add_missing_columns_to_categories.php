<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('categories', 'is_searchable')) {
                $table->boolean('is_searchable')->default(true);
            }
            if (!Schema::hasColumn('categories', 'position')) {
                $table->integer('position')->default(0);
            }
            if (!Schema::hasColumn('categories', 'sort_by')) {
                $table->string('sort_by')->nullable();
            }
            if (!Schema::hasColumn('categories', 'sort_order')) {
                $table->enum('sort_order', ['asc', 'desc'])->default('asc');
            }
            if (!Schema::hasColumn('categories', 'manual_sort')) {
                $table->boolean('manual_sort')->default(false);
            }
            if (!Schema::hasColumn('categories', 'faq_items')) {
                $table->json('faq_items')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $columns = ['description', 'is_active', 'is_searchable', 'position', 'sort_by', 'sort_order', 'manual_sort', 'faq_items'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('categories', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
