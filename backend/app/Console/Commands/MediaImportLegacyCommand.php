<?php

namespace App\Console\Commands;

use App\Services\MediaLegacyImportService;
use Illuminate\Console\Command;

class MediaImportLegacyCommand extends Command
{
    protected $signature = 'media:import-legacy {--limit=500 : Max rows to process} {--no-variants : Skip generating webp/avif variants}';

    protected $description = 'Import legacy image paths (string columns) into media table so they appear in the media library.';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $generateVariants = !$this->option('no-variants');

        $result = app(MediaLegacyImportService::class)->import([
            'limit' => $limit,
            'generate_variants' => $generateVariants,
            'created_by' => null,
        ]);

        $this->info('Legacy media import finished.');
        $this->line('Created: ' . $result['created']);
        $this->line('Skipped(existing/unrecognized): ' . $result['skipped']);
        $this->line('Updated variation_values.image_id: ' . $result['updated_variation_values']);
        $this->line('Missing files: ' . $result['missing_files']);

        return self::SUCCESS;
    }
}

