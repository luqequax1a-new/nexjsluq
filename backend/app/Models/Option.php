<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Option extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'name',
        'type',
        'is_required',
        'is_global',
        'position'
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_global' => 'boolean',
        'product_id' => 'integer',
        'position' => 'integer',
    ];

    protected $with = ['values'];

    // Types definition similar to FleetCart but with our 'file' addition
    public const TYPES = [
        'field',
        'textarea',
        'dropdown',
        'checkbox',
        'checkbox_custom',
        'radio',
        'radio_custom',
        'multiple_select',
        'date',
        'date_time',
        'time',
        'file' // Added for PDF/Image uploads
    ];

    public function values()
    {
        return $this->hasMany(OptionValue::class)->orderBy('position');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
    // Scopes
    public function scopeGlobal($query)
    {
        return $query->where('is_global', true)->whereNull('product_id');
    }
}
