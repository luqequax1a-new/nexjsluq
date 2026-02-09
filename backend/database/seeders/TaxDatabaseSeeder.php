<?php

namespace Database\Seeders;

use App\Models\TaxClass;
use Illuminate\Database\Seeder;

class TaxDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Standard Tax Class
        $standard = TaxClass::create([
            'based_on' => 'shipping_address',
        ]);
        
        $standard->translations()->create([
            'locale' => 'en',
            'label' => 'Standard Tax',
        ]);
        
        $standard->translations()->create([
            'locale' => 'tr',
            'label' => 'Standart Vergi',
        ]);
        
        // Add a default rate (e.g. 20% VAT for TR)
        $rate = $standard->taxRates()->create([
            'country' => 'TR',
            'state' => '*',
            'city' => '*',
            'zip' => '*',
            'rate' => 20.0000,
            'position' => 1,
        ]);
        
        $rate->translations()->create([
            'locale' => 'en',
            'name' => 'VAT',
        ]);
        
        $rate->translations()->create([
            'locale' => 'tr',
            'name' => 'KDV',
        ]);
        
        // Reduced Tax Class (e.g. for food)
        $reduced = TaxClass::create([
            'based_on' => 'shipping_address',
        ]);
        
        $reduced->translations()->create([
            'locale' => 'en',
            'label' => 'Reduced Tax',
        ]);
        
        $reduced->translations()->create([
            'locale' => 'tr',
            'label' => 'İndirimli Vergi',
        ]);
        
        $reducedRate = $reduced->taxRates()->create([
            'country' => 'TR',
            'state' => '*',
            'city' => '*',
            'zip' => '*',
            'rate' => 1.0000,
            'position' => 1,
        ]);
        
        $reducedRate->translations()->create([
            'locale' => 'en',
            'name' => 'VAT',
        ]);
        
        $reducedRate->translations()->create([
            'locale' => 'tr',
            'name' => 'KDV',
        ]);
    }
}
