<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $fillable = [
        'employee_id',
        'period_month',
        'period_year',
        'daily_salary',
        'days_present',
        'days_permission',
        'days_sick',
        'days_absent',
        'times_late',
        'late_penalty_total',
        'overtime_hours',
        'overtime_total',
        'bonus_id',
        'bonus_amount',
        'basic_salary_total',
        'net_salary',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'daily_salary' => 'decimal:2',
        'late_penalty_total' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'overtime_total' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'basic_salary_total' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function bonus()
    {
        return $this->belongsTo(Bonus::class);
    }
}
