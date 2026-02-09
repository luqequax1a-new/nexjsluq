<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductTab extends Model
{
    protected $fillable = [
        'title',
        'content_html',
        'position',
        'is_active',
        'conditions',
    ];

    protected $casts = [
        'position' => 'integer',
        'is_active' => 'boolean',
        'conditions' => 'array',
    ];
}

