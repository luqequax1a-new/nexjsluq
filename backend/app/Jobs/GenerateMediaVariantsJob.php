<?php

namespace App\Jobs;

use App\Models\Media;
use App\Services\MediaImageVariantService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateMediaVariantsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $mediaId,
        public bool $forceCrops = false,
    ) {
    }

    public function handle(MediaImageVariantService $svc): void
    {
        $media = Media::query()->find($this->mediaId);
        if (!$media) return;

        if ($this->forceCrops) {
            $svc->regenerateCrops($media);
            return;
        }

        $svc->generateOnUpload($media);
    }
}

