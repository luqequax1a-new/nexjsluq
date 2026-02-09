<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index()
    {
        $categories = Category::roots()->normal()->get(['id', 'name', 'slug', 'image']);
        
        $newArrivals = Product::where('is_active', true)
            ->with(['media' => function($q) {
                $q->where('scope', 'product')->orderBy('position');
            }])
            ->latest()
            ->take(8)
            ->get();

        // Fake banners for now
        $hero = [
            [
                'id' => 1,
                'title' => 'Yeni Sezon Kumaşlar',
                'subtitle' => '%20 indirimle hemen keşfedin',
                'image' => 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1920&q=80',
                'link' => '/yeni',
                'button_text' => 'Alışverişe Başla'
            ],
            [
                'id' => 2,
                'title' => 'Premium Koleksiyon',
                'subtitle' => 'İtalyan ipeği ve en özel dokular',
                'image' => 'https://images.unsplash.com/photo-1620714223084-8dfacc6dfdca?auto=format&fit=crop&w=1920&q=80',
                'link' => '/kategoriler/premium',
                'button_text' => 'Koleksiyonu Gör'
            ]
        ];

        return response()->json([
            'categories' => $categories,
            'hero' => $hero,
            'new_arrivals' => $newArrivals,
        ]);
    }
}
