<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDesign extends Model
{
    protected $fillable = [
        'order_id',
        'designer_id',
        'version_number',
        'file_path',
        'preview_image',
        'notes',
        'status',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_id');
    }

    public function revisions()
    {
        return $this->hasMany(OrderRevision::class);
    }
}
