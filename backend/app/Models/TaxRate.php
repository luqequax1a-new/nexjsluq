<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxRate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['tax_class_id', 'country', 'state', 'city', 'zip', 'rate', 'position'];
    
    protected $casts = [
        'rate' => 'float',
    ];
    
    public function taxClass()
    {
        return $this->belongsTo(TaxClass::class);
    }

    public function translations()
    {
        return $this->hasMany(TaxRateTranslation::class);
    }
}
