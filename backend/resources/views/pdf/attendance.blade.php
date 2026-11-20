<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Absensi Karyawan</title>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #004582;
            margin: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #004582;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #DE0E86;
            margin: 0 0 5px 0;
            font-size: 20px;
        }
        .header p {
            margin: 0;
            color: #004582;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #004582;
            color: #FFFFFF;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            text-transform: uppercase;
        }
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #E2E8F0;
        }
        tr:nth-child(even) td {
            background-color: #F8FAFC;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-masuk { background-color: #DCFCE7; color: #16A34A; }
        .badge-tidak { background-color: #FEE2E2; color: #DC2626; }
        .badge-izin { background-color: #FEF3C7; color: #D97706; }
        .badge-menunggu { background-color: #F1F5F9; color: #475569; }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $company_name }}</h1>
        <p><strong>REKAPITULASI PRESENSI HARIAN KARYAWAN</strong></p>
        <p>Tanggal: {{ $date }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Karyawan</th>
                <th>Posisi Kerja</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
                <th>Ketepatan</th>
                <th>Jarak</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $index => $rec)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td><strong>{{ $rec['employee']->name }}</strong><br><small>{{ $rec['employee']->employee_id_number }}</small></td>
                <td>{{ $rec['employee']->position?->name ?? '-' }}</td>
                <td>{{ $rec['check_in'] }}</td>
                <td>{{ $rec['check_out'] }}</td>
                <td>{{ $rec['is_late'] }}</td>
                <td>{{ $rec['distance'] }}</td>
                <td>
                    @if($rec['status'] == 'Masuk')
                        <span class="badge badge-masuk">Masuk</span>
                    @elseif($rec['status'] == 'Tidak Masuk')
                        <span class="badge badge-tidak">Tidak Masuk</span>
                    @elseif($rec['status'] == 'Izin' || $rec['status'] == 'Sakit')
                        <span class="badge badge-izin">{{ $rec['status'] }}</span>
                    @else
                        <span class="badge badge-menunggu">{{ $rec['status'] }}</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Dicetak secara otomatis oleh Sistem Kalebox ERP pada: {{ date('d/m/Y H:i') }} WIB</p>
    </div>
</body>
</html>
