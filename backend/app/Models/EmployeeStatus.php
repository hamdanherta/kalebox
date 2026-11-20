<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeStatus extends Model
{
    protected $fillable = [
        'name',
        'duration_type',
        'valid_until',
    ];

    protected $casts = [
        'valid_until' => 'date',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
