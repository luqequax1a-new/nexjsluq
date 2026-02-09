<?php

namespace App\Console\Commands;

use App\Models\GoogleProductCategory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ImportGoogleProductCategories extends Command
{
    protected $signature = 'google:import-categories';
    protected $description = 'Download and parse Google Product Taxonomy (US & TR) and save to DB';

    public function handle()
    {
        $this->info("Starting Google Product Taxonomy Import...");

        // URLs
        $urlUS = 'http://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt';
        $urlTR = 'http://www.google.com/basepages/producttype/taxonomy-with-ids.tr-TR.txt';

        $this->info("Downloading US Taxonomy...");
        $contentUS = Http::get($urlUS)->body();
        
        $this->info("Downloading TR Taxonomy...");
        $contentTR = Http::get($urlTR)->body();

        // Check if downloads look valid (skipping first line usually which is version/header)
        // Format: "1 - Animals & Pet Supplies"
        
        $linesUS = explode("\n", $contentUS);
        $linesTR = explode("\n", $contentTR);

        // Map US by ID => Path
        $mapUS = [];
        foreach ($linesUS as $line) {
            $line = trim($line);
            if (!$line || str_starts_with($line, '#')) continue;
            
            // Expected line: "123 - Root > Child > Leaf"
            $parts = explode(' - ', $line, 2);
            if (count($parts) < 2) continue;
            
            $id = (int) $parts[0];
            $path = trim($parts[1]);
            $mapUS[$id] = $path;
        }

        // Map TR by ID => Path
        $mapTR = [];
        foreach ($linesTR as $line) {
            $line = trim($line);
            if (!$line || str_starts_with($line, '#')) continue;
            
            $parts = explode(' - ', $line, 2);
            if (count($parts) < 2) continue;
            
            $id = (int) $parts[0];
            $path = trim($parts[1]);
            $mapTR[$id] = $path;
        }

        $allIds = array_unique(array_merge(array_keys($mapUS), array_keys($mapTR)));
        sort($allIds);

        $this->info("Found " . count($allIds) . " unique categories. Processing...");

        $bar = $this->output->createProgressBar(count($allIds));
        $bar->start();

        DB::beginTransaction();
        try {
            // We need to process parents before children to ensuring FKs if we used strict Parent FKs, 
            // but we use 'parent_google_id' which is just a number, so order technically doesn't mostly matter 
            // unless we want to calculate 'is_leaf' dynamically now. 
            // Actually, we can just insert/update all.

            // To determine `parent_google_id`, we look at the path.
            // Example Path: "Apparel & Accessories > Clothing > Shirts & Tops"
            // Parent Path: "Apparel & Accessories > Clothing"
            // We need to find the ID of the parent path. This is tricky because we only have ID->Path.
            // But usually the taxonomy list contains the parent as a separate entry.
            // So we can reverse map Path->ID to find parent ID.
            
            $pathIdMapUS = array_flip($mapUS);

            foreach ($allIds as $id) {
                $pathUS = $mapUS[$id] ?? '';
                $pathTR = $mapTR[$id] ?? '';
                
                // Fallback if one is missing
                if (!$pathUS && $pathTR) $pathUS = $pathTR; // Should not really happen for standard standard
                if (!$pathTR && $pathUS) $pathTR = $pathUS; 

                // Determine name (last part of path)
                $partsUS = explode(' > ', $pathUS);
                $nameUS = end($partsUS);
                
                $partsTR = explode(' > ', $pathTR);
                $nameTR = end($partsTR);

                // Determine Parent ID
                // Remove last part from US path to get parent path
                array_pop($partsUS);
                $parentPathUS = implode(' > ', $partsUS);
                $parentId = $parentPathUS ? ($pathIdMapUS[$parentPathUS] ?? null) : null;
                
                // Level
                $level = count(explode(' > ', $pathUS)); // Root is 1

                GoogleProductCategory::updateOrCreate(
                    ['google_id' => $id],
                    [
                        'parent_google_id' => $parentId,
                        'name' => [
                            'en' => $nameUS,
                            'tr' => $nameTR,
                        ],
                        'full_path' => [
                            'en' => $pathUS,
                            'tr' => $pathTR,
                        ],
                        'level' => $level,
                        'is_leaf' => true, // Will update later
                    ]
                );
                
                $bar->advance();
            }

            // Update is_leaf
            // If a category appears as a 'parent_google_id' for anyone, it is NOT a leaf.
            // This is heavy to do one by one. one query update is better.
            $this->info("\nUpdating leaf status...");
            
            // Mark all as leaf first (default)
            // Then find parents and mark false
            DB::update("
                UPDATE google_product_categories 
                SET is_leaf = false 
                WHERE google_id IN (
                    SELECT DISTINCT parent_google_id FROM google_product_categories WHERE parent_google_id IS NOT NULL
                )
            ");
            
            DB::commit();
            $bar->finish();
            $this->info("\nImport completed successfully.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Error: " . $e->getMessage());
        }
    }
}
