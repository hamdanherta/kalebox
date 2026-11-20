<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Member;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $query = Member::with('user');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('member_no', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15)),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $member = Member::create([
            'member_no' => Member::generateMemberNo(),
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'discount_percent' => $request->get('discount_percent', 5.00),
        ]);

        AuditLog::log('create_member', 'members', $member->id, null, $member->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Member baru berhasil didaftarkan.',
            'data' => $member,
        ], 201);
    }

    public function update(Request $request, Member $member)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $old = $member->toArray();
        $member->update($request->only(['name', 'phone', 'email', 'address', 'discount_percent']));

        AuditLog::log('update_member', 'members', $member->id, $old, $member->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data member berhasil diperbarui.',
            'data' => $member,
        ]);
    }

    public function destroy(Member $member)
    {
        $member->delete();
        AuditLog::log('delete_member', 'members', $member->id);

        return response()->json([
            'success' => true,
            'message' => 'Data member berhasil dihapus.',
        ]);
    }
}
