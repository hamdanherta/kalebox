<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Order extends Model
{
    use SoftDeletes;

    // 6 Status Resmi (Section 8.4)
    const STATUS_MASUK       = 'Pesanan Telah Masuk';
    const STATUS_DITERIMA    = 'Pesanan Diterima';
    const STATUS_DIPROSES    = 'Pesanan Diproses';
    const STATUS_REVISI      = 'Pesanan Sedang Revisi';
    const STATUS_DICETAK     = 'Pesanan Sedang Dicetak';
    const STATUS_SIAP        = 'Pesanan Siap Diambil/Dikirim';

    protected $fillable = [
        'order_number',
        'tracking_token',
        'client_id',
        'member_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'is_new_customer',
        'product_id',
        'category_id',
        'finishing_id',
        'cutting_id',
        'design_file_type',
        'design_file_path',
        'quantity',
        'unit_price',
        'subtotal',
        'discount_amount',
        'total_price',
        'paid_amount',
        'remaining_amount',
        'payment_method',
        'payment_status',
        'payment_proof',
        'payment_expires_at',
        'handover_type',
        'shipping_address',
        'delivery_date',
        'pickup_or_delivery_date',
        'notes',
        'designer_id',
        'staff_id',
        'vendor_id',
        'status',
        'is_high_priority',
        'deadline',
        'is_deadline_alert_sent',
        'is_ready_notified',
    ];

    protected $casts = [
        'is_new_customer' => 'boolean',
        'is_high_priority' => 'boolean',
        'is_deadline_alert_sent' => 'boolean',
        'is_ready_notified' => 'boolean',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'delivery_date' => 'date',
        'pickup_or_delivery_date' => 'date',
        'payment_expires_at' => 'datetime',
        'deadline' => 'datetime',
    ];

    protected $appends = ['total_amount'];

    public function getTotalAmountAttribute()
    {
        return $this->total_price;
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function finishing()
    {
        return $this->belongsTo(Finishing::class);
    }

    public function cutting()
    {
        return $this->belongsTo(Cutting::class);
    }

    public function designer()
    {
        return $this->belongsTo(User::class, 'designer_id');
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function designs()
    {
        return $this->hasMany(OrderDesign::class)->orderBy('version_number', 'desc');
    }

    public function revisions()
    {
        return $this->hasMany(OrderRevision::class)->orderBy('created_at', 'desc');
    }

    public static function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(4));
        return "ORD-{$date}-{$random}";
    }

    public static function generateTrackingToken(): string
    {
        return Str::random(40);
    }

    public function addStatusHistory(string $status, ?string $notes = null, ?int $userId = null)
    {
        $this->update(['status' => $status]);
        $this->statusHistories()->create([
            'user_id' => $userId,
            'status' => $status,
            'notes' => $notes,
        ]);
    }
}
