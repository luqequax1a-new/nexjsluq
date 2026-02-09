<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class VariationValue extends Model
{
    use HasFactory;

    protected $fillable = ['uid', 'variation_id', 'label', 'value', 'color', 'image', 'image_id', 'position'];

    protected $casts = [
        'position' => 'integer',
        'image_id' => 'integer',
    ];

    protected $appends = ['image'];

    protected static function booted(): void
    {
        static::creating(function (VariationValue $value): void {
            if (empty($value->uid)) {
                $value->uid = Str::lower(Str::random(12));
            }
        });
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(Variation::class);
    }

    /**
     * Relation to Media for image type variations.
     */
    public function imageMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'image_id');
    }

    /**
     * FleetCart-compatible: Get color from value field if not explicitly set.
     */
    public function getColorAttribute(): ?string
    {
        $explicit = $this->attributes['color'] ?? null;
        if ($explicit) {
            return $explicit;
        }
        
        // FleetCart stores color in 'value' field
        return $this->attributes['value'] ?? null;
    }

    /**
     * FleetCart-compatible: Get image as object with path and URLs.
     * Returns image_id media data for storefront display.
     */
    public function getImageAttribute()
    {
        // First check if there's a media relation
        $media = $this->imageMedia;
        if ($media) {
            return $media;
        }
        
        // Fallback to string image field - wrap in object-like structure
        $imagePath = $this->attributes['image'] ?? null;
        if ($imagePath) {
            return (object) [
                'id' => null,
                'path' => $imagePath,
                'url' => $imagePath,
                'card_jpeg_url' => $imagePath,
                'grid_jpeg_url' => $imagePath,
                'thumb_jpeg_url' => $imagePath,
            ];
        }
        
        return null;
    }
}
