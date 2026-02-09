<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:settings.edit');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Page::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        $query->orderByDesc('updated_at')->orderByDesc('id');

        if ($request->boolean('paginate', true)) {
            $pages = $query->paginate($request->input('per_page', 20));
        } else {
            $pages = $query->get();
        }

        return response()->json($pages);
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json(['page' => $page]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:255', 'unique:pages,slug'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'content_html' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $data['slug'] = Str::slug($data['slug']);

        $sanitizer = app(HtmlSanitizer::class);
        $data['content_html'] = $sanitizer->sanitize($data['content_html'] ?? null);

        $page = Page::create($data);

        return response()->json(['page' => $page], 201);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:255', 'unique:pages,slug,' . $page->id . ',id'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'content_html' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);

        $data['slug'] = Str::slug($data['slug']);

        if (array_key_exists('content_html', $data)) {
            $sanitizer = app(HtmlSanitizer::class);
            $data['content_html'] = $sanitizer->sanitize($data['content_html']);
        }

        $page->update($data);

        return response()->json(['page' => $page->fresh()]);
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return response()->json(['ok' => true]);
    }

    public function toggle(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'is_published' => ['required', 'boolean'],
        ]);

        $next = (bool) $data['is_published'];

        $page->update([
            'is_published' => $next,
            'published_at' => $next ? ($page->published_at ?? now()) : null,
        ]);

        return response()->json(['page' => $page->fresh()]);
    }
}
