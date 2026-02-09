<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'allow_backorder')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->boolean('allow_backorder')->default(false)->after('qty');
            });
        }

        if (!Schema::hasColumn('product_variants', 'allow_backorder')) {
            Schema::table('product_variants', function (Blueprint $table): void {
                $table->boolean('allow_backorder')->default(false)->after('qty');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'allow_backorder')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('allow_backorder');
            });
        }

        if (Schema::hasColumn('product_variants', 'allow_backorder')) {
            Schema::table('product_variants', function (Blueprint $table): void {
                $table->dropColumn('allow_backorder');
            });
        }
    }
};
