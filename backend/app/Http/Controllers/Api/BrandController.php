<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class BrandController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->middleware('permission:brands.index')->only(['show']);
        $this->middleware('permission:brands.create')->only(['store']);
        $this->middleware('permission:brands.edit')->only(['update', 'reorder']);
        $this->middleware('permission:brands.destroy')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Brand::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'ilike', "%{$search}%");
        }

        $query->orderBy('name');

        if ($request->boolean('paginate', true)) {
            $brands = $query->paginate($request->input('per_page', 20));
        } else {
            $brands = $query->get();
        }

        return response()->json($brands);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:brands,slug'],
            'image' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
        ]);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $brand = Brand::create($data);

        return response()->json(['brand' => $brand], 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return response()->json(['brand' => $brand]);
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:brands,slug,' . $brand->id . ',id'],
            'image' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
        ]);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $brand->update($data);

        return response()->json(['brand' => $brand]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();

        return response()->json(['ok' => true]);
    }
}
