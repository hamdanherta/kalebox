<?php

namespace App\Http\Controllers;

use App\Models\Career;
use App\Models\JobApplication;
use Illuminate\Http\Request;

class CareerController extends Controller
{
    public function publicIndex()
    {
        $careers = Career::where('is_active', true)->orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $careers
        ]);
    }

    public function publicShow($id)
    {
        $career = Career::where('is_active', true)->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $career
        ]);
    }

    public function apply(Request $request, $id)
    {
        $career = Career::where('is_active', true)->findOrFail($id);

        $data = $request->validate([
            'applicant_name' => 'required|string|max:255',
            'email' => 'required|email|max:100',
            'phone' => 'required|string|max:50',
            'cv_file' => 'required|file|mimes:pdf|max:10240',
            'cover_letter' => 'nullable|string',
        ]);

        $cvPath = '/storage/' . $request->file('cv_file')->store('resumes', 'public');

        $application = JobApplication::create([
            'career_id' => $career->id,
            'applicant_name' => $data['applicant_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'cv_file' => $cvPath,
            'cover_letter' => $data['cover_letter'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Lamaran Anda berhasil dikirim. Tim Kalebox akan meninjau kualifikasi Anda.',
            'data' => $application
        ], 201);
    }

    // Internal management
    public function internalIndex()
    {
        $careers = Career::withCount('applications')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $careers
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'employment_type' => 'required|string|max:50',
            'location' => 'required|string|max:100',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $career = Career::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Lowongan karir berhasil dibuat',
            'data' => $career
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $career = Career::findOrFail($id);
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:100',
            'employment_type' => 'required|string|max:50',
            'location' => 'required|string|max:100',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $career->update($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Lowongan karir berhasil diperbarui',
            'data' => $career
        ]);
    }

    public function destroy($id)
    {
        $career = Career::findOrFail($id);
        $career->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Lowongan karir berhasil dihapus'
        ]);
    }

    public function applications(Request $request, $id = null)
    {
        $query = JobApplication::with('career:id,title,department');

        if ($id) {
            $query->where('career_id', $id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data' => $applications
        ]);
    }

    public function updateApplicationStatus(Request $request, $applicationId)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,reviewed,interviewed,accepted,rejected'
        ]);

        $app = JobApplication::findOrFail($applicationId);
        $app->update(['status' => $data['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status lamaran berhasil diperbarui',
            'data' => $app
        ]);
    }
}
