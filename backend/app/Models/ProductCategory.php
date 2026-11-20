<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductCategory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_code',
        'name',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function materials()
    {
        return $this->hasMany(Material::class, 'category_id');
    }
}
