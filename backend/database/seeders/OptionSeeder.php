<?php

namespace Database\Seeders;

use App\Models\Option;
use App\Models\OptionValue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Temizlik (PostgreSQL uyumlu)
        OptionValue::query()->delete();
        Option::query()->delete();

        $options = [
            [
                'name' => 'Garanti Süresi',
                'type' => 'dropdown',
                'is_required' => true,
                'values' => [
                    ['label' => 'Standart (2 Yıl)', 'price' => 0, 'price_type' => 'fixed', 'position' => 1],
                    ['label' => '+1 Yıl Ek Garanti', 'price' => 250, 'price_type' => 'fixed', 'position' => 2],
                    ['label' => '+3 Yıl Ek Garanti', 'price' => 600, 'price_type' => 'fixed', 'position' => 3],
                ],
            ],
            [
                'name' => 'Hediye Paketi',
                'type' => 'checkbox',
                'is_required' => false,
                'values' => [
                    ['label' => 'Hediye Paketi İstiyorum', 'price' => 25, 'price_type' => 'fixed', 'position' => 1],
                ],
            ],
            [
                'name' => 'Kişiye Özel İsim',
                'type' => 'text', // veya textarea
                'is_required' => false,
                'values' => [], // Text type has no predefined values
            ],
            [
                'name' => 'Kurulum Hizmeti',
                'type' => 'radio',
                'is_required' => true,
                'values' => [
                    ['label' => 'İstemiyorum', 'price' => 0, 'price_type' => 'fixed', 'position' => 1],
                    ['label' => 'Kurulum İstiyorum (+500 TL)', 'price' => 500, 'price_type' => 'fixed', 'position' => 2],
                ],
            ],
            [
                'name' => 'Hafıza Kapasitesi',
                'type' => 'dropdown', // Elektronik ürünler için örnek
                'is_required' => true,
                'values' => [
                    ['label' => '64 GB', 'price' => 0, 'price_type' => 'fixed', 'position' => 1],
                    ['label' => '128 GB', 'price' => 1000, 'price_type' => 'fixed', 'position' => 2],
                    ['label' => '256 GB', 'price' => 2500, 'price_type' => 'fixed', 'position' => 3],
                ],
            ],
        ];

        foreach ($options as $index => $optData) {
            $option = Option::create([
                'name' => $optData['name'],
                'type' => $optData['type'],
                'is_required' => $optData['is_required'],
                'is_global' => true,
                'product_id' => null,
                'position' => $index + 1,
            ]);

            if (isset($optData['values'])) {
                foreach ($optData['values'] as $valData) {
                    $option->values()->create($valData);
                }
            }
        }
    }
}
