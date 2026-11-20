<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    // Koordinat Kantor Default (-1.6169982045745503, 103.57810290034548)
    const OFFICE_LAT = -1.6169982045745503;
    const OFFICE_LNG = 103.57810290034548;
    const MAX_RADIUS_METER = 10.0;

    protected $fillable = [
        'employee_id',
        'date',
        'check_in_time',
        'check_out_time',
        'status',
        'is_late',
        'check_in_photo',
        'check_out_photo',
        'latitude',
        'longitude',
        'distance_meter',
        'notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'is_late' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'distance_meter' => 'decimal:2',
    ];

    protected $appends = [
        'photo_in',
        'photo_out',
    ];

    public function getPhotoInAttribute()
    {
        return $this->check_in_photo;
    }

    public function getPhotoOutAttribute()
    {
        return $this->check_out_photo;
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Hitung jarak titik koordinat pengguna ke kantor memakai rumus Haversine (dalam satuan meter)
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meter

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return round($angle * $earthRadius, 2);
    }
}
