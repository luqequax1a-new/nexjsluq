<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // DEPRECATED: Columns moved to create_products_table.php
    public function up(): void
    {
        // Columns now in main products migration
    }

    public function down(): void
    {
        // No-op
    }
};
