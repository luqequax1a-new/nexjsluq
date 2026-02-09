<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoogleProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleProductCategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:google_categories.index')->only(['index']);
    }

    public function index(Request $request): JsonResponse
    {
        // Search query
        $q = $request->query('q');
        // Parent ID for lazy loading (default null for root)
        // If searching, we don't strictly use pId, we search everywhere.
        // If not searching, we use pId to fetch one level.

        // AntD TreeSelect sends 'pId' or we can structure our own lazy load param.
        // Let's assume ?parent_id=... for lazy load.
        $parentId = $request->query('parent_id');
        
        // Language preference
        $lang = $request->query('lang', 'tr');

        $query = GoogleProductCategory::query()
            ->select('id', 'google_id', 'parent_google_id', 'name', 'full_path', 'is_leaf');

        if ($q) {
            $query->where(function($sub) use ($q) {
                // ... search logic (no change needed here) ...
                // Basic ASCII search on the JSON string representation
                $sub->whereRaw("name::text ilike ?", ["%{$q}%"])
                    ->orWhereRaw("full_path::text ilike ?", ["%{$q}%"]);
                
                // Try to match Unicode escaped sequences (for SQL_ASCII db containing \uXXXX)
                $encoded = json_encode($q);
                if ($encoded && strlen($encoded) > 2) {
                     $escaped = substr($encoded, 1, -1); // Remove quotes e.g. "kuma\u015f"
                     // Avoid duplicates if no escaping happened
                     if ($escaped !== $q) {
                         $sql_escaped = str_replace('\\', '\\\\', $escaped);
                         $sub->orWhereRaw("name::text ilike ?", ["%{$sql_escaped}%"])
                             ->orWhereRaw("full_path::text ilike ?", ["%{$sql_escaped}%"]);
                     }
                }
            });
            $query->limit(100); 
            
            // Get matches
            $matches = $query->get();
            
            // Collect all unique IDs including ancestors
            $allById = [];
            $toLoad = $matches->pluck('parent_google_id')->filter()->unique()->toArray();
            
            foreach ($matches as $m) {
                $allById[$m->google_id] = $m;
            }

            // Load ancestors iteratively
            while (!empty($toLoad)) {
                $parents = GoogleProductCategory::whereIn('google_id', $toLoad)->get();
                $toLoad = []; // Reset for next level
                
                foreach ($parents as $p) {
                    if (!isset($allById[$p->google_id])) {
                        $allById[$p->google_id] = $p;
                        if ($p->parent_google_id) {
                            $toLoad[] = $p->parent_google_id;
                        }
                    }
                }
                $toLoad = array_unique($toLoad);
            }

            // Build Tree
            $tree = [];
            $dataset = collect($allById)->sortBy('google_id'); // Sort by ID or Name
            
            $nodes = [];
            foreach ($dataset as $cat) {
                 // Use requested lang, fallback to en, then tr
                 $name = $cat->name[$lang] ?? $cat->name['en'] ?? $cat->name['tr'] ?? 'Unknown';
                 $pathStr = $cat->full_path[$lang] ?? $cat->full_path['en'] ?? $cat->full_path['tr'] ?? $name;
                 
                 $nodes[$cat->google_id] = [
                    'id' => $cat->id, 
                    'value' => $cat->id, 
                    'google_id' => $cat->google_id,
                    'title' => $name,
                    'path_str' => $pathStr,
                    'isLeaf' => $cat->is_leaf,
                    'key' => $cat->id,
                    'children' => []
                 ];
            }

            // Link them
            foreach ($dataset as $cat) {
                if ($cat->parent_google_id && isset($nodes[$cat->parent_google_id])) {
                    $nodes[$cat->parent_google_id]['children'][] = &$nodes[$cat->google_id];
                } else {
                    $tree[] = &$nodes[$cat->google_id];
                }
            }

            return response()->json($tree);

        } else {
            // Lazy load mode
            if ($parentId !== null) {
                $query->where('parent_google_id', $parentId);
            } else {
                $query->whereNull('parent_google_id');
            }
            
            $categories = $query->orderBy('google_id')->get();

            $data = $categories->map(function ($cat) use ($lang) {
                $name = $cat->name[$lang] ?? $cat->name['en'] ?? $cat->name['tr'] ?? 'Unknown';
                 $pathStr = $cat->full_path[$lang] ?? $cat->full_path['en'] ?? $cat->full_path['tr'] ?? $name;

                return [
                    'id' => $cat->id, 
                    'value' => $cat->id, 
                    'google_id' => $cat->google_id,
                    'title' => $name,
                    'path_str' => $pathStr, 
                    'pId' => $cat->parent_google_id, 
                    'isLeaf' => $cat->is_leaf,
                    'key' => $cat->id,
                ];
            });

            return response()->json($data);
        }
    }
}
