<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'material_code',
        'name',
        'category_id',
        'description',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function finishings()
    {
        return $this->belongsToMany(Finishing::class, 'material_finishing');
    }

    public function cuttings()
    {
        return $this->belongsToMany(Cutting::class, 'material_cutting');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'material_id');
    }
}
