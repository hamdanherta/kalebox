<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cutting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'cutting_code',
        'name',
    ];

    public function materials()
    {
        return $this->belongsToMany(Material::class, 'material_cutting');
    }
}
