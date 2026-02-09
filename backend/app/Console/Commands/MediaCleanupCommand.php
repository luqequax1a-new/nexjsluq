<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class MediaCleanupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:cleanup {--hours=24 : The age of orphan media to delete in hours}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cleanup orphan draft media files that were not attached to any product or variant.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $hours = (int) $this->option('hours');
        $threshold = Carbon::now()->subHours($hours);

        $this->info("Cleaning up orphan media older than {$hours} hours (before {$threshold})...");

        $orphans = Media::query()
            ->where('scope', 'global')
            ->whereNull('product_id')
            ->whereNull('product_variant_id')
            ->where('created_at', '<', $threshold)
            ->get();

        if ($orphans->isEmpty()) {
            $this->info("No orphan media found.");
            return 0;
        }

        $count = 0;
        foreach ($orphans as $media) {
            $disk = $media->disk ?: 'public';
            
            // Delete physical file
            if (filled($media->path) && Storage::disk($disk)->exists($media->path)) {
                Storage::disk($disk)->delete($media->path);
            }

            // Delete thumbnail
            if (filled($media->thumb_path) && Storage::disk($disk)->exists($media->thumb_path)) {
                Storage::disk($disk)->delete($media->thumb_path);
            }

            $media->delete();
            $count++;
        }

        $this->info("Successfully deleted {$count} orphan media items.");
        return 0;
    }
}
