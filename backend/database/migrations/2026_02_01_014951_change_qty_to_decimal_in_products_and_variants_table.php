<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // DEPRECATED: Columns already decimal in create_products_table.php and create_product_variants_table.php
    public function up(): void
    {
    }

    public function down(): void
    {
    }
};
