<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    protected $fillable = [
        'career_id',
        'applicant_name',
        'email',
        'phone',
        'cv_file',
        'cover_letter',
        'status',
    ];

    public function career()
    {
        return $this->belongsTo(Career::class);
    }
}
