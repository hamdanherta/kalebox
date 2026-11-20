<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'member_no',
        'user_id',
        'name',
        'address',
        'phone',
        'email',
        'discount_percent',
    ];

    protected $casts = [
        'discount_percent' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public static function generateMemberNo(): string
    {
        $last = self::withTrashed()->orderBy('id', 'desc')->first();
        $next = $last ? ($last->id + 1) : 1;
        return 'KLB-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }
}
