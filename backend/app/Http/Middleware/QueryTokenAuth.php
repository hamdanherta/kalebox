<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class QueryTokenAuth
{
    /**
     * Handle an incoming request.
     * Mengizinkan otentikasi Bearer token lewat parameter query URL (?token=...)
     * untuk endpoint unduh dokumen PDF (slip gaji, invoice, SPK, presensi).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->has('token')) {
            $token = $request->query('token');
            if (!empty($token)) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
