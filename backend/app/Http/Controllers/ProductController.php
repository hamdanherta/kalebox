<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ImageService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Endpoint Publik: Daftar Produk / Katalog
     */
    public function publicIndex(Request $request)
    {
        $query = Product::with(['category', 'material', 'images'])
            ->where('is_active', true);

        // Pencarian
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter Kategori
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Sorting
        $sort = $request->get('sort', 'terbaru');
        switch ($sort) {
            case 'harga_termurah':
                $query->orderBy('unit_price', 'asc');
                break;
            case 'harga_termahal':
                $query->orderBy('unit_price', 'desc');
                break;
            case 'nama_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'nama_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'terbaru':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = $request->get('per_page', 12);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Endpoint Publik: Detail Produk
     */
    public function publicShow($id)
    {
        $product = Product::with([
            'category',
            'material.finishings',
            'material.cuttings',
            'images'
        ])
        ->where('is_active', true)
        ->findOrFail($id);

        // Produk Terkait
        $relatedProducts = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->limit(4)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'related_products' => $relatedProducts,
            ],
        ]);
    }

    /**
     * Endpoint Internal: List Semua Produk (Role 3, 2, 1)
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'material', 'images']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('product_code', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $products = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Tambah Produk Baru (Role 3, 2, 1)
     */
    public function store(Request $request)
    {
        $defaultCatId = \App\Models\ProductCategory::value('id');
        $categoryId = $request->input('category_id') ?: $defaultCatId;
        $unitPrice = $request->input('unit_price') ?? $request->input('base_price') ?? $request->input('price') ?? 0;
        $description = $request->input('description') ?: '-';
        $minOrder = $request->input('min_order') ?: 1;

        $request->merge([
            'category_id' => $categoryId,
            'unit_price' => $unitPrice,
            'description' => $description,
            'min_order' => $minOrder,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'material_id' => 'nullable|exists:materials,id',
            'description' => 'required|string',
            'min_order' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // maks 5MB
            'gallery_images' => 'nullable|array|max:3',
            'gallery_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'is_active' => 'boolean',
        ], [
            'gallery_images.max' => 'Galeri foto produk maksimal 3 gambar.',
            'min_order.min' => 'Minimal order harus lebih besar atau sama dengan 1.',
        ]);

        $count = Product::withTrashed()->count() + 1;
        $code = 'PRD-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $this->imageService->convertToWebp($request->file('cover_image'), 'products', 2048, 88);
        }

        $product = Product::create([
            'product_code' => $code,
            'name' => $request->name,
            'category_id' => $request->category_id,
            'material_id' => $request->material_id,
            'description' => $request->description,
            'min_order' => $request->min_order,
            'unit_price' => $request->unit_price,
            'cover_image' => $coverPath,
            'is_active' => $request->get('is_active', true),
        ]);

        // Simpan Galeri (Maksimal 3 Gambar WebP)
        if ($request->hasFile('gallery_images')) {
            $images = $request->file('gallery_images');
            foreach (array_slice($images, 0, 3) as $idx => $img) {
                $galleryPath = $this->imageService->convertToWebp($img, 'products', 2048, 88);
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $galleryPath,
                    'sort_order' => $idx + 1,
                ]);
            }
        }

        AuditLog::log('create_product', 'products', $product->id, null, $product->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product->load(['category', 'material', 'images']),
        ], 201);
    }

    /**
     * Tampilkan Detail Produk Internal
     */
    public function show($product)
    {
        $product = $product instanceof Product ? $product : Product::findOrFail($product);
        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'material.finishings', 'material.cuttings', 'images']),
        ]);
    }

    /**
     * Update Produk
     */
    public function update(Request $request, $product)
    {
        $product = $product instanceof Product ? $product : Product::findOrFail($product);
        $defaultCatId = $product->category_id ?: \App\Models\ProductCategory::value('id');
        $categoryId = $request->input('category_id') ?: $defaultCatId;
        $unitPrice = $request->input('unit_price') ?? $request->input('base_price') ?? $request->input('price') ?? $product->unit_price ?? 0;
        $description = $request->input('description') ?: $product->description ?: '-';
        $minOrder = $request->input('min_order') ?: $product->min_order ?: 1;

        $request->merge([
            'category_id' => $categoryId,
            'unit_price' => $unitPrice,
            'description' => $description,
            'min_order' => $minOrder,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'material_id' => 'nullable|exists:materials,id',
            'description' => 'required|string',
            'min_order' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'is_active' => 'boolean',
        ]);

        $old = $product->toArray();

        $data = [
            'name' => $request->name,
            'category_id' => $request->category_id,
            'material_id' => $request->material_id,
            'description' => $request->description,
            'min_order' => $request->min_order,
            'unit_price' => $request->unit_price,
            'is_active' => $request->get('is_active', $product->is_active),
        ];

        if ($request->hasFile('cover_image')) {
            $this->imageService->deleteImage($product->cover_image);
            $data['cover_image'] = $this->imageService->convertToWebp($request->file('cover_image'), 'products', 2048, 88);
        }

        $product->update($data);

        // Jika ada unggahan galeri tambahan
        if ($request->hasFile('gallery_images')) {
            $currentCount = $product->images()->count();
            $availableSlots = 3 - $currentCount;

            if ($availableSlots > 0) {
                $images = array_slice($request->file('gallery_images'), 0, $availableSlots);
                foreach ($images as $idx => $img) {
                    $galleryPath = $this->imageService->convertToWebp($img, 'products', 2048, 88);
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $galleryPath,
                        'sort_order' => $currentCount + $idx + 1,
                    ]);
                }
            }
        }

        AuditLog::log('update_product', 'products', $product->id, $old, $product->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->load(['category', 'material', 'images']),
        ]);
    }

    /**
     * Hapus Satu Gambar Galeri
     */
    public function deleteGalleryImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['success' => false, 'message' => 'Gambar tidak sesuai dengan produk.'], 403);
        }

        $this->imageService->deleteImage($image->image_path);
        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Foto galeri berhasil dihapus.',
        ]);
    }

    /**
     * Hapus Produk (Soft Delete)
     */
    public function destroy($product)
    {
        $product = $product instanceof Product ? $product : Product::findOrFail($product);
        $product->delete();
        AuditLog::log('delete_product', 'products', $product->id);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}
