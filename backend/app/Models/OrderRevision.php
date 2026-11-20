<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderRevision extends Model
{
    protected $fillable = [
        'order_id',
        'order_design_id',
        'revision_notes',
        'reference_image',
        'status',
    ];

    protected $appends = ['notes'];

    public function getNotesAttribute()
    {
        return $this->revision_notes;
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function design()
    {
        return $this->belongsTo(OrderDesign::class, 'order_design_id');
    }
}
