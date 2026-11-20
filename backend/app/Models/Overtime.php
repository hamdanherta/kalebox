<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Overtime extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'rate_per_hour',
        'duration_hours',
        'total_pay',
        'notes',
        'status',
        'approved_by',
        'rejection_note',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'rate_per_hour' => 'decimal:2',
        'duration_hours' => 'decimal:2',
        'total_pay' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
