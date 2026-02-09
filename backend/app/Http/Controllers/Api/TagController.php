<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:tags.index')->only(['index']);
        $this->middleware('permission:tags.create')->only(['store']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Tag::query()->orderBy('name');

        $q = trim((string) $request->get('query', ''));
        if ($q !== '') {
            $query->where('name', 'like', '%' . $q . '%');
        }

        $limit = (int) ($request->get('limit', 20));
        $limit = $limit > 0 ? min($limit, 50) : 20;

        return response()->json($query->limit($limit)->get(['id', 'name']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $name = trim($data['name']);
        $normalized = Str::of($name)->lower()->squish()->value();

        $tag = Tag::query()->firstOrCreate(
            ['normalized_name' => $normalized],
            ['name' => $name, 'normalized_name' => $normalized],
        );

        // Eğer aynı normalized_name ile farklı case gelirse, isim güncellemek istemiyorsan dokunma.
        // Burada basitçe ilk girileni koruyoruz.

        return response()->json($tag->only(['id', 'name']), 201);
    }
}
