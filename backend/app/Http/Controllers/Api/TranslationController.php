<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TranslationController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:settings.edit')->only(['index', 'update', 'batchUpdate']);
    }

    public function index(Request $request): JsonResponse
    {
        $translations = Translation::query()
            ->when($request->query('group'), fn($q, $group) => $q->where('group', $group))
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return response()->json($translations);
    }

    public function getByLocale(string $locale): JsonResponse
    {
        try {
            $items = Translation::where('locale', $locale)->get();
            $dict = [];
            $groupPrefixes = [
                'admin' => 'admin',
                'storefront' => 'storefront',
                'storefront_auth' => 'storefront.auth',
                'storefront_account' => 'storefront.account',
            ];

            foreach ($items as $item) {
                $prefix = $groupPrefixes[$item->group] ?? $item->group;
                $keyPath = str_starts_with($item->key, "{$prefix}.")
                    ? $item->key
                    : "{$prefix}.{$item->key}";

                data_set($dict, $keyPath, $item->value);
            }

            return response()->json($dict);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([]);
        }
    }

    public function batchUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'translations' => ['required', 'array'],
            'translations.*.id' => ['required', 'integer', 'exists:translations,id'],
            'translations.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['translations'] as $item) {
            Translation::where('id', $item['id'])->update(['value' => $item['value']]);
        }

        Cache::forget('translations_tr');
        Cache::forget('translations_en');
        Cache::flush();

        return response()->json(['message' => 'Translations updated successfully']);
    }
}
