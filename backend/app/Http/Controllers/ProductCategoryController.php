<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductCategory::withCount('products');

        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->orderBy('name')->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function all()
    {
        return response()->json([
            'success' => true,
            'data' => ProductCategory::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $count = ProductCategory::withTrashed()->count() + 1;
        $code = 'KAT-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $category = ProductCategory::create([
            'category_code' => $code,
            'name' => $request->name,
        ]);

        AuditLog::log('create_category', 'product_category', $category->id, null, $category->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Kategori produk berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, $category)
    {
        $category = $category instanceof ProductCategory ? $category : ProductCategory::findOrFail($category);
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $old = $category->toArray();
        $category->update(['name' => $request->name]);

        AuditLog::log('update_category', 'product_category', $category->id, $old, $category->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Kategori produk berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    public function destroy($category)
    {
        $category = $category instanceof ProductCategory ? $category : ProductCategory::findOrFail($category);
        if ($category->products()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak dapat dihapus karena masih digunakan oleh produk aktif.',
            ], 422);
        }

        $category->delete();

        AuditLog::log('delete_category', 'product_category', $category->id);

        return response()->json([
            'success' => true,
            'message' => 'Kategori produk berhasil dihapus.',
        ]);
    }
}
