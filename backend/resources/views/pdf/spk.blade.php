<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Perintah Kerja (SPK) - {{ $order->order_number }}</title>
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
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .header h1 {
            color: #DE0E86;
            margin: 0;
            font-size: 20px;
        }
        .badge-priority {
            display: inline-block;
            background-color: #DC2626;
            color: #FFFFFF;
            padding: 4px 10px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 12px;
        }
        table.spk-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        table.spk-table th {
            background-color: #004582;
            color: #FFFFFF;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
        }
        table.spk-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #E2E8F0;
        }
        .section-title {
            background-color: #F0F6FB;
            font-weight: bold;
            padding: 6px 10px;
            margin-top: 20px;
            border-left: 4px solid #DE0E86;
        }
    </style>
</head>
<body>
    <div class="header">
        @if($order->is_high_priority)
            <div style="float: right;">
                <span class="badge-priority">PRIORITAS TINGGI</span>
            </div>
        @endif
        <h1>{{ $company_name }}</h1>
        <p style="margin: 3px 0 0 0;"><strong>SURAT PERINTAH KERJA (SPK) PRODUKSI</strong></p>
        <p style="margin: 0; font-size: 11px; color: #64748B;">No: {{ $order->order_number }} | Tanggal: {{ date('d F Y') }}</p>
    </div>

    <div class="section-title">1. DATA PEMESAN & DEADLINE</div>
    <table class="spk-table">
        <tr>
            <td width="25%"><strong>Nama Klien</strong></td>
            <td width="25%">{{ $order->customer_name }}</td>
            <td width="25%"><strong>Target Selesai</strong></td>
            <td width="25%"><strong style="color: #DC2626;">{{ date('d F Y', strtotime($order->delivery_date)) }}</strong></td>
        </tr>
        <tr>
            <td><strong>No HP Klien</strong></td>
            <td>{{ $order->customer_phone }}</td>
            <td><strong>Penyerahan</strong></td>
            <td>{{ $order->handover_type }}</td>
        </tr>
        <tr>
            <td><strong>Desainer Bertugas</strong></td>
            <td>{{ $order->designer?->name ?? 'Belum Ditugaskan' }}</td>
            <td><strong>Staff Produksi</strong></td>
            <td>{{ $order->staff?->name ?? 'Belum Ditugaskan' }}</td>
        </tr>
    </table>

    <div class="section-title">2. SPESIFIKASI PRODUKSI & CETAK</div>
    <table class="spk-table">
        <tr>
            <td width="25%"><strong>Nama Produk</strong></td>
            <td colspan="3"><strong>{{ $order->product?->name }}</strong></td>
        </tr>
        <tr>
            <td><strong>Kategori</strong></td>
            <td>{{ $order->category?->name }}</td>
            <td><strong>Jumlah Produksi</strong></td>
            <td><strong style="font-size: 14px; color: #DE0E86;">{{ number_format($order->quantity, 0, ',', '.') }} pcs</strong></td>
        </tr>
        <tr>
            <td><strong>Bahan Baku</strong></td>
            <td colspan="3">{{ $order->product?->material?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>Finishing</strong></td>
            <td>{{ $order->finishing?->name ?? 'Standar' }}</td>
            <td><strong>Cutting / Pond</strong></td>
            <td>{{ $order->cutting?->name ?? 'Standar' }}</td>
        </tr>
        <tr>
            <td><strong>Tipe Desain</strong></td>
            <td>{{ $order->design_file_type }}</td>
            <td><strong>Catatan Khusus</strong></td>
            <td>{{ $order->notes ?: '-' }}</td>
        </tr>
    </table>

    <div style="margin-top: 40px; width: 100%;">
        <table style="width: 100%; text-align: center;">
            <tr>
                <td width="33%">
                    <p>Admin Order,</p>
                    <br><br><br>
                    <p><strong>( _________________ )</strong></p>
                </td>
                <td width="33%">
                    <p>Desainer Grafis,</p>
                    <br><br><br>
                    <p><strong>{{ $order->designer?->name ?? '( _________________ )' }}</strong></p>
                </td>
                <td width="33%">
                    <p>Operator Produksi,</p>
                    <br><br><br>
                    <p><strong>{{ $order->staff?->name ?? '( _________________ )' }}</strong></p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
