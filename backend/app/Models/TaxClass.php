<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxClass extends Model
{
    use HasFactory, SoftDeletes;

    const SHIPPING_ADDRESS = 'shipping_address';
    const BILLING_ADDRESS = 'billing_address';
    const STORE_ADDRESS = 'store_address';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['label', 'based_on'];

    public function taxRates()
    {
        return $this->hasMany(TaxRate::class)->orderBy('position');
    }

    public function translations()
    {
        return $this->hasMany(TaxClassTranslation::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
