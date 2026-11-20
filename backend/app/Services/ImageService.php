<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    protected ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Konversi gambar yang diunggah ke format WebP resolusi tinggi dan simpan ke disk public
     *
     * @param UploadedFile $file
     * @param string $folder Direktori penyimpanan di disk public (mis. 'products', 'qris', 'attendance')
     * @param int $maxDimension Batas sisi terpanjang (default 2048px)
     * @param int $quality Kualitas kompresi WebP (85-90)
     * @return string URL path relatif (mis. '/storage/products/xyz.webp')
     */
    public function convertToWebp(UploadedFile $file, string $folder = 'uploads', int $maxDimension = 2048, int $quality = 88): string
    {
        $image = $this->manager->read($file->getPathname());

        // Resize proporsional jika melebihi batas sisi terpanjang
        $width = $image->width();
        $height = $image->height();

        if ($width > $maxDimension || $height > $maxDimension) {
            if ($width >= $height) {
                $image->scale(width: $maxDimension);
            } else {
                $image->scale(height: $maxDimension);
            }
        }

        $encoded = $image->toWebp($quality);

        $filename = Str::random(32) . '.webp';
        $path = $folder . '/' . $filename;

        Storage::disk('public')->put($path, (string) $encoded);

        return '/storage/' . $path;
    }

    /**
     * Konversi gambar base64 data URL ke format WebP dan simpan ke disk public
     */
    public function convertBase64ToWebp(string $base64Data, string $folder = 'uploads', int $maxDimension = 2048, int $quality = 88): string
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64Data)) {
            $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
        }
        $data = base64_decode($base64Data);
        $image = $this->manager->read($data);

        $width = $image->width();
        $height = $image->height();

        if ($width > $maxDimension || $height > $maxDimension) {
            if ($width >= $height) {
                $image->scale(width: $maxDimension);
            } else {
                $image->scale(height: $maxDimension);
            }
        }

        $encoded = $image->toWebp($quality);

        $filename = Str::random(32) . '.webp';
        $path = $folder . '/' . $filename;

        Storage::disk('public')->put($path, (string) $encoded);

        return '/storage/' . $path;
    }

    /**
     * Hapus file gambar dari disk public
     */
    public function deleteImage(?string $urlPath): void
    {
        if (!$urlPath || !str_starts_with($urlPath, '/storage/')) {
            return;
        }

        $relativePath = substr($urlPath, strlen('/storage/'));
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }
}
