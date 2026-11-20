<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'avatar',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function isOwner(): bool
    {
        return $this->role?->name === 'owner';
    }

    public function isManager(): bool
    {
        return $this->role?->name === 'manager';
    }

    public function isAdmin(): bool
    {
        return $this->role?->name === 'admin';
    }

    public function isDesign(): bool
    {
        return $this->role?->name === 'design';
    }

    public function isStaff(): bool
    {
        return $this->role?->name === 'staff';
    }

    public function isMember(): bool
    {
        return $this->role?->name === 'member';
    }

    public function hasRole(array|string $roles): bool
    {
        $roleName = $this->role?->name;
        if (is_array($roles)) {
            return in_array($roleName, $roles);
        }
        return $roleName === $roles;
    }
}
