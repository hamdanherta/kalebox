<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('vendor_code', 'like', '%' . $request->search . '%')
                  ->orWhere('print_type', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('name')->paginate($request->get('per_page', 15)),
        ]);
    }

    public function all()
    {
        return response()->json([
            'success' => true,
            'data' => Vendor::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'print_type' => 'nullable|string',
        ]);

        $count = Vendor::withTrashed()->count() + 1;
        $code = 'VND-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $vendor = Vendor::create([
            'vendor_code' => $code,
            'name' => $request->name,
            'address' => $request->address,
            'phone' => $request->phone,
            'email' => $request->email,
            'print_type' => $request->print_type,
        ]);

        AuditLog::log('create_vendor', 'vendors', $vendor->id, null, $vendor->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data vendor berhasil ditambahkan.',
            'data' => $vendor,
        ], 201);
    }

    public function update(Request $request, $vendor)
    {
        $vendor = $vendor instanceof Vendor ? $vendor : Vendor::findOrFail($vendor);
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'print_type' => 'nullable|string',
        ]);

        $old = $vendor->toArray();
        $vendor->update($request->only(['name', 'address', 'phone', 'email', 'print_type']));

        AuditLog::log('update_vendor', 'vendors', $vendor->id, $old, $vendor->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data vendor berhasil diperbarui.',
            'data' => $vendor,
        ]);
    }

    public function destroy($vendor)
    {
        $vendor = $vendor instanceof Vendor ? $vendor : Vendor::findOrFail($vendor);
        $vendor->delete();
        AuditLog::log('delete_vendor', 'vendors', $vendor->id);

        return response()->json([
            'success' => true,
            'message' => 'Data vendor berhasil dihapus.',
        ]);
    }
}
