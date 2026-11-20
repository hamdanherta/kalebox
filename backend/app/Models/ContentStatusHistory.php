<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentStatusHistory extends Model
{
    protected $fillable = [
        'content_id',
        'user_id',
        'status',
        'notes',
    ];

    public function content()
    {
        return $this->belongsTo(Content::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
