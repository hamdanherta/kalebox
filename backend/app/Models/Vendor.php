<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_code',
        'name',
        'address',
        'phone',
        'email',
        'print_type',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
