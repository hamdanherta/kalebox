import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Table, Pagination } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { ShieldAlert } from 'lucide-react';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/audit-logs?page=${page}`);
      if (res.data?.status === 'success') {
        const d = res.data.data;
        setLogs(d.data || []);
        setMeta({ current_page: d.current_page || 1, last_page: d.last_page || 1 });
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div>
        <Badge variant="secondary" size="md">Keamanan & Audit</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
          Log Aktivitas Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Rekaman jejak digital tindakan pengguna, verifikasi pesanan, dan perubahan data penting.
        </p>
      </div>

      <Card padding="p-6 md:p-8" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Belum Ada Log Aktivitas"
            description="Aktivitas penting sistem akan tercatat di sini."
          />
        ) : (
          <>
            <Table headers={['Waktu', 'Pengguna', 'Tindakan', 'Keterangan Rinci', 'IP Address']}>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6 font-bold text-[#004582] text-xs">
                    {log.user?.name || 'Sistem Otomatis'}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="primary" size="sm">{log.action}</Badge>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {log.description}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-400">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))}
            </Table>

            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={(p) => fetchLogs(p)}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default AuditLogPage;
