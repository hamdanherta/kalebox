<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Route name fallback untuk mencegah RouteNotFoundException saat token tidak valid atau kosong
Route::get('/login', function () {
    return response()->json([
        'success' => false,
        'status' => 'error',
        'message' => 'Unauthenticated atau sesi Anda telah berakhir.',
    ], 401);
})->name('login');

// Fallback untuk melayani file storage secara andal di semua web server lokal/Windows
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) {
        abort(404);
    }
    return response()->file($fullPath);
})->where('path', '.*');
