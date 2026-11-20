<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) return $default;

        $val = $setting->value;
        $decoded = json_decode($val, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $val;
    }

    public static function set(string $key, $value)
    {
        $val = is_array($value) ? json_encode($value) : (string)$value;
        return self::updateOrCreate(['key' => $key], ['value' => $val]);
    }
}
