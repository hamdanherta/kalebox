<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Content extends Model
{
    use SoftDeletes;

    // 7 Status Resmi
    const STATUS_IDE       = 'Ide';
    const STATUS_ANTRI     = 'Konten Antri';
    const STATUS_PROSES    = 'Konten Di Proses';
    const STATUS_REVISI    = 'Konten Sedang Revisi';
    const STATUS_OK        = 'Konten Ok';
    const STATUS_SIAP      = 'Konten Siap Tayang';
    const STATUS_TAYANG    = 'Konten Sudah Tayang';

    protected $fillable = [
        'title',
        'brief',
        'caption',
        'idea_user_id',
        'pic_user_id',
        'designer_user_id',
        'uploader_user_id',
        'production_user_id',
        'content_type',
        'platform_id',
        'deadline',
        'publish_schedule',
        'result_link',
        'status',
        'manager_approval',
        'manager_notes',
        'admin_notes',
        'is_high_priority',
        'notes',
    ];

    protected $casts = [
        'is_high_priority' => 'boolean',
        'deadline'         => 'datetime',
        'publish_schedule' => 'datetime',
    ];

    protected $appends = [
        'result_url',
    ];

    public function getResultUrlAttribute()
    {
        return $this->result_link;
    }

    public function ideaUser()
    {
        return $this->belongsTo(User::class, 'idea_user_id');
    }

    public function picUser()
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    public function designerUser()
    {
        return $this->belongsTo(User::class, 'designer_user_id');
    }

    // Alias to designerUser for convenient frontend binding
    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_user_id');
    }

    public function uploaderUser()
    {
        return $this->belongsTo(User::class, 'uploader_user_id');
    }

    public function productionUser()
    {
        return $this->belongsTo(User::class, 'production_user_id');
    }

    public function platform()
    {
        return $this->belongsTo(PromotionPlatform::class, 'platform_id');
    }

    public function statusHistories()
    {
        return $this->hasMany(ContentStatusHistory::class)->orderBy('created_at', 'desc');
    }
}
