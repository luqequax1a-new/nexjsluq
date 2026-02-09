<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Currency::create([
            'code' => 'TRY',
            'name' => 'Turkish Lira',
            'symbol' => '₺',
            'symbol_position' => 'left',
            'thousand_separator' => '.',
            'decimal_separator' => ',',
            'no_of_decimals' => 2,
            'exchange_rate' => 1.0000,
            'default' => true,
            'status' => true,
        ]);

        Currency::create([
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
            'symbol_position' => 'left',
            'thousand_separator' => ',',
            'decimal_separator' => '.',
            'no_of_decimals' => 2,
            'exchange_rate' => 30.0000, // Example rate
            'default' => false,
            'status' => true,
        ]);
        
        Currency::create([
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
            'symbol_position' => 'right',
            'thousand_separator' => '.',
            'decimal_separator' => ',',
            'no_of_decimals' => 2,
            'exchange_rate' => 33.0000, // Example rate
            'default' => false,
            'status' => true,
        ]);
    }
}
