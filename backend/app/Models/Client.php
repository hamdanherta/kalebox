<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_code',
        'name',
        'client_type',
        'phone',
        'email',
        'is_member',
        'notes',
    ];

    protected $casts = [
        'is_member' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public static function normalizePhone(string $phone): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($clean, '0')) {
            $clean = '62' . substr($clean, 1);
        } elseif (str_starts_with($clean, '8')) {
            $clean = '628' . substr($clean, 1);
        }
        return $clean;
    }

    public static function findOrCreateFromOrder(string $name, string $phone, ?string $email = null): self
    {
        $normName = trim(strtolower($name));
        $normPhone = self::normalizePhone($phone);
        $normEmail = $email ? trim(strtolower($email)) : null;

        // Cari klien yang nama, no HP, dan email-nya cocok
        $query = self::whereRaw('LOWER(TRIM(name)) = ?', [$normName])
            ->where('phone', $normPhone);

        if ($normEmail) {
            $query->whereRaw('LOWER(TRIM(email)) = ?', [$normEmail]);
        }

        $existing = $query->first();

        if ($existing) {
            return $existing;
        }

        // Generate client code
        $count = self::withTrashed()->count() + 1;
        $code = 'CLN-' . str_pad($count, 5, '0', STR_PAD_LEFT);

        return self::create([
            'client_code' => $code,
            'name' => trim($name),
            'phone' => $normPhone,
            'email' => $normEmail,
            'client_type' => 'Baru',
            'is_member' => false,
        ]);
    }
}
