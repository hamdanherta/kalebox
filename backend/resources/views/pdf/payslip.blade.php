<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{ $employee->name }}</title>
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
            font-size: 22px;
        }
        .header p {
            margin: 3px 0 0 0;
            font-size: 11px;
            color: #475569;
        }
        .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .emp-info {
            width: 100%;
            margin-bottom: 20px;
        }
        .emp-info td {
            padding: 4px 8px;
        }
        table.salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.salary-table th {
            background-color: #004582;
            color: #FFFFFF;
            padding: 8px 12px;
            text-align: left;
            font-size: 11px;
        }
        table.salary-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #E2E8F0;
        }
        .total-row {
            background-color: #F8FAFC;
            font-weight: bold;
            font-size: 13px;
        }
        .total-row td {
            color: #DE0E86;
            border-top: 2px solid #004582;
            border-bottom: 2px solid #004582;
        }
        .signatures {
            margin-top: 40px;
            width: 100%;
        }
        .signatures td {
            text-align: center;
            width: 50%;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $company_name }}</h1>
        <p>{{ $company_address }}</p>
    </div>

    <div class="title">SLIP GAJI KARYAWAN</div>

    <table class="emp-info">
        <tr>
            <td width="20%"><strong>Nama Karyawan</strong></td>
            <td width="30%">: {{ $employee->name }}</td>
            <td width="20%"><strong>Periode</strong></td>
            <td width="30%">: Bulan {{ $payroll->period_month }} / {{ $payroll->period_year }}</td>
        </tr>
        <tr>
            <td><strong>No Induk (NIK)</strong></td>
            <td>: {{ $employee->employee_id_number }}</td>
            <td><strong>Posisi / Divisi</strong></td>
            <td>: {{ $employee->position?->name }} ({{ $employee->position?->division?->name }})</td>
        </tr>
        <tr>
            <td><strong>Status Akun</strong></td>
            <td>: {{ $payroll->status }}</td>
            <td><strong>Tanggal Cetak</strong></td>
            <td>: {{ date('d F Y') }}</td>
        </tr>
    </table>

    <table class="salary-table">
        <thead>
            <tr>
                <th>Komponen Pembayaran</th>
                <th width="35%">Keterangan Perhitungan</th>
                <th width="25%" style="text-align: right;">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Gaji Dasar Kehadiran</strong></td>
                <td>{{ $payroll->days_present }} Hari Masuk &times; Rp {{ number_format($payroll->daily_salary, 0, ',', '.') }}</td>
                <td style="text-align: right;">Rp {{ number_format($payroll->basic_salary_total, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td><strong>Upah Lembur</strong></td>
                <td>{{ $payroll->overtime_hours }} Jam Lembur</td>
                <td style="text-align: right;">+ Rp {{ number_format($payroll->overtime_total, 0, ',', '.') }}</td>
            </tr>
            @if($payroll->bonus_amount > 0)
            <tr>
                <td><strong>Bonus / Insentif</strong></td>
                <td>{{ $payroll->bonus?->name ?? 'Bonus Khusus' }}</td>
                <td style="text-align: right;">+ Rp {{ number_format($payroll->bonus_amount, 0, ',', '.') }}</td>
            </tr>
            @endif
            @if($payroll->late_penalty_total > 0)
            <tr>
                <td style="color: #DC2626;"><strong>Potongan Terlambat</strong></td>
                <td style="color: #DC2626;">{{ $payroll->times_late }} Kali Keterlambatan</td>
                <td style="text-align: right; color: #DC2626;">- Rp {{ number_format($payroll->late_penalty_total, 0, ',', '.') }}</td>
            </tr>
            @endif
            <tr class="total-row">
                <td colspan="2">TOTAL GAJI BERSIH (TAKE HOME PAY)</td>
                <td style="text-align: right;">Rp {{ number_format($payroll->net_salary, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 15px; font-size: 11px; color: #64748B;">
        <p><em>Rekap Kehadiran: Masuk {{ $payroll->days_present }} hari | Izin {{ $payroll->days_permission }} hari | Sakit {{ $payroll->days_sick }} hari | Tidak Masuk {{ $payroll->days_absent }} hari.</em></p>
    </div>

    <table class="signatures">
        <tr>
            <td>
                <p>Penerima,</p>
                <br><br><br>
                <p><strong>{{ $employee->name }}</strong></p>
            </td>
            <td>
                <p>Manager Keuangan,</p>
                <br><br><br>
                <p><strong>Ahmad Manager</strong></p>
            </td>
        </tr>
    </table>
</body>
</html>
