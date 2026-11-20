<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'work_days',
        'is_active',
    ];

    protected $casts = [
        'work_days' => 'array',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'shift_name',
        'check_in_time',
        'check_out_time',
        'late_tolerance_minutes',
    ];

    public function getShiftNameAttribute()
    {
        return $this->name;
    }

    public function getCheckInTimeAttribute()
    {
        return $this->start_time;
    }

    public function getCheckOutTimeAttribute()
    {
        return $this->end_time;
    }

    public function getLateToleranceMinutesAttribute()
    {
        return 15;
    }

    public static function getDefault(): ?self
    {
        return self::where('is_active', true)->first();
    }
}
