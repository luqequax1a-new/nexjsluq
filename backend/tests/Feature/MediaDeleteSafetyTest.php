<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Services\MediaImageVariantService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaDeleteSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_does_not_delete_shared_file_until_last_reference(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('media/2026/02/test.jpg', 'x');
        Storage::disk('public')->put('media/2026/02/test-80w.webp', 'w');

        $m1 = Media::create([
            'disk' => 'public',
            'type' => 'image',
            'path' => 'media/2026/02/test.jpg',
            'thumb_path' => 'media/2026/02/test-80w.webp',
            'mime' => 'image/jpeg',
            'size' => 1,
            'scope' => 'global',
            'position' => 0,
        ]);

        $m2 = Media::create([
            'disk' => 'public',
            'type' => 'image',
            'path' => 'media/2026/02/test.jpg',
            'thumb_path' => 'media/2026/02/test-80w.webp',
            'mime' => 'image/jpeg',
            'size' => 1,
            'scope' => 'global',
            'position' => 0,
        ]);

        $svc = app(MediaImageVariantService::class);

        $svc->deleteIfUnreferenced($m1);
        $this->assertTrue(Storage::disk('public')->exists('media/2026/02/test.jpg'));
        $this->assertTrue(Storage::disk('public')->exists('media/2026/02/test-80w.webp'));

        $m1->delete();

        $svc->deleteIfUnreferenced($m2);
        $this->assertFalse(Storage::disk('public')->exists('media/2026/02/test.jpg'));
        // Variant might be deleted as well when last reference removed
        $this->assertFalse(Storage::disk('public')->exists('media/2026/02/test-80w.webp'));
    }
}

