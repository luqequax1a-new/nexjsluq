<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
            TaxDatabaseSeeder::class,
            CurrencySeeder::class,
            UnitSeeder::class,
            CategorySeeder::class,
            VariationSeeder::class,
            OptionSeeder::class,
            BrandSeeder::class,
            TagSeeder::class,
            AttributeSeeder::class,
            ShippingMethodSeeder::class,
            ProductSeeder::class,
            CartOfferSeeder::class,
        ]);
    }
}
