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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('national_id', 11)->nullable()->after('phone'); // TC No
            $table->dropColumn(['company', 'tax_number', 'tax_office']);
        });

        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->string('tax_number')->nullable()->after('company');
            $table->string('tax_office')->nullable()->after('tax_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn(['tax_number', 'tax_office']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('national_id');
            $table->string('company')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('tax_office')->nullable();
        });
    }
};
