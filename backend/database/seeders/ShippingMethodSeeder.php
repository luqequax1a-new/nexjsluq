<?php

namespace Database\Seeders;

use App\Models\ShippingMethod;
use Illuminate\Database\Seeder;

class ShippingMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'code' => 'aras',
                'name' => 'Aras Kargo',
                'base_rate' => 75.00,
                'free_threshold' => 1000.00,
                'cod_enabled' => true,
                'cod_fee' => 15.00,
                'position' => 1,
            ],
            [
                'code' => 'yurtici',
                'name' => 'Yurtiçi Kargo',
                'base_rate' => 85.00,
                'free_threshold' => 1500.00,
                'cod_enabled' => true,
                'cod_fee' => 20.00,
                'position' => 2,
            ],
            [
                'code' => 'mng',
                'name' => 'MNG Kargo',
                'base_rate' => 70.00,
                'free_threshold' => 800.00,
                'cod_enabled' => false,
                'cod_fee' => 0.00,
                'position' => 3,
            ],
            [
                'code' => 'pickup',
                'name' => 'Mağazadan Teslimat',
                'base_rate' => 0.00,
                'free_threshold' => 0.00,
                'cod_enabled' => false,
                'cod_fee' => 0.00,
                'position' => 4,
            ],
        ];

        foreach ($methods as $method) {
            ShippingMethod::updateOrCreate(['code' => $method['code']], $method);
        }
    }
}
