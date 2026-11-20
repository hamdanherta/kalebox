<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Finishing extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'finishing_code',
        'name',
    ];

    public function materials()
    {
        return $this->belongsToMany(Material::class, 'material_finishing');
    }
}
