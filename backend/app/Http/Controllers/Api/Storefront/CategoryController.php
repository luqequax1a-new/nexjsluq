<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function show($slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        
        $products = $category->products()
            ->with(['media' => function($q) {
                $q->where('scope', 'product')->orderBy('position');
            }])
            ->paginate(12);

        return response()->json([
            'category' => $category,
            'products' => $products,
        ]);
    }
}
