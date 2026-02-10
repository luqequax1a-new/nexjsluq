<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageSection;
use App\Models\SectionTemplate;
use Illuminate\Http\Request;

class PageSectionController extends Controller
{
    /**
     * Get all sections for a page type
     */
    public function index(Request $request)
    {
        $pageType = $request->get('page_type', 'home');

        $sections = PageSection::forPage($pageType)
            ->ordered()
            ->with('template')
            ->get()
            ->map(function (PageSection $section) {
                $data = $section->toArray();
                $data['settings'] = $section->getMergedSettings();
                return $data;
            });

        return response()->json([
            'sections' => $sections,
        ]);
    }

    /**
     * Get all available section templates
     */
    public function templates()
    {
        $templates = SectionTemplate::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $grouped = $templates->groupBy('category')->map(function ($items, $category) {
            return [
                'category' => $category,
                'label' => $this->getCategoryLabel($category),
                'templates' => $items->values(),
            ];
        })->values();

        return response()->json([
            'templates' => $templates,
            'grouped' => $grouped,
        ]);
    }

    /**
     * Add a new section to a page
     */
    public function store(Request $request)
    {
        $request->validate([
            'page_type' => 'required|string',
            'section_template_id' => 'required|exists:section_templates,id',
        ]);

        $template = SectionTemplate::findOrFail($request->section_template_id);

        // Check if allow_multiple is false and section already exists
        if (!$template->allow_multiple) {
            $exists = PageSection::forPage($request->page_type)
                ->where('section_template_id', $template->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Bu bölüm türünden sadece bir tane eklenebilir.',
                ], 422);
            }
        }

        $maxPosition = PageSection::forPage($request->page_type)->max('position') ?? -1;

        $section = PageSection::create([
            'page_type' => $request->page_type,
            'section_template_id' => $template->id,
            'settings' => $template->getDefaultSettings(),
            'is_active' => true,
            'position' => $maxPosition + 1,
        ]);

        $section->load('template');

        return response()->json([
            'section' => $section,
            'message' => 'Bölüm başarıyla eklendi.',
        ], 201);
    }

    /**
     * Update a section's settings
     */
    public function update(Request $request, PageSection $pageSection)
    {
        $request->validate([
            'settings' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($request->has('settings')) {
            $pageSection->settings = $request->settings;
        }

        if ($request->has('is_active')) {
            $pageSection->is_active = $request->is_active;
        }

        $pageSection->save();
        $pageSection->load('template');

        return response()->json([
            'section' => $pageSection,
            'message' => 'Bölüm güncellendi.',
        ]);
    }

    /**
     * Toggle section visibility
     */
    public function toggle(PageSection $pageSection)
    {
        $pageSection->is_active = !$pageSection->is_active;
        $pageSection->save();

        return response()->json([
            'section' => $pageSection,
            'is_active' => $pageSection->is_active,
        ]);
    }

    /**
     * Duplicate a section
     */
    public function duplicate(PageSection $pageSection)
    {
        $clone = $pageSection->duplicate();
        $clone->load('template');

        return response()->json([
            'section' => $clone,
            'message' => 'Bölüm kopyalandı.',
        ], 201);
    }

    /**
     * Delete a section
     */
    public function destroy(PageSection $pageSection)
    {
        $pageSection->delete();

        return response()->json([
            'message' => 'Bölüm silindi.',
        ]);
    }

    /**
     * Reorder sections
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|exists:page_sections,id',
            'order.*.position' => 'required|integer|min:0',
        ]);

        foreach ($request->order as $item) {
            PageSection::where('id', $item['id'])->update(['position' => $item['position']]);
        }

        return response()->json([
            'message' => 'Sıralama güncellendi.',
        ]);
    }

    /**
     * Bulk save all sections (settings + order)
     */
    public function bulkSave(Request $request)
    {
        $request->validate([
            'page_type' => 'required|string',
            'sections' => 'required|array',
        ]);

        foreach ($request->sections as $data) {
            if (!isset($data['id'])) continue;

            PageSection::where('id', $data['id'])->update([
                'settings' => $data['settings'] ?? [],
                'is_active' => $data['is_active'] ?? true,
                'position' => $data['position'] ?? 0,
            ]);
        }

        return response()->json([
            'message' => 'Tüm değişiklikler kaydedildi.',
        ]);
    }

    private function getCategoryLabel(string $category): string
    {
        return match ($category) {
            'hero' => 'Hero & Karşılama',
            'products' => 'Ürün Vitrinleri',
            'visual' => 'Görsel Alanlar',
            'content' => 'İçerik & Pazarlama',
            default => ucfirst($category),
        };
    }
}
