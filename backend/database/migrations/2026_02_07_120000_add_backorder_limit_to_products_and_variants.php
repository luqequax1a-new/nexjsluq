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
        Schema::table('products', function (Blueprint $table) {
            $table->integer('backorder_limit')->default(0)->after('allow_backorder');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->integer('backorder_limit')->default(0)->after('allow_backorder');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('backorder_limit');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('backorder_limit');
        });
    }
};
