<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key')->map(function ($val) {
            $decoded = json_decode($val, true);
            return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $val;
        });

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'company_tagline' => 'nullable|string|max:255',
            'company_about' => 'nullable|string',
            'company_vision' => 'nullable|string',
            'company_mission' => 'nullable|string',
            'company_phone' => 'nullable|string|max:50',
            'company_whatsapp' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:100',
            'company_address' => 'nullable|string',
            'office_lat' => 'nullable|numeric',
            'office_lng' => 'nullable|numeric',
            'attendance_radius_meter' => 'nullable|numeric|min:1',
            'late_penalty_amount' => 'nullable|numeric|min:0',
            'sick_salary_paid' => 'nullable|boolean',
            'leave_salary_paid' => 'nullable|boolean',
        ]);

        foreach ($data as $key => $value) {
            if ($value !== null) {
                Setting::set($key, $value);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan sistem berhasil diperbarui'
        ]);
    }
}
