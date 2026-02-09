<?php

namespace Database\Seeders;

use App\Models\Variation;
use App\Models\VariationValue;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VariationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // PostgreSQL uyumlu temizlik
        // DB::statement('TRUNCATE TABLE variations RESTART IDENTITY CASCADE;'); // Eğer cascade gerekirse
        // Basitçe delete yapalım, daha güvenli
        VariationValue::query()->delete();
        Variation::query()->delete();
        
        $variations = [
            [
                'name' => 'Beden',
                'type' => 'text',
                'values' => [
                    ['label' => 'XS', 'position' => 1],
                    ['label' => 'S', 'position' => 2],
                    ['label' => 'M', 'position' => 3],
                    ['label' => 'L', 'position' => 4],
                    ['label' => 'XL', 'position' => 5],
                    ['label' => 'XXL', 'position' => 6],
                    ['label' => '3XL', 'position' => 7],
                ],
            ],
            [
                'name' => 'Renk',
                'type' => 'color',
                'values' => [
                    ['label' => 'Kırmızı', 'color' => '#ef4444', 'position' => 1],
                    ['label' => 'Mavi', 'color' => '#3b82f6', 'position' => 2],
                    ['label' => 'Yeşil', 'color' => '#22c55e', 'position' => 3],
                    ['label' => 'Sarı', 'color' => '#eab308', 'position' => 4],
                    ['label' => 'Siyah', 'color' => '#000000', 'position' => 5],
                    ['label' => 'Beyaz', 'color' => '#ffffff', 'position' => 6],
                    ['label' => 'Gri', 'color' => '#64748b', 'position' => 7],
                    ['label' => 'Turuncu', 'color' => '#f97316', 'position' => 8],
                    ['label' => 'Mor', 'color' => '#a855f7', 'position' => 9],
                    ['label' => 'Pembe', 'color' => '#ec4899', 'position' => 10],
                    ['label' => 'Lacivert', 'color' => '#1e3a8a', 'position' => 11],
                    ['label' => 'Bej', 'color' => '#f5f5dc', 'position' => 12],
                    ['label' => 'Haki', 'color' => '#556b2f', 'position' => 13],
                    ['label' => 'Bordo', 'color' => '#800000', 'position' => 14],
                    ['label' => 'Füme', 'color' => '#708090', 'position' => 15],
                    ['label' => 'Krem', 'color' => '#fffdd0', 'position' => 16],
                    ['label' => 'Kahverengi', 'color' => '#8b4513', 'position' => 17],
                    ['label' => 'Petrol', 'color' => '#006d6f', 'position' => 18],
                    ['label' => 'Pudra', 'color' => '#f4c2c2', 'position' => 19],
                    ['label' => 'Ekru', 'color' => '#f0ead6', 'position' => 20],
                ],
            ],
            [
                'name' => 'Kumaş Tipi',
                'type' => 'button',
                'values' => [
                    ['label' => 'Pamuk', 'position' => 1],
                    ['label' => 'Keten', 'position' => 2],
                    ['label' => 'İpek', 'position' => 3],
                    ['label' => 'Polyester', 'position' => 4],
                    ['label' => 'Yün', 'position' => 5],
                    ['label' => 'Viskon', 'position' => 6],
                    ['label' => 'Kadife', 'position' => 7],
                    ['label' => 'Saten', 'position' => 8],
                    ['label' => 'Şifon', 'position' => 9],
                    ['label' => 'Krep', 'position' => 10],
                    ['label' => 'Tafta', 'position' => 11],
                    ['label' => 'Denim', 'position' => 12],
                ],
            ],
            [
                'name' => 'Desen',
                'type' => 'image',
                'values' => [
                    ['label' => 'Düz', 'position' => 1],
                    ['label' => 'Çizgili', 'position' => 2],
                    ['label' => 'Kareli', 'position' => 3],
                    ['label' => 'Çiçekli', 'position' => 4],
                    ['label' => 'Puantiyeli', 'position' => 5],
                    ['label' => 'Geometrik', 'position' => 6],
                    ['label' => 'Jakarlı', 'position' => 7],
                    ['label' => 'Etnik', 'position' => 8],
                ],
            ],
            [
                'name' => 'Numara (Ayakkabı)',
                'type' => 'text',
                'values' => [
                    ['label' => '36', 'position' => 1],
                    ['label' => '37', 'position' => 2],
                    ['label' => '38', 'position' => 3],
                    ['label' => '39', 'position' => 4],
                    ['label' => '40', 'position' => 5],
                    ['label' => '41', 'position' => 6],
                    ['label' => '42', 'position' => 7],
                    ['label' => '43', 'position' => 8],
                    ['label' => '44', 'position' => 9],
                    ['label' => '45', 'position' => 10],
                ],
            ],
            [
                'name' => 'Kesim',
                'type' => 'button',
                'values' => [
                    ['label' => 'Slim Fit', 'position' => 1],
                    ['label' => 'Regular Fit', 'position' => 2],
                    ['label' => 'Relaxed Fit', 'position' => 3],
                    ['label' => 'Oversize', 'position' => 4],
                ],
            ],
            [
                'name' => 'Paket',
                'type' => 'dropdown',
                'values' => [
                    ['label' => 'Tekli', 'position' => 1],
                    ['label' => '2\'li Paket', 'position' => 2],
                    ['label' => '3\'lü Paket', 'position' => 3],
                    ['label' => '6\'lı Paket', 'position' => 4],
                    ['label' => '10\'lu Paket', 'position' => 5],
                ],
            ],
            [
                'name' => 'Kol Tipi',
                'type' => 'pill',
                'values' => [
                    ['label' => 'Kısa Kol', 'position' => 1],
                    ['label' => 'Uzun Kol', 'position' => 2],
                    ['label' => 'Askılı', 'position' => 3],
                    ['label' => 'Yarasa Kol', 'position' => 4],
                    ['label' => '3/4 Kol', 'position' => 5],
                ],
            ],
            [
                'name' => 'Yaka Tipi',
                'type' => 'radio',
                'values' => [
                    ['label' => 'Bisiklet Yaka', 'position' => 1],
                    ['label' => 'V Yaka', 'position' => 2],
                    ['label' => 'Hakim Yaka', 'position' => 3],
                    ['label' => 'Balıkçı Yaka', 'position' => 4],
                    ['label' => 'Polo Yaka', 'position' => 5],
                ],
            ],
            [
                'name' => 'Model Görünümü',
                'type' => 'image',
                'values' => [
                    ['label' => 'Model A', 'position' => 1],
                    ['label' => 'Model B', 'position' => 2],
                    ['label' => 'Model C', 'position' => 3],
                ],
            ],
            [
                'name' => 'En (cm)',
                'type' => 'button',
                'values' => [
                    ['label' => '80 cm', 'position' => 1],
                    ['label' => '100 cm', 'position' => 2],
                    ['label' => '120 cm', 'position' => 3],
                    ['label' => '140 cm', 'position' => 4],
                    ['label' => '150 cm', 'position' => 5],
                    ['label' => '160 cm', 'position' => 6],
                    ['label' => '180 cm', 'position' => 7],
                    ['label' => '200 cm', 'position' => 8],
                    ['label' => '240 cm', 'position' => 9],
                    ['label' => '280 cm', 'position' => 10],
                    ['label' => '300 cm', 'position' => 11],
                ],
            ],
            [
                'name' => 'Gramaj',
                'type' => 'dropdown',
                'values' => [
                    ['label' => '100 gr/m²', 'position' => 1],
                    ['label' => '150 gr/m²', 'position' => 2],
                    ['label' => '200 gr/m²', 'position' => 3],
                    ['label' => '250 gr/m²', 'position' => 4],
                    ['label' => '300 gr/m²', 'position' => 5],
                    ['label' => '350 gr/m²', 'position' => 6],
                    ['label' => '400 gr/m²', 'position' => 7],
                    ['label' => '500 gr/m²', 'position' => 8],
                ],
            ],
            [
                'name' => 'Uzunluk',
                'type' => 'button',
                'values' => [
                    ['label' => 'Kısa', 'position' => 1],
                    ['label' => 'Orta', 'position' => 2],
                    ['label' => 'Uzun', 'position' => 3],
                    ['label' => 'Maxi', 'position' => 4],
                ],
            ],
            [
                'name' => 'Perde Eni',
                'type' => 'button',
                'values' => [
                    ['label' => '100 cm', 'position' => 1],
                    ['label' => '150 cm', 'position' => 2],
                    ['label' => '200 cm', 'position' => 3],
                    ['label' => '250 cm', 'position' => 4],
                    ['label' => '280 cm', 'position' => 5],
                    ['label' => '300 cm', 'position' => 6],
                ],
            ],
            [
                'name' => 'Havlu Boyutu',
                'type' => 'pill',
                'values' => [
                    ['label' => '30x50 cm (El)', 'position' => 1],
                    ['label' => '50x90 cm (Yüz)', 'position' => 2],
                    ['label' => '70x140 cm (Banyo)', 'position' => 3],
                    ['label' => '100x150 cm (Plaj)', 'position' => 4],
                ],
            ],
        ];

        foreach ($variations as $vData) {
            $variation = Variation::create([
                'name' => $vData['name'],
                'type' => $vData['type'],
                'is_global' => true,
            ]);

            foreach ($vData['values'] as $valData) {
                $variation->values()->create($valData);
            }
        }
    }
}
