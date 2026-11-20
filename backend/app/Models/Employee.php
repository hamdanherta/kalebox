<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_id_number',
        'nik',
        'name',
        'address',
        'domicile',
        'position_id',
        'employee_status_id',
        'hire_date',
        'start_time',
        'end_time',
        'daily_salary',
        'profile_photo',
        'emergency_contact',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'daily_salary' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function employeeStatus()
    {
        return $this->belongsTo(EmployeeStatus::class, 'employee_status_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function overtimes()
    {
        return $this->hasMany(Overtime::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    // Periksa dan perbarui No Induk Karyawan bila sudah 1 tahun bekerja
    public function checkAndAssignEmployeeIdNumber(): bool
    {
        if ($this->employee_id_number !== '-' && !empty($this->employee_id_number)) {
            return false;
        }

        $years = Carbon::parse($this->hire_date)->diffInYears(now());
        if ($years >= 1) {
            $yearStr = Carbon::parse($this->hire_date)->format('Y');
            $padded = str_pad($this->id, 4, '0', STR_PAD_LEFT);
            $this->employee_id_number = "NIK-{$yearStr}-{$padded}";
            $this->save();
            return true;
        }

        return false;
    }
}
