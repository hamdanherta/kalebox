import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Search,
  CheckCircle2,
  Clock,
  Palette,
  Printer,
  PackageCheck,
  AlertTriangle,
  Upload,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Share2,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const OrderTrackPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchToken, setSearchToken] = useState(token || '');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeQris, setActiveQris] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payment upload state
  const [paymentFile, setPaymentFile] = useState(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // Design review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('Oke'); // 'Oke' or 'Belum Pas'
  const [revisionNotes, setRevisionNotes] = useState('');
  const [referenceFile, setReferenceFile] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrderByToken = async (targetToken) => {
    if (!targetToken) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/orders/track/${targetToken}`);
      if (res.data?.status === 'success' || res.data?.success) {
        const payload = res.data.data;
        const orderData = payload?.order || payload;
        setOrder(orderData);
        if (payload?.qris) setActiveQris(payload.qris);
      }
    } catch (err) {
      addToast('Pesanan tidak ditemukan. Periksa kembali token atau nomor pesanan Anda.', 'error');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrderByToken(token);
    }
    // Fetch active QRIS
    api.get('/qris/active').then((res) => {
      if (res.data?.status === 'success') setActiveQris(res.data.data);
    }).catch(() => {});
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchToken.trim()) return;
    navigate(`/pesanan/${searchToken.trim()}`);
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/pesanan/${order.tracking_token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    addToast('Tautan pelacak pesanan berhasil disalin!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    if (!paymentFile) {
      addToast('Silakan pilih file bukti transfer terlebih dahulu', 'warning');
      return;
    }
    setIsUploadingPayment(true);
    try {
      const formData = new FormData();
      formData.append('proof', paymentFile);
      formData.append('payment_proof', paymentFile);

      const res = await api.post(`/orders/track/${order.tracking_token}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success' || res.data?.success) {
        addToast('Bukti transfer pembayaran berhasil diunggah! Tim akan segera memverifikasi.', 'success');
        setPaymentFile(null);
        fetchOrderByToken(order.tracking_token);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran', 'error');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handleSubmitDesignReview = async (e) => {
    e.preventDefault();
    if (reviewDecision === 'Belum Pas' && !revisionNotes.trim()) {
      addToast('Mohon tuliskan catatan revisi dengan jelas', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('decision', reviewDecision);
      formData.append('action', reviewDecision === 'Oke' ? 'approved' : 'revision');
      formData.append('revision_notes', revisionNotes);
      formData.append('notes', revisionNotes);
      if (referenceFile) {
        formData.append('reference_image', referenceFile);
      }

      const res = await api.post(`/orders/track/${order.tracking_token}/review-design`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success' || res.data?.success) {
        addToast(
          reviewDecision === 'Oke'
            ? 'Desain telah Anda setujui (ACC)! Pesanan segera masuk tahap produksi cetak.'
            : 'Catatan revisi telah dikirim ke tim desainer Kalebox.',
          'success'
        );
        setReviewModalOpen(false);
        setRevisionNotes('');
        setReferenceFile(null);
        fetchOrderByToken(order.tracking_token);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengirim ulasan desain', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // 6 Official Statuses (Section 8.4)
  const stages = [
    { key: 'Pesanan Telah Masuk', label: '1. Pesanan Masuk', icon: Clock },
    { key: 'Pesanan Diterima', label: '2. Diterima', icon: CheckCircle2 },
    { key: 'Pesanan Diproses', label: '3. Proses Desain', icon: Palette },
    { key: 'Pesanan Sedang Revisi', label: '4. Tahap Revisi', icon: RotateCcw },
    { key: 'Pesanan Sedang Dicetak', label: '5. Sedang Dicetak', icon: Printer },
    { key: 'Pesanan Siap Diambil/Dikirim', label: '6. Siap / Selesai', icon: PackageCheck },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'Pesanan Telah Masuk': return 0;
      case 'Pesanan Diterima': return 1;
      case 'Pesanan Diproses': return 2;
      case 'Pesanan Sedang Revisi': return 3;
      case 'Pesanan Sedang Dicetak': return 4;
      case 'Pesanan Siap Diambil/Dikirim':
      case 'Selesai':
      case 'selesai':
        return 5;
      default: return 0;
    }
  };

  const currentStageIdx = order ? getStageIndex(order.status) : 0;
  const latestDesign = order?.designs?.[0] || null;
  const isLatestDesignApproved = latestDesign?.status === 'disetujui' || latestDesign?.is_approved;
  const canClientReview = latestDesign && !isLatestDesignApproved && ['Pesanan Diproses', 'Pesanan Sedang Revisi', 'Pesanan Diterima'].includes(order?.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Top Header & Search */}
      <div className="space-y-3">
        <Badge variant="secondary" size="md">Pelacak Pesanan Klien</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight">
          Lacak Status Pesanan & Review Desain
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
          Pantau progres pembuatan kemasan box Anda secara realtime, tinjau hasil karya desainer, dan lakukan persetujuan (ACC) atau ajukan revisian tanpa perlu login.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3 max-w-xl pt-2">
          <Input
            placeholder="Masukkan Token Pelacak atau No. Pesanan..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            icon={Search}
          />
          <Button type="submit" variant="primary" className="flex-shrink-0">
            Lacak Pesanan
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton height="h-28" rounded="rounded-[32px]" />
          <Skeleton height="h-64" rounded="rounded-[32px]" />
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Tracking Share Banner */}
          <div className="bg-[#F0F6FB] p-4 sm:p-5 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-[14px] bg-[#004582] text-white flex items-center justify-center flex-shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#004582]">Tautan Resmi Pemantauan Pesanan</p>
                <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                  {window.location.origin}/pesanan/{order.tracking_token}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-4 py-2 rounded-[14px] bg-white text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all text-xs font-bold shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo, berikut tautan pemantauan progres dan review desain kemasan box pesanan #${order.order_number} di Kalebox: ${window.location.origin}/pesanan/${order.tracking_token}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 rounded-[14px] bg-[#004582] text-white hover:bg-[#003463] transition-all text-xs font-bold shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim WA</span>
              </a>
            </div>
          </div>

          {/* Timeline & Current Status Card */}
          <Card padding="p-6 md:p-8" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nomor Pesanan</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#004582]">{order.order_number}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemesan: <strong className="text-[#004582]">{order.customer_name || order.client?.name}</strong>
                  {order.client?.company_name && ` • ${order.client.company_name}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ['Pesanan Siap Diambil/Dikirim', 'Selesai'].includes(order.status)
                      ? 'success'
                      : order.status === 'Pesanan Sedang Revisi'
                      ? 'primary'
                      : order.status === 'Pesanan Telah Masuk'
                      ? 'warning'
                      : 'secondary'
                  }
                  size="lg"
                >
                  {order.status}
                </Badge>
              </div>
            </div>

            {/* 6-Stage Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {stages.map((stg, idx) => {
                const Icon = stg.icon;
                const isPassed = currentStageIdx >= idx;
                const isCurrent = currentStageIdx === idx;

                return (
                  <div
                    key={stg.key}
                    className={`p-3.5 rounded-[22px] text-center space-y-2 transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#004582] text-white shadow-md'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-[#F0F6FB] text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-white text-[#004582]'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold leading-tight">{stg.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pending Payment Upload Section (if not paid) */}
          {(order.payment_status === 'Belum Dibayar' || order.payment_status === 'Menunggu Pembayaran DP' || order.payment_status === 'Menunggu Pembayaran Lunas') && (
            <Card padding="p-6 md:p-8" className="bg-[#FFFBEB] space-y-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-amber-900">
                    Menunggu Konfirmasi Pembayaran
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Silakan selesaikan pembayaran sebesar{' '}
                    <strong className="text-sm font-extrabold text-[#004582]">
                      Rp {Number(order.total_amount || order.total_price || 0).toLocaleString('id-ID')}
                    </strong>{' '}
                    melalui QRIS di bawah ini lalu unggah foto bukti transfer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 text-center bg-white p-4 rounded-[24px]">
                  <img
                    src={activeQris?.qr_image || '/storage/qris/sample_qris.webp'}
                    alt="QRIS Kalebox"
                    className="w-48 h-48 object-contain mx-auto"
                  />
                  <p className="text-[11px] font-bold text-[#004582] mt-2">
                    {activeQris?.account_name || 'KALEBOX PERCETAKAN MANDIRI'}
                  </p>
                </div>

                <form onSubmit={handleUploadPayment} className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
                      Pilih Foto Bukti Transfer (JPG/PNG/WebP/PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => setPaymentFile(e.target.files[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[16px] file:border-0 file:text-xs file:font-bold file:bg-[#004582] file:text-white cursor-pointer"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isUploadingPayment}
                    icon={Upload}
                  >
                    Kirim Bukti Pembayaran
                  </Button>
                </form>
              </div>
            </Card>
          )}

          {/* Design Review / Approval Section */}
          <Card padding="p-6 md:p-8" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[14px] bg-[#DE0E86]/10 text-[#DE0E86] flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#004582]">
                    Review & Pratinjau Desain Kemasan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periksa pratinjau layout desain box kemasan Anda sebelum dicetak.
                  </p>
                </div>
              </div>

              {canClientReview && (
                <Badge variant="primary" size="md">
                  Menunggu Keputusan Anda
                </Badge>
              )}
            </div>

            {order.designs && order.designs.length > 0 ? (
              <div className="space-y-6">
                {order.designs.map((des) => {
                  const isApproved = des.status === 'disetujui' || des.is_approved;
                  const isExternalLink = des.file_path && (des.file_path.startsWith('http://') || des.file_path.startsWith('https://'));

                  return (
                    <div key={des.id} className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#004582] text-sm">
                          Versi #{des.version_number || des.version}
                        </span>
                        <div className="flex items-center gap-2">
                          {isApproved ? (
                            <Badge variant="success" size="sm">Disetujui (ACC)</Badge>
                          ) : des.status === 'perlu_revisi' ? (
                            <Badge variant="primary" size="sm">Perlu Revisi</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Menunggu Review</Badge>
                          )}
                          <span className="text-slate-400 text-[11px]">
                            {new Date(des.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Design Image Preview */}
                      {des.preview_image && (
                        <div className="max-w-xl mx-auto rounded-[20px] overflow-hidden bg-white p-2 shadow-sm">
                          <img
                            src={des.preview_image}
                            alt={`Pratinjau Desain v${des.version_number || des.version}`}
                            className="w-full max-h-96 object-contain rounded-[14px]"
                          />
                        </div>
                      )}

                      {/* External Link or Master File */}
                      {isExternalLink && (
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-[18px]">
                          <div className="flex items-center gap-2 text-xs text-[#004582] font-semibold truncate mr-2">
                            <ExternalLink className="w-4 h-4 text-[#DE0E86] flex-shrink-0" />
                            <span className="truncate">Tautan Pratinjau Desainer: {des.file_path}</span>
                          </div>
                          <a
                            href={des.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-[12px] bg-[#DE0E86] text-white hover:bg-[#c40b75] transition-all text-xs font-bold inline-flex items-center gap-1 flex-shrink-0 shadow-sm"
                          >
                            <span>Buka Mockup</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Notes from designer */}
                      {des.notes && (
                        <div className="bg-white p-3.5 rounded-[18px] text-xs text-slate-700">
                          <p className="font-bold text-[#004582] mb-0.5">Catatan dari Desainer:</p>
                          <p className="leading-relaxed">{des.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Client Action Buttons: Oke vs Belum Pas */}
                {canClientReview ? (
                  <div className="bg-white p-5 rounded-[24px] shadow-sm space-y-3">
                    <p className="text-xs font-bold text-[#004582]">
                      Apakah hasil desain di atas sudah sesuai dengan keinginan Anda?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="primary"
                        className="flex-1"
                        icon={CheckCircle2}
                        onClick={() => {
                          setReviewDecision('Oke');
                          setReviewModalOpen(true);
                        }}
                      >
                        Oke (Setujui Desain & Naik Cetak)
                      </Button>
                      <Button
                        variant="light"
                        className="flex-1 text-[#DE0E86] hover:bg-rose-50"
                        icon={MessageSquare}
                        onClick={() => {
                          setReviewDecision('Belum Pas');
                          setReviewModalOpen(true);
                        }}
                      >
                        Belum Pas (Minta Revisi Desain)
                      </Button>
                    </div>
                  </div>
                ) : isLatestDesignApproved ? (
                  <div className="bg-emerald-50 text-emerald-900 p-4 rounded-[20px] text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Desain Resmi Di-ACC</p>
                      <p>Desain kemasan telah Anda setujui dan sedang disiapkan untuk proses cetak offset.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F0F6FB] rounded-[24px] space-y-2">
                <Palette className="w-8 h-8 text-[#004582]/40 mx-auto" />
                <p className="text-xs font-bold text-[#004582]">Desain Sedang Dalam Pengerjaan</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Tim desainer grafis Kalebox sedang menyiapkan mockup dan layout kemasan Anda. Pratinjau akan otomatis muncul di sini segera.
                </p>
              </div>
            )}
          </Card>

          {/* Revision History Section (if revisions exist) */}
          {order.revisions && order.revisions.length > 0 && (
            <Card padding="p-6 md:p-8" className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <RotateCcw className="w-5 h-5 text-[#DE0E86]" />
                <h3 className="text-base font-bold text-[#004582]">
                  Riwayat Pengajuan Revisi Klien
                </h3>
              </div>
              <div className="space-y-3">
                {order.revisions.map((rev, rIdx) => (
                  <div key={rev.id || rIdx} className="p-4 bg-[#F0F6FB] rounded-[20px] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#004582]">Permintaan Revisi #{order.revisions.length - rIdx}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 bg-white p-3 rounded-[14px] leading-relaxed">
                      {rev.revision_notes || rev.notes}
                    </p>
                    {rev.reference_image && (
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-slate-500 mb-1">Gambar Acuan:</p>
                        <img
                          src={rev.reference_image}
                          alt="Acuan Revisi"
                          className="w-32 h-32 object-cover rounded-[12px] bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Order Details & Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding="p-6 md:p-8" className="space-y-4">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#DE0E86]" />
                <span>Spesifikasi Box Kemasan</span>
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Model Box:</span>
                  <span className="font-bold text-[#004582]">{order.product?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensi Box:</span>
                  <span className="font-bold text-[#004582]">
                    {order.custom_length_cm} x {order.custom_width_cm} x {order.custom_height_cm} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bahan Kertas:</span>
                  <span className="font-bold text-[#004582]">{order.material?.name || order.product?.material?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finishing:</span>
                  <span className="font-bold text-[#004582]">{order.finishing?.name || 'Tanpa Finishing'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cutting:</span>
                  <span className="font-bold text-[#004582]">{order.cutting?.name || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Cetak:</span>
                  <span className="font-bold text-[#004582]">{order.quantity} pcs</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Biaya:</span>
                  <span className="text-base font-extrabold text-[#DE0E86]">
                    Rp {Number(order.total_amount || order.total_price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </Card>

            <Card padding="p-6 md:p-8" className="space-y-4">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider pb-2 border-b border-slate-100">
                Informasi Pemesan & Pengiriman
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Nama:</span>
                  <span className="font-bold text-[#004582]">{order.customer_name || order.client?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>WhatsApp:</span>
                  <span className="font-bold text-[#004582]">{order.customer_phone || order.client?.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Brand / Perusahaan:</span>
                  <span className="font-bold text-[#004582]">{order.client?.company_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Penyerahan:</span>
                  <span className="font-bold text-[#004582]">{order.handover_type || 'Dikirim'}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-[11px] mb-1">Alamat Tujuan Pengiriman:</p>
                  <p className="text-[#004582] leading-relaxed font-semibold">{order.shipping_address || 'Ambil langsung di pabrik Kalebox'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Review Modal: Oke or Belum Pas */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewDecision === 'Oke' ? 'Persetujuan Desain (ACC)' : 'Pengajuan Catatan Revisi Desain'}
        subtitle={
          reviewDecision === 'Oke'
            ? 'Setelah Anda menyetujui, desain akan langsung masuk ke antrean mesin cetak offset.'
            : 'Tuliskan penyesuaian detail yang Anda inginkan kepada desainer grafis Kalebox.'
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitDesignReview} className="space-y-4 text-left">
          {reviewDecision === 'Belum Pas' ? (
            <>
              <Textarea
                label="Catatan Detail Revisi *"
                required
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Contoh: Tolong ganti warna latar box menjadi navy tua, perbesar logo 20%, dan geser tulisan tagline ke tengah..."
              />

              <div>
                <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
                  Unggah Gambar/Foto Contoh Acuan (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReferenceFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
                />
              </div>
            </>
          ) : (
            <div className="bg-emerald-50 text-emerald-900 p-4 rounded-[20px] text-xs space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Konfirmasi Persetujuan Desain (ACC)
              </p>
              <p className="leading-relaxed">
                Dengan memilih <strong>Oke</strong>, Anda memastikan layout, teks, dimensi ukuran, dan perpaduan warna pada pratinjau sudah sesuai dengan pesanan Anda.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="light"
              className="flex-1"
              onClick={() => setReviewModalOpen(false)}
              disabled={isSubmittingReview}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={reviewDecision === 'Oke' ? 'primary' : 'secondary'}
              className="flex-1"
              isLoading={isSubmittingReview}
            >
              {reviewDecision === 'Oke' ? 'Ya, ACC Desain' : 'Kirim Catatan Revisi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderTrackPage;
