<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrisSetting extends Model
{
    protected $fillable = [
        'account_name',
        'qr_image',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function getActive()
    {
        return self::where('is_active', true)->first();
    }
}
