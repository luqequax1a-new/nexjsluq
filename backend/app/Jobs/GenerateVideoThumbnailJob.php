<?php

namespace App\Jobs;

use App\Models\Media;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use FFMpeg\FFMpeg;
use FFMpeg\Coordinate\TimeCode;

class GenerateVideoThumbnailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $mediaId
    ) {}

    public function handle(): void
    {
        $media = Media::find($this->mediaId);
        
        if (!$media || $media->type !== 'video') {
            return;
        }

        try {
            $disk = $media->disk ?: 'public';
            $videoPath = Storage::disk($disk)->path($media->path);
            
            if (!file_exists($videoPath)) {
                Log::warning("Video file not found: {$videoPath}");
                return;
            }

            // Generate thumbnail path
            $pathInfo = pathinfo($media->path);
            $thumbnailPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_thumb.jpg';
            $thumbnailFullPath = Storage::disk($disk)->path($thumbnailPath);

            // Ensure directory exists
            $thumbnailDir = dirname($thumbnailFullPath);
            if (!is_dir($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            // Use FFmpeg to generate thumbnail from first second
            $ffmpeg = FFMpeg::create([
                'ffmpeg.binaries'  => env('FFMPEG_BINARY', '/usr/bin/ffmpeg'),
                'ffprobe.binaries' => env('FFPROBE_BINARY', '/usr/bin/ffprobe'),
                'timeout'          => 3600,
                'ffmpeg.threads'   => 12,
            ]);

            $video = $ffmpeg->open($videoPath);
            $frame = $video->frame(TimeCode::fromSeconds(1));
            $frame->save($thumbnailFullPath);

            // Update media record
            $media->update([
                'thumb_path' => $thumbnailPath
            ]);

            Log::info("Video thumbnail generated successfully for media ID: {$this->mediaId}");

        } catch (\Exception $e) {
            Log::error("Failed to generate video thumbnail for media ID {$this->mediaId}: " . $e->getMessage());
            
            // Fallback: keep using video as thumbnail
            // Already set in MediaController
        }
    }
}
