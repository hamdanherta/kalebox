import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { openPdfDocument } from '../../utils/pdfDownloader';
import { ShoppingBag, ArrowRight, FileDown, ExternalLink } from 'lucide-react';

export const MemberOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/member/orders');
        if (res.data?.status === 'success') {
          setOrders(res.data.data?.data || res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load member orders', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Area Pelanggan</Badge>
          <h1 className="text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Riwayat Pesanan Box Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pantau status pesanan, ACC desain, dan unduh dokumen invoice resmi.
          </p>
        </div>

        <Link to="/katalog">
          <Button variant="primary" size="md" icon={ShoppingBag}>
            Pesan Box Baru
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height="h-28" rounded="rounded-[32px]" />
          <Skeleton height="h-28" rounded="rounded-[32px]" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum Ada Pesanan"
          description="Anda belum memiliki riwayat pemesanan box di Kalebox. Mulai buat pesanan kemasan kustom pertama Anda sekarang."
          actionText="Jelajahi Katalog Kemasan"
          onAction={() => window.location.href = '/katalog'}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <Card key={ord.id} padding="p-6 md:p-8" hover className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-[#004582] text-base">{ord.order_number}</span>
                  <Badge
                    variant={
                      ord.status === 'completed'
                        ? 'success'
                        : ord.status === 'pending_payment'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                  >
                    {ord.status_label || ord.status}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(ord.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                  <p className="text-sm font-bold text-[#004582]">{ord.product?.name || 'Box Custom'}</p>
                  <p>
                    {ord.custom_length_cm} x {ord.custom_width_cm} x {ord.custom_height_cm} cm •{' '}
                    {ord.material?.name || 'Bahan Standar'} • {ord.quantity} pcs
                  </p>
                  <p className="font-extrabold text-[#DE0E86] text-sm pt-1">
                    Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Link to={`/pesanan/${ord.tracking_token}`} className="flex-1 md:flex-none">
                  <Button variant="primary" size="sm" className="w-full" icon={ExternalLink}>
                    Lacak / ACC Desain
                  </Button>
                </Link>
                {ord.status !== 'pending_payment' && (
                  <Button
                    variant="light"
                    size="sm"
                    className="flex-1 md:flex-none"
                    icon={FileDown}
                    onClick={() => {
                      openPdfDocument(`/orders/${ord.id}/invoice-pdf`, `invoice_${ord.order_number}`);
                    }}
                  >
                    Invoice PDF
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberOrdersPage;
