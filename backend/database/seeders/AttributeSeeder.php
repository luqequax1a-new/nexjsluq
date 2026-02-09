<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        // Temizlik
        DB::table('product_attribute_values')->delete();
        DB::table('product_attributes')->delete();
        DB::table('attribute_values')->delete();
        DB::table('attributes')->delete();
        DB::table('attribute_sets')->delete();

        $sets = [
            [
                'name' => 'Kumaş Özellikleri',
                'attributes' => [
                    [
                        'name' => 'Kumaş Tipi',
                        'values' => ['Pamuk', 'Keten', 'İpek', 'Polyester', 'Yün', 'Viskon', 'Kadife', 'Saten', 'Şifon', 'Krep', 'Denim', 'Tafta'],
                    ],
                    [
                        'name' => 'Kumaş Karışımı',
                        'values' => ['%100 Pamuk', '%100 Polyester', '%100 İpek', '%100 Viskon', 'Pamuk/Polyester', 'Pamuk/Elastan', 'Polyester/Viskon', 'Yün/Akrilik', 'Keten/Pamuk'],
                    ],
                    [
                        'name' => 'Kumaş Eni',
                        'values' => ['80 cm', '100 cm', '120 cm', '140 cm', '150 cm', '160 cm', '180 cm', '200 cm', '240 cm', '280 cm', '300 cm'],
                    ],
                    [
                        'name' => 'Gramaj',
                        'values' => ['80 gr/m²', '100 gr/m²', '120 gr/m²', '150 gr/m²', '200 gr/m²', '250 gr/m²', '300 gr/m²', '350 gr/m²', '400 gr/m²', '500 gr/m²'],
                    ],
                    [
                        'name' => 'Desen',
                        'values' => ['Düz', 'Çizgili', 'Kareli', 'Çiçekli', 'Puantiyeli', 'Geometrik', 'Jakarlı', 'Etnik', 'Kamuflaj', 'Batik'],
                    ],
                ],
            ],
            [
                'name' => 'Ürün Detayları',
                'attributes' => [
                    [
                        'name' => 'Menşei',
                        'values' => ['Türkiye', 'İtalya', 'Çin', 'Hindistan', 'Mısır', 'Japonya', 'Portekiz', 'Fransa'],
                    ],
                    [
                        'name' => 'Yıkama Talimatı',
                        'values' => ['30°C Yıkama', '40°C Yıkama', '60°C Yıkama', 'Elde Yıkama', 'Kuru Temizleme', 'Yıkamayın'],
                    ],
                    [
                        'name' => 'Ütüleme',
                        'values' => ['Düşük Isı', 'Orta Isı', 'Yüksek Isı', 'Ütülemeyin', 'Buharlı Ütü'],
                    ],
                    [
                        'name' => 'Kullanım Alanı',
                        'values' => ['Döşemelik', 'Perdelik', 'Giyimlik', 'Astar', 'Dekoratif', 'Yatak Örtüsü', 'Havlu', 'Masa Örtüsü'],
                    ],
                ],
            ],
            [
                'name' => 'Giyim Özellikleri',
                'attributes' => [
                    [
                        'name' => 'Cinsiyet',
                        'values' => ['Erkek', 'Kadın', 'Unisex', 'Çocuk'],
                    ],
                    [
                        'name' => 'Mevsim',
                        'values' => ['İlkbahar/Yaz', 'Sonbahar/Kış', '4 Mevsim'],
                    ],
                    [
                        'name' => 'Stil',
                        'values' => ['Günlük', 'Spor', 'Klasik', 'Şık/Gece', 'İş', 'Plaj'],
                    ],
                ],
            ],
        ];

        foreach ($sets as $setData) {
            $setId = DB::table('attribute_sets')->insertGetId([
                'name' => $setData['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($setData['attributes'] as $pos => $attrData) {
                $attrId = DB::table('attributes')->insertGetId([
                    'attribute_set_id' => $setId,
                    'name' => $attrData['name'],
                    'position' => $pos,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($attrData['values'] as $vPos => $value) {
                    DB::table('attribute_values')->insert([
                        'attribute_id' => $attrId,
                        'value' => $value,
                        'position' => $vPos,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
