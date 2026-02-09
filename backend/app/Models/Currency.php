<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'symbol_position',
        'thousand_separator',
        'decimal_separator',
        'no_of_decimals',
        'exchange_rate',
        'default',
        'status',
    ];

    protected $casts = [
        'default' => 'boolean',
        'status' => 'boolean',
        'exchange_rate' => 'decimal:4',
    ];
}
