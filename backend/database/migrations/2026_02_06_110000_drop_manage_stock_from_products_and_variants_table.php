<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'manage_stock')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('manage_stock');
            });
        }

        if (Schema::hasColumn('product_variants', 'manage_stock')) {
            Schema::table('product_variants', function (Blueprint $table): void {
                $table->dropColumn('manage_stock');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('products', 'manage_stock')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->boolean('manage_stock')->default(true);
            });
        }

        if (!Schema::hasColumn('product_variants', 'manage_stock')) {
            Schema::table('product_variants', function (Blueprint $table): void {
                $table->boolean('manage_stock')->default(true);
            });
        }
    }
};
