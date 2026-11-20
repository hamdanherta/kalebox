<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::withCount('orders');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('client_code', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('client_type')) {
            $query->where('client_type', $request->client_type);
        }

        if ($request->filled('is_member')) {
            $query->where('is_member', filter_var($request->is_member, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15)),
        ]);
    }

    public function show($client)
    {
        $client = $client instanceof Client ? $client : Client::findOrFail($client);
        return response()->json([
            'success' => true,
            'data' => $client->load(['orders.product', 'orders.category']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:255',
            'client_type' => 'required|in:Baru,Lama',
            'is_member' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $count = Client::withTrashed()->count() + 1;
        $code = 'CLN-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        $client = Client::create([
            'client_code' => $code,
            'name' => $request->name,
            'phone' => Client::normalizePhone($request->phone),
            'email' => $request->email ? strtolower(trim($request->email)) : null,
            'client_type' => $request->client_type,
            'is_member' => $request->get('is_member', false),
            'notes' => $request->notes,
        ]);

        AuditLog::log('create_client', 'clients', $client->id, null, $client->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data klien berhasil ditambahkan.',
            'data' => $client,
        ], 201);
    }

    public function update(Request $request, $client)
    {
        $client = $client instanceof Client ? $client : Client::findOrFail($client);
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|email|max:255',
            'client_type' => 'required|in:Baru,Lama',
            'is_member' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $old = $client->toArray();

        $client->update([
            'name' => $request->name,
            'phone' => Client::normalizePhone($request->phone),
            'email' => $request->email ? strtolower(trim($request->email)) : null,
            'client_type' => $request->client_type,
            'is_member' => $request->get('is_member', $client->is_member),
            'notes' => $request->notes,
        ]);

        AuditLog::log('update_client', 'clients', $client->id, $old, $client->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data klien berhasil diperbarui.',
            'data' => $client,
        ]);
    }

    public function destroy($client)
    {
        $client = $client instanceof Client ? $client : Client::findOrFail($client);
        $client->delete();
        AuditLog::log('delete_client', 'clients', $client->id);

        return response()->json([
            'success' => true,
            'message' => 'Data klien berhasil dihapus.',
        ]);
    }
}
