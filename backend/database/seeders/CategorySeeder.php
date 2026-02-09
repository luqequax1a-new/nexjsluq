<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Ev Tekstili',
                'slug' => 'ev-tekstili',
                'type' => 'normal',
                'children' => [
                    [
                        'name' => 'DÖŞEMELİK',
                        'slug' => 'dosemelik',
                        'type' => 'normal',
                        'children' => [
                            [
                                'name' => 'PANAMA KETEN',
                                'slug' => 'panama-keten',
                                'type' => 'normal',
                            ],
                            [
                                'name' => 'BABYFACE',
                                'slug' => 'babyface',
                                'type' => 'normal',
                            ],
                            [
                                'name' => 'TAYTÜYÜ',
                                'slug' => 'taytüyü',
                                'type' => 'normal',
                            ],
                        ],
                    ],
                    [
                        'name' => 'PERDE',
                        'slug' => 'perde',
                        'type' => 'normal',
                        'children' => [
                            [
                                'name' => 'Tül Perde',
                                'slug' => 'tul-perde',
                                'type' => 'normal',
                            ],
                            [
                                'name' => 'Fon Perde',
                                'slug' => 'fon-perde',
                                'type' => 'normal',
                            ],
                        ],
                    ],
                    [
                        'name' => 'YATAK ÖRTÜSÜ',
                        'slug' => 'yatak-ortusu',
                        'type' => 'normal',
                    ],
                ],
            ],
            [
                'name' => 'Giyim',
                'slug' => 'giyim',
                'type' => 'normal',
                'children' => [
                    [
                        'name' => 'Kadın Giyim',
                        'slug' => 'kadin-giyim',
                        'type' => 'normal',
                        'children' => [
                            [
                                'name' => 'Elbise',
                                'slug' => 'elbise',
                                'type' => 'normal',
                            ],
                            [
                                'name' => 'Bluz',
                                'slug' => 'bluz',
                                'type' => 'normal',
                            ],
                        ],
                    ],
                    [
                        'name' => 'Erkek Giyim',
                        'slug' => 'erkek-giyim',
                        'type' => 'normal',
                        'children' => [
                            [
                                'name' => 'Gömlek',
                                'slug' => 'gomlek',
                                'type' => 'normal',
                            ],
                            [
                                'name' => 'Pantolon',
                                'slug' => 'pantolon',
                                'type' => 'normal',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Aksesuar',
                'slug' => 'aksesuar',
                'type' => 'normal',
                'children' => [
                    [
                        'name' => 'Çanta',
                        'slug' => 'canta',
                        'type' => 'normal',
                    ],
                    [
                        'name' => 'Kemer',
                        'slug' => 'kemer',
                        'type' => 'normal',
                    ],
                ],
            ],
        ];

        $this->insertCategories($categories);
    }

    private function insertCategories(array $categories, $parentId = null): void
    {
        foreach ($categories as $category) {
            $children = $category['children'] ?? [];
            unset($category['children']);

            $categoryId = DB::table('categories')->insertGetId([
                'name' => $category['name'],
                'slug' => $category['slug'],
                'type' => $category['type'],
                'parent_id' => $parentId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (!empty($children)) {
                $this->insertCategories($children, $categoryId);
            }
        }
    }
}
