<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\WorkSchedule;
use Illuminate\Http\Request;

class WorkScheduleController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => WorkSchedule::orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function getDefault()
    {
        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => WorkSchedule::getDefault(),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->filled('work_days')) {
            $request->merge(['work_days' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']]);
        }
        if (!$request->filled('start_time')) {
            $request->merge(['start_time' => '08:00']);
        }
        if (!$request->filled('end_time')) {
            $request->merge(['end_time' => '17:00']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'work_days' => 'required|array|min:1',
            'is_active' => 'boolean',
        ]);

        if ($request->get('is_active', true)) {
            WorkSchedule::where('is_active', true)->update(['is_active' => false]);
        }

        $schedule = WorkSchedule::create([
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'work_days' => $request->work_days,
            'is_active' => $request->get('is_active', true),
        ]);

        AuditLog::log('create_work_schedule', 'work_schedules', $schedule->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Jadwal kerja berhasil disimpan.',
            'data' => $schedule,
        ], 201);
    }

    public function update(Request $request, $workSchedule)
    {
        $workSchedule = $workSchedule instanceof WorkSchedule ? $workSchedule : WorkSchedule::findOrFail($workSchedule);

        if (!$request->filled('work_days')) {
            $request->merge(['work_days' => $workSchedule->work_days ?: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']]);
        }
        if (!$request->filled('start_time')) {
            $request->merge(['start_time' => $workSchedule->start_time ?: '08:00']);
        }
        if (!$request->filled('end_time')) {
            $request->merge(['end_time' => $workSchedule->end_time ?: '17:00']);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'work_days' => 'required|array|min:1',
            'is_active' => 'boolean',
        ]);

        if ($request->get('is_active', false) && !$workSchedule->is_active) {
            WorkSchedule::where('is_active', true)->update(['is_active' => false]);
        }

        $workSchedule->update([
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'work_days' => $request->work_days,
            'is_active' => $request->get('is_active', $workSchedule->is_active),
        ]);

        AuditLog::log('update_work_schedule', 'work_schedules', $workSchedule->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Jadwal kerja berhasil diperbarui.',
            'data' => $workSchedule,
        ]);
    }

    public function destroy($workSchedule)
    {
        $workSchedule = $workSchedule instanceof WorkSchedule ? $workSchedule : WorkSchedule::findOrFail($workSchedule);
        $workSchedule->delete();
        AuditLog::log('delete_work_schedule', 'work_schedules', $workSchedule->id);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Jadwal kerja berhasil dihapus.',
        ]);
    }
}
