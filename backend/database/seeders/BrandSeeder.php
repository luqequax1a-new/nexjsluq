<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            [
                'name' => 'Kayalar Kumaş',
                'slug' => 'kayalar-kumas',
                'meta_title' => 'Kayalar Kumaş - Kaliteli Ev Tekstili',
                'meta_description' => 'Kayalar Kumaş, ev tekstili ve döşemelik kumaş konusunda uzman markadır.',
            ],
            [
                'name' => 'Evim Home',
                'slug' => 'evim-home',
                'meta_title' => 'Evim Home - Modern Ev Tekstili',
                'meta_description' => 'Evim Home ile evinize modern ve şık dokunuşlar katın.',
            ],
            [
                'name' => 'Lüks Perde',
                'slug' => 'luks-perde',
                'meta_title' => 'Lüks Perde - Premium Perde Çözümleri',
                'meta_description' => 'Lüks Perde ile evinize zarif ve kaliteli perde modelleri.',
            ],
            [
                'name' => 'Tekstil Dünyası',
                'slug' => 'tekstil-dunyasi',
                'meta_title' => 'Tekstil Dünyası - Geniş Ürün Yelpazesi',
                'meta_description' => 'Tekstil Dünyası ile her türlü kumaş ihtiyacınızı karşılayın.',
            ],
            [
                'name' => 'Soft Touch',
                'slug' => 'soft-touch',
                'meta_title' => 'Soft Touch - Yumuşak Dokular',
                'meta_description' => 'Soft Touch ile yumuşacık ve konforlu kumaşlar.',
            ],
            [
                'name' => 'Royal Fabric',
                'slug' => 'royal-fabric',
                'meta_title' => 'Royal Fabric - Kraliyet Kalitesi',
                'meta_description' => 'Royal Fabric ile kraliyet kalitesinde kumaşlar.',
            ],
            [
                'name' => 'Modern Tekstil',
                'slug' => 'modern-tekstil',
                'meta_title' => 'Modern Tekstil - Çağdaş Tasarımlar',
                'meta_description' => 'Modern Tekstil ile çağdaş ve trend kumaş desenleri.',
            ],
            [
                'name' => 'Klasik Kumaş',
                'slug' => 'klasik-kumas',
                'meta_title' => 'Klasik Kumaş - Zamansız Desenler',
                'meta_description' => 'Klasik Kumaş ile zamansız ve şık desenler.',
            ],
        ];

        foreach ($brands as $brand) {
            DB::table('brands')->insert([
                'name' => $brand['name'],
                'slug' => $brand['slug'],
                'meta_title' => $brand['meta_title'],
                'meta_description' => $brand['meta_description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
