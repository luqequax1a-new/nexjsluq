<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OptionValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'option_id',
        'label',
        'price',
        'price_type', // fixed, percent
        'position'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'position' => 'integer',
    ];

    public function option()
    {
        return $this->belongsTo(Option::class);
    }
}
