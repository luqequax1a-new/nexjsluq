<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'disk',
        'type',
        'path',
        'thumb_path',
        'mime',
        'size',
        'width',
        'height',
        'focal_x',
        'focal_y',
        'crop_x',
        'crop_y',
        'crop_w',
        'crop_h',
        'sha1',
        'original_name',
        'alt',
        'scope',
        'product_id',
        'product_variant_id',
        'position',
        'created_by',
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'focal_x' => 'float',
        'focal_y' => 'float',
        'crop_x' => 'float',
        'crop_y' => 'float',
        'crop_w' => 'float',
        'crop_h' => 'float',
        'position' => 'integer',
        'product_id' => 'integer',
        'product_variant_id' => 'integer',
        'created_by' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
