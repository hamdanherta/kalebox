<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionPlatform extends Model
{
    protected $fillable = [
        'name',
        'logo',
        'account_link',
    ];

    protected $appends = [
        'logo_url',
    ];

    public function getLogoUrlAttribute()
    {
        if (!$this->logo) {
            return null;
        }

        if (str_starts_with($this->logo, 'http://') || str_starts_with($this->logo, 'https://')) {
            return $this->logo;
        }

        return url($this->logo);
    }

    public function contents()
    {
        return $this->hasMany(Content::class, 'platform_id');
    }
}
