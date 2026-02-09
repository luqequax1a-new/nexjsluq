<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!DB::table('units')->exists()) {
            DB::table('units')->insert([
                [
                    'name' => 'Kilogram',
                    'min' => 0,
                    'step' => 1,
                    'is_decimal_stock' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Gram',
                    'min' => 0,
                    'step' => 1,
                    'is_decimal_stock' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Metre',
                    'min' => 0,
                    'step' => 0.1,
                    'is_decimal_stock' => true,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Santimetre',
                    'min' => 0,
                    'step' => 1,
                    'is_decimal_stock' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Litre',
                    'min' => 0,
                    'step' => 0.1,
                    'is_decimal_stock' => true,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                
            
            ]);
        }
    }

    public function down(): void
    {
        // Intentionally left blank.
        // Default units are data; not automatically removed on rollback.
    }
};
