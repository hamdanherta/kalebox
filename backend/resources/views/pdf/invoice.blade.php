<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Invoice - {{ $order->order_number }}</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #004582;
            margin: 20px;
            font-size: 12px;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #004582;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #DE0E86;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 2px 0;
            font-size: 11px;
            color: #475569;
        }
        .invoice-title {
            float: right;
            text-align: right;
        }
        .invoice-title h2 {
            margin: 0;
            color: #004582;
            font-size: 20px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 25px;
        }
        .info-table td {
            vertical-align: top;
            padding: 4px;
        }
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        table.items-table th {
            background-color: #004582;
            color: #FFFFFF;
            padding: 8px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
        }
        table.items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #E2E8F0;
        }
        .total-section {
            width: 45%;
            float: right;
            margin-top: 20px;
        }
        .total-section table {
            width: 100%;
            border-collapse: collapse;
        }
        .total-section td {
            padding: 6px 8px;
        }
        .grand-total {
            font-size: 14px;
            font-weight: bold;
            color: #DE0E86;
            border-top: 2px solid #004582;
        }
        .footer {
            clear: both;
            margin-top: 80px;
            text-align: center;
            font-size: 11px;
            border-top: 1px solid #E2E8F0;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="invoice-title">
            <h2>INVOICE PESANAN</h2>
            <p><strong>#{{ $order->order_number }}</strong></p>
            <p>Tanggal: {{ date('d F Y', strtotime($order->created_at)) }}</p>
            <p>Status: <strong>{{ $order->payment_status }}</strong></p>
        </div>
        <h1>{{ $company_name }}</h1>
        <p>{{ $company_address }}</p>
        <p>Telepon: {{ $company_phone }} | Email: kontak@kalebox.id</p>
    </div>

    <table class="info-table">
        <tr>
            <td width="50%">
                <p><strong>DITUJUKAN KEPADA:</strong></p>
                <p style="font-size: 13px; font-weight: bold;">{{ $order->customer_name }}</p>
                <p>No HP: {{ $order->customer_phone }}</p>
                <p>Email: {{ $order->customer_email ?: '-' }}</p>
                @if($order->handover_type === 'Dikirim')
                    <p>Alamat Pengiriman: {{ $order->shipping_address }}</p>
                @else
                    <p>Metode Pengambilan: Ambil Sendiri di Kantor Percetakan</p>
                @endif
            </td>
            <td width="50%">
                <p><strong>DETAIL ESTIMASI & SPESIFIKASI:</strong></p>
                <p>Estimasi Selesai: <strong>{{ date('d F Y', strtotime($order->delivery_date)) }}</strong></p>
                <p>Kategori: {{ $order->category?->name }}</p>
                <p>Finishing: {{ $order->finishing?->name ?? 'Standar' }}</p>
                <p>Cutting: {{ $order->cutting?->name ?? 'Standar' }}</p>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Deskripsi Produk</th>
                <th width="15%" style="text-align: center;">Jumlah (Qty)</th>
                <th width="20%" style="text-align: right;">Harga Satuan</th>
                <th width="20%" style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $order->product?->name }}</strong><br>
                    <small style="color: #64748B;">Bahan: {{ $order->product?->material?->name ?? '-' }} | File: {{ $order->design_file_type }}</small>
                </td>
                <td style="text-align: center;">{{ number_format($order->quantity, 0, ',', '.') }} pcs</td>
                <td style="text-align: right;">Rp {{ number_format($order->unit_price, 0, ',', '.') }}</td>
                <td style="text-align: right;">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="total-section">
        <table>
            <tr>
                <td>Subtotal</td>
                <td style="text-align: right;">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
            </tr>
            @if($order->discount_amount > 0)
            <tr>
                <td>Potongan Diskon Member</td>
                <td style="text-align: right; color: #16A34A;">- Rp {{ number_format($order->discount_amount, 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr class="grand-total">
                <td>Total Tagihan</td>
                <td style="text-align: right;">Rp {{ number_format($order->total_price, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Sudah Dibayar</td>
                <td style="text-align: right; color: #16A34A;">Rp {{ number_format($order->paid_amount, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Sisa Tagihan</td>
                <td style="text-align: right; font-weight: bold; color: #DC2626;">Rp {{ number_format($order->remaining_amount, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Terima kasih atas kepercayaan Anda memesan kemasan di <strong>{{ $company_name }}</strong>.</p>
        <p>Pantau perkembangan pesanan Anda secara online di: <em>http://localhost:5173/pesanan/{{ $order->tracking_token }}</em></p>
    </div>
</body>
</html>
