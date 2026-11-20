<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Material;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $query = Material::with(['category', 'finishings', 'cuttings']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('material_code', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('name')->paginate($request->get('per_page', 20)),
        ]);
    }

    public function all()
    {
        return response()->json([
            'success' => true,
            'data' => Material::with(['category', 'finishings', 'cuttings'])->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $defaultCatId = \App\Models\ProductCategory::value('id');
        $categoryId = $request->input('category_id') ?: $defaultCatId;
        $price = $request->input('price') ?? $request->input('price_per_unit') ?? 0;

        $request->merge([
            'category_id' => $categoryId,
            'price' => $price,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'finishing_ids' => 'nullable|array',
            'finishing_ids.*' => 'exists:finishings,id',
            'cutting_ids' => 'nullable|array',
            'cutting_ids.*' => 'exists:cuttings,id',
        ]);

        $count = Material::withTrashed()->count() + 1;
        $code = 'BAH-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $material = Material::create([
            'material_code' => $code,
            'name' => $request->name,
            'category_id' => $request->category_id,
            'price' => $request->price,
            'description' => $request->description,
        ]);

        if ($request->has('finishing_ids')) {
            $material->finishings()->sync($request->finishing_ids);
        }

        if ($request->has('cutting_ids')) {
            $material->cuttings()->sync($request->cutting_ids);
        }

        AuditLog::log('create_material', 'material', $material->id, null, $material->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data bahan berhasil ditambahkan.',
            'data' => $material->load(['category', 'finishings', 'cuttings']),
        ], 201);
    }

    public function show($material)
    {
        $material = $material instanceof Material ? $material : Material::findOrFail($material);
        return response()->json([
            'success' => true,
            'data' => $material->load(['category', 'finishings', 'cuttings']),
        ]);
    }

    public function update(Request $request, $material)
    {
        $material = $material instanceof Material ? $material : Material::findOrFail($material);
        $defaultCatId = $material->category_id ?: \App\Models\ProductCategory::value('id');
        $categoryId = $request->input('category_id') ?: $defaultCatId;
        $price = $request->input('price') ?? $request->input('price_per_unit') ?? $material->price ?? 0;

        $request->merge([
            'category_id' => $categoryId,
            'price' => $price,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'finishing_ids' => 'nullable|array',
            'finishing_ids.*' => 'exists:finishings,id',
            'cutting_ids' => 'nullable|array',
            'cutting_ids.*' => 'exists:cuttings,id',
        ]);

        $old = $material->load(['finishings', 'cuttings'])->toArray();

        $material->update([
            'name' => $request->name,
            'category_id' => $request->category_id,
            'price' => $request->price,
            'description' => $request->description,
        ]);

        if ($request->has('finishing_ids')) {
            $material->finishings()->sync($request->finishing_ids);
        }

        if ($request->has('cutting_ids')) {
            $material->cuttings()->sync($request->cutting_ids);
        }

        AuditLog::log('update_material', 'material', $material->id, $old, $material->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Data bahan berhasil diperbarui.',
            'data' => $material->load(['category', 'finishings', 'cuttings']),
        ]);
    }

    public function destroy($material)
    {
        $material = $material instanceof Material ? $material : Material::findOrFail($material);
        $material->delete();
        AuditLog::log('delete_material', 'material', $material->id);

        return response()->json([
            'success' => true,
            'message' => 'Data bahan berhasil dihapus.',
        ]);
    }
}
