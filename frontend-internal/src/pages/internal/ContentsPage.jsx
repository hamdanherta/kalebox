import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  Share2,
  Plus,
  ArrowRight,
  ExternalLink,
  Globe,
  Edit2,
  Trash2,
  Layers,
  FileCheck,
  CheckCircle2,
  RotateCcw,
  Link as LinkIcon,
  Eye,
  Copy,
  Check,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
  History,
  Play,
  Send,
  CheckCheck,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';

export const ContentsPage = () => {
  const { addToast } = useToast();
  const { role, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlContentId = searchParams.get('id') || searchParams.get('detailId');

  const userRole = (role || user?.role?.slug || user?.role?.name || '').toLowerCase();
  const isExecutive = ['owner', 'manager'].includes(userRole);

  const [activeTab, setActiveTab] = useState('contents'); // 'contents' or 'platforms'
  const [contents, setContents] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailContent, setDetailContent] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isCopiedCaption, setIsCopiedCaption] = useState(false);

  // Edit / Create Content State
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    platform_id: '',
    content_type: 'feed',
    brief: '',
    caption: '',
    publish_schedule: '',
    designer_user_id: '',
    is_high_priority: false,
  });

  // Delete Content Modal State
  const [deleteContentModalOpen, setDeleteContentModalOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [isDeletingContent, setIsDeletingContent] = useState(false);

  // Advance Status Modal
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [advanceResultUrl, setAdvanceResultUrl] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Platform Modal (Tambah & Edit)
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [platformForm, setPlatformForm] = useState({
    name: '',
    account_link: '',
  });
  const [platformLogo, setPlatformLogo] = useState(null);
  const [isSubmittingPlatform, setIsSubmittingPlatform] = useState(false);

  // Delete Platform Confirm Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState(null);
  const [isDeletingPlatform, setIsDeletingPlatform] = useState(false);

  // Karyawan & Penugasan Tim Konten
  const [employees, setEmployees] = useState([]);

  // Modal 1: Queue Modal (Langkah 2: Admin menaikkan ke Konten Antri & memilih tim)
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [contentToQueue, setContentToQueue] = useState(null);
  const [queueForm, setQueueForm] = useState({
    pic_user_id: '',
    designer_user_id: '',
    production_user_id: '',
    uploader_user_id: '',
    deadline: '',
    publish_schedule: '',
  });
  const [isSubmittingQueue, setIsSubmittingQueue] = useState(false);

  // Modal 2: Submit Work (Langkah 5: Desain klik Ajukan hasil karya)
  const [submitWorkModalOpen, setSubmitWorkModalOpen] = useState(false);
  const [contentToSubmit, setContentToSubmit] = useState(null);
  const [submitWorkForm, setSubmitWorkForm] = useState({
    result_link: '',
    notes: '',
  });
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Modal 3: Admin Review (Langkah 6: Admin tinjau - Revisi / Oke)
  const [adminReviewModalOpen, setAdminReviewModalOpen] = useState(false);
  const [adminReviewContent, setAdminReviewContent] = useState(null);
  const [adminReviewDecision, setAdminReviewDecision] = useState('oke'); // 'oke' or 'revisi'
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [isSubmittingAdminReview, setIsSubmittingAdminReview] = useState(false);

  // Modal 4: Manager Review (Langkah 8: Manager tinjau - Revisi / Oke)
  const [managerReviewModalOpen, setManagerReviewModalOpen] = useState(false);
  const [managerReviewContent, setManagerReviewContent] = useState(null);
  const [managerReviewDecision, setManagerReviewDecision] = useState('oke'); // 'oke' or 'revisi'
  const [managerReviewNotes, setManagerReviewNotes] = useState('');
  const [isSubmittingManagerReview, setIsSubmittingManagerReview] = useState(false);

  // Modal 5: Forward Manager Revision (Langkah 8 Revisi: Admin teruskan revisi Manager ke Desain)
  const [forwardRevisionModalOpen, setForwardRevisionModalOpen] = useState(false);
  const [contentToForward, setContentToForward] = useState(null);
  const [forwardNotes, setForwardNotes] = useState('');
  const [isSubmittingForward, setIsSubmittingForward] = useState(false);

  // Modal 6: Publish Modal (Langkah 10: Mengisi link tayang & menandai Konten Sudah Tayang)
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [contentToPublish, setContentToPublish] = useState(null);
  const [publishResultLink, setPublishResultLink] = useState('');
  const [isSubmittingPublish, setIsSubmittingPublish] = useState(false);

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      let url = '/contents?per_page=50';
      if (selectedStatus) url += `&status=${encodeURIComponent(selectedStatus)}`;
      if (selectedPlatform) url += `&platform_id=${selectedPlatform}`;

      const res = await api.get(url);
      if (res.data?.status === 'success' || res.data?.success) {
        setContents(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load contents', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    setIsLoadingPlatforms(true);
    try {
      const res = await api.get('/promotion-platforms');
      if (res.data?.status === 'success' || res.data?.success) {
        setPlatforms(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load platforms', err);
    } finally {
      setIsLoadingPlatforms(false);
    }
  };

  const fetchAuxiliary = async () => {
    try {
      const [platRes, empRes] = await Promise.all([
        api.get('/promotion-platforms'),
        api.get('/employees?per_page=100'),
      ]);
      if (platRes.data?.status === 'success' || platRes.data?.success) {
        setPlatforms(platRes.data.data || []);
      }
      if (empRes.data?.status === 'success' || empRes.data?.success) {
        const emps = empRes.data.data?.data || empRes.data.data || [];
        const validEmps = emps.filter((e) => e.user_id);
        setEmployees(validEmps);
        setDesigners(validEmps);
      }
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    fetchContents();
    fetchAuxiliary();
  }, [selectedStatus, selectedPlatform]);

  // Buka detail otomatis jika ada query parameter ?id=... atau ?detailId=...
  useEffect(() => {
    if (urlContentId) {
      handleOpenDetail(urlContentId);
    }
  }, [urlContentId]);

  // Content Handlers
  const handleOpenDetail = async (contentOrId) => {
    const id = typeof contentOrId === 'object' ? contentOrId.id : contentOrId;
    if (typeof contentOrId === 'object') {
      setDetailContent(contentOrId);
    }
    setDetailModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const res = await api.get(`/contents/${id}`);
      if (res.data?.status === 'success' || res.data?.success) {
        setDetailContent(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load content detail', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopyCaption = (text) => {
    if (!text) {
      addToast('Belum ada caption untuk disalin.', 'warning');
      return;
    }
    navigator.clipboard.writeText(text);
    setIsCopiedCaption(true);
    addToast('Naskah caption berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopiedCaption(false), 2000);
  };

  const handleOpenCreateContent = () => {
    setEditingContent(null);
    setContentForm({
      title: '',
      platform_id: platforms[0]?.id || '',
      content_type: 'feed',
      brief: '',
      caption: '',
      publish_schedule: '',
      designer_user_id: '',
      is_high_priority: false,
    });
    setContentModalOpen(true);
  };

  const handleOpenEditContent = (content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title || '',
      platform_id: content.platform_id || '',
      content_type: content.content_type || 'feed',
      brief: content.brief || '',
      caption: content.caption || '',
      publish_schedule: content.publish_schedule ? content.publish_schedule.split('T')[0] : '',
      designer_user_id: content.designer_user_id || '',
      is_high_priority: !!content.is_high_priority,
    });
    setContentModalOpen(true);
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    if (!contentForm.title?.trim() || !contentForm.platform_id || !contentForm.brief?.trim()) {
      addToast('Judul, Platform, dan Konsep Brief wajib diisi.', 'error');
      return;
    }

    try {
      if (editingContent) {
        const res = await api.put(`/contents/${editingContent.id}`, contentForm);
        addToast(res.data?.message || 'Konten promosi berhasil diperbarui!', 'success');
        if (detailContent?.id === editingContent.id) {
          handleOpenDetail(editingContent.id);
        }
      } else {
        const res = await api.post('/contents', contentForm);
        addToast(res.data?.message || 'Ide konten promosi berhasil dicatat!', 'success');
      }
      setContentModalOpen(false);
      setEditingContent(null);
      fetchContents();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      const errMsg = firstError || err.response?.data?.message || 'Gagal menyimpan konten promosi';
      addToast(errMsg, 'error');
    }
  };

  // Langkah 2: Admin menaikkan ke Konten Antri & memilih tim
  const handleOpenQueue = (content) => {
    setContentToQueue(content);
    setQueueForm({
      pic_user_id: content.pic_user_id || user?.id || '',
      designer_user_id: content.designer_user_id || '',
      production_user_id: content.production_user_id || '',
      uploader_user_id: content.uploader_user_id || '',
      deadline: content.deadline ? content.deadline.split('T')[0] : (content.publish_schedule ? content.publish_schedule.split('T')[0] : ''),
      publish_schedule: content.publish_schedule ? content.publish_schedule.split('T')[0] : '',
    });
    setQueueModalOpen(true);
  };

  const handleQueueSubmit = async (e) => {
    e.preventDefault();
    if (!contentToQueue) return;
    if (!queueForm.pic_user_id || !queueForm.designer_user_id) {
      addToast('Penanggung Jawab (PIC) dan Desainer wajib dipilih.', 'error');
      return;
    }
    setIsSubmittingQueue(true);
    try {
      const res = await api.put(`/contents/${contentToQueue.id}/queue`, queueForm);
      addToast(res.data?.message || 'Konten berhasil dinaikkan ke Konten Antri & tim ditugaskan!', 'success');
      setQueueModalOpen(false);
      setContentToQueue(null);
      fetchContents();
      if (detailContent?.id === contentToQueue.id) {
        handleOpenDetail(contentToQueue.id);
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      addToast(firstError || err.response?.data?.message || 'Gagal menaikkan konten ke antrian', 'error');
    } finally {
      setIsSubmittingQueue(false);
    }
  };

  // Langkah 4: Desain klik Mulai Kerjakan -> Konten Di Proses
  const handleQuickStartWork = async (content) => {
    try {
      const res = await api.put(`/contents/${content.id}/start-work`);
      addToast(res.data?.message || 'Pekerjaan konten dimulai! Status diubah menjadi Sedang Di Proses.', 'success');
      fetchContents();
      if (detailModalOpen && detailContent?.id === content.id) {
        handleOpenDetail(content.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memulai pengerjaan konten', 'error');
    }
  };

  // Langkah 5: Desain klik Ajukan hasil karya
  const handleOpenSubmitWork = (content) => {
    setContentToSubmit(content);
    setSubmitWorkForm({
      result_link: content.result_link || content.result_url || '',
      notes: '',
    });
    setSubmitWorkModalOpen(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!contentToSubmit) return;
    if (!submitWorkForm.result_link?.trim()) {
      addToast('Tautan link hasil karya wajib diisi.', 'error');
      return;
    }
    setIsSubmittingWork(true);
    try {
      const res = await api.put(`/contents/${contentToSubmit.id}/submit-work`, submitWorkForm);
      addToast(res.data?.message || 'Hasil karya berhasil diajukan ke Admin!', 'success');
      setSubmitWorkModalOpen(false);
      setContentToSubmit(null);
      fetchContents();
      if (detailContent?.id === contentToSubmit.id) {
        handleOpenDetail(contentToSubmit.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengajukan hasil karya', 'error');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Langkah 6: Admin meninjau (Revisi / Oke)
  const handleOpenAdminReview = (content, decision) => {
    setAdminReviewContent(content);
    setAdminReviewDecision(decision);
    setAdminReviewNotes('');
    setAdminReviewModalOpen(true);
  };

  const handleAdminReviewSubmit = async (e) => {
    e.preventDefault();
    if (!adminReviewContent) return;
    if (adminReviewDecision === 'revisi' && !adminReviewNotes.trim()) {
      addToast('Catatan revisi wajib diisi agar desainer memahami perbaikan.', 'error');
      return;
    }
    setIsSubmittingAdminReview(true);
    try {
      const res = await api.put(`/contents/${adminReviewContent.id}/admin-review`, {
        decision: adminReviewDecision,
        notes: adminReviewNotes.trim(),
      });
      addToast(res.data?.message || (adminReviewDecision === 'oke' ? 'Konten disetujui Admin (Konten Ok)!' : 'Catatan revisi dikirimkan ke Desainer!'), 'success');
      setAdminReviewModalOpen(false);
      setAdminReviewContent(null);
      fetchContents();
      if (detailContent?.id === adminReviewContent.id) {
        handleOpenDetail(adminReviewContent.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memproses peninjauan Admin', 'error');
    } finally {
      setIsSubmittingAdminReview(false);
    }
  };

  // Langkah 7: Admin mengajukan konten ke Manager
  const handleSubmitToManager = async (content) => {
    try {
      const res = await api.put(`/contents/${content.id}/submit-to-manager`);
      addToast(res.data?.message || 'Konten berhasil diajukan ke Manager untuk ACC!', 'success');
      fetchContents();
      if (detailContent?.id === content.id) {
        handleOpenDetail(content.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengajukan ke Manager', 'error');
    }
  };

  // Langkah 8: Manager meninjau (Revisi / Oke)
  const handleOpenManagerReview = (content, decision) => {
    setManagerReviewContent(content);
    setManagerReviewDecision(decision);
    setManagerReviewNotes('');
    setManagerReviewModalOpen(true);
  };

  const handleManagerReviewSubmit = async (e) => {
    e.preventDefault();
    if (!managerReviewContent) return;
    if (managerReviewDecision === 'revisi' && !managerReviewNotes.trim()) {
      addToast('Catatan revisi wajib diisi untuk perbaikan.', 'error');
      return;
    }
    setIsSubmittingManagerReview(true);
    try {
      const res = await api.put(`/contents/${managerReviewContent.id}/manager-review`, {
        decision: managerReviewDecision,
        notes: managerReviewNotes.trim(),
      });
      addToast(res.data?.message || (managerReviewDecision === 'oke' ? 'Konten disetujui Manager (ACC)!' : 'Catatan revisi dikembalikan ke Admin.'), 'success');
      setManagerReviewModalOpen(false);
      setManagerReviewContent(null);
      fetchContents();
      if (detailContent?.id === managerReviewContent.id) {
        handleOpenDetail(managerReviewContent.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memproses peninjauan Manager', 'error');
    } finally {
      setIsSubmittingManagerReview(false);
    }
  };

  // Langkah 8 Revisi: Admin meneruskan revisi Manager ke Desainer
  const handleOpenForwardManagerRevision = (content) => {
    setContentToForward(content);
    setForwardNotes(content.manager_notes || '');
    setForwardRevisionModalOpen(true);
  };

  const handleForwardManagerRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!contentToForward) return;
    setIsSubmittingForward(true);
    try {
      const res = await api.put(`/contents/${contentToForward.id}/forward-manager-revision`, {
        notes: forwardNotes,
      });
      addToast(res.data?.message || 'Catatan revisi Manager berhasil diteruskan ke Desainer!', 'success');
      setForwardRevisionModalOpen(false);
      setContentToForward(null);
      fetchContents();
      if (detailContent?.id === contentToForward.id) {
        handleOpenDetail(contentToForward.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal meneruskan revisi ke Desainer', 'error');
    } finally {
      setIsSubmittingForward(false);
    }
  };

  // Langkah 9: Admin menaikkan ke Konten Siap Tayang
  const handleReadyToPublish = async (content) => {
    try {
      const res = await api.put(`/contents/${content.id}/ready-to-publish`);
      addToast(res.data?.message || 'Konten berhasil dinaikkan ke Konten Siap Tayang!', 'success');
      fetchContents();
      if (detailContent?.id === content.id) {
        handleOpenDetail(content.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memajukan ke Siap Tayang', 'error');
    }
  };

  // Langkah 10: Mengisi link tayang & menandai Konten Sudah Tayang
  const handleOpenPublish = (content) => {
    setContentToPublish(content);
    setPublishResultLink(content.result_link || content.result_url || '');
    setPublishModalOpen(true);
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!contentToPublish) return;
    if (!publishResultLink.trim()) {
      addToast('Tautan link live postingan wajib diisi.', 'error');
      return;
    }
    setIsSubmittingPublish(true);
    try {
      const res = await api.put(`/contents/${contentToPublish.id}/mark-published`, {
        result_link: publishResultLink.trim(),
      });
      addToast(res.data?.message || 'Konten berhasil ditandai sebagai Sudah Tayang di Media Sosial!', 'success');
      setPublishModalOpen(false);
      setContentToPublish(null);
      fetchContents();
      if (detailContent?.id === contentToPublish.id) {
        handleOpenDetail(contentToPublish.id);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menandai konten tayang', 'error');
    } finally {
      setIsSubmittingPublish(false);
    }
  };

  const handleConfirmDeleteContent = (content) => {
    if (!isExecutive && role !== 'admin') {
      addToast('Hanya Administrator atau Pimpinan yang dapat menghapus konten.', 'error');
      return;
    }
    setContentToDelete(content);
    setDeleteContentModalOpen(true);
  };

  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    setIsDeletingContent(true);
    try {
      const res = await api.delete(`/contents/${contentToDelete.id}`);
      addToast(res.data?.message || 'Konten promosi berhasil dihapus.', 'success');
      setDeleteContentModalOpen(false);
      setContentToDelete(null);
      if (detailModalOpen && detailContent?.id === contentToDelete.id) {
        setDetailModalOpen(false);
      }
      fetchContents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus konten', 'error');
    } finally {
      setIsDeletingContent(false);
    }
  };

  const [advanceCaption, setAdvanceCaption] = useState('');

  const handleAdvanceStatus = async (e) => {
    e.preventDefault();
    if (!selectedContent) return;
    setIsAdvancing(true);
    try {
      const res = await api.put(`/contents/${selectedContent.id}/advance-status`, {
        notes: advanceNotes,
        result_url: advanceResultUrl,
        caption: advanceCaption,
      });

      if (res.data?.status === 'success' || res.data?.success) {
        addToast('Status alur konten berhasil diperbarui!', 'success');
        setAdvanceModalOpen(false);
        fetchContents();
        if (detailModalOpen && detailContent?.id === selectedContent.id) {
          handleOpenDetail(selectedContent.id);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memajukan status konten', 'error');
    } finally {
      setIsAdvancing(false);
    }
  };

  // Platform Handlers
  const handleOpenCreatePlatform = () => {
    if (!isExecutive) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak menambahkan platform media sosial.', 'error');
      return;
    }
    setEditingPlatform(null);
    setPlatformForm({
      name: '',
      account_link: '',
    });
    setPlatformLogo(null);
    setPlatformModalOpen(true);
  };

  const handleOpenEditPlatform = (platform) => {
    if (!isExecutive) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak mengubah data platform.', 'error');
      return;
    }
    setEditingPlatform(platform);
    setPlatformForm({
      name: platform.name || '',
      account_link: platform.account_link || '',
    });
    setPlatformLogo(null);
    setPlatformModalOpen(true);
  };

  const handleSavePlatform = async (e) => {
    e.preventDefault();
    if (!isExecutive) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak menyimpan perubahan platform.', 'error');
      return;
    }
    if (!platformForm.name.trim()) {
      addToast('Nama platform media sosial wajib diisi.', 'error');
      return;
    }

    setIsSubmittingPlatform(true);
    try {
      const formData = new FormData();
      formData.append('name', platformForm.name.trim());
      if (platformForm.account_link) {
        formData.append('account_link', platformForm.account_link.trim());
      }
      if (platformLogo) {
        formData.append('logo', platformLogo);
      }

      let res;
      if (editingPlatform) {
        // Gunakan endpoint POST dengan id untuk menangani multipart form upload
        res = await api.post(`/promotion-platforms/${editingPlatform.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast(res.data?.message || 'Platform promosi berhasil diperbarui!', 'success');
      } else {
        res = await api.post('/promotion-platforms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast(res.data?.message || 'Platform promosi baru berhasil ditambahkan!', 'success');
      }

      setPlatformModalOpen(false);
      fetchPlatforms();
      fetchContents();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal menyimpan platform promosi.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmittingPlatform(false);
    }
  };

  const handleConfirmDeletePlatform = (platform) => {
    if (!isExecutive) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak menghapus platform media sosial.', 'error');
      return;
    }
    setPlatformToDelete(platform);
    setDeleteModalOpen(true);
  };

  const handleDeletePlatform = async () => {
    if (!isExecutive) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak menghapus platform media sosial.', 'error');
      return;
    }
    if (!platformToDelete) return;
    setIsDeletingPlatform(true);
    try {
      const res = await api.delete(`/promotion-platforms/${platformToDelete.id}`);
      addToast(res.data?.message || 'Platform berhasil dihapus!', 'success');
      setDeleteModalOpen(false);
      setPlatformToDelete(null);
      fetchPlatforms();
      fetchContents();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal menghapus platform.';
      addToast(errMsg, 'error');
    } finally {
      setIsDeletingPlatform(false);
    }
  };

  const getLogoSrc = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  const contentStages = [
    'Ide',
    'Konten Antri',
    'Konten Di Proses',
    'Konten Sedang Revisi',
    'Konten Ok',
    'Konten Siap Tayang',
    'Konten Sudah Tayang',
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Digital Marketing & Promosi</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Manajemen Konten & Platform Media Sosial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola tahapan alur konten promosi serta daftar platform media sosial resmi Kalebox.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'contents' ? (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreateContent}
              className="shadow-sm hover:shadow transition-all"
            >
              Buat Ide Konten Baru
            </Button>
          ) : isExecutive ? (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleOpenCreatePlatform}
              className="shadow-sm hover:shadow transition-all"
            >
              Tambah Platform Baru
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('contents')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
            activeTab === 'contents'
              ? 'bg-[#DE0E86] text-white shadow-md shadow-[#DE0E86]/20'
              : 'bg-white text-[#004582] hover:bg-[#F0F6FB] border border-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Alur Konten Promosi</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            activeTab === 'contents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {contents.length}
          </span>
        </button>

        {isExecutive && (
          <button
            onClick={() => {
              setActiveTab('platforms');
              fetchPlatforms();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
              activeTab === 'platforms'
                ? 'bg-[#DE0E86] text-white shadow-md shadow-[#DE0E86]/20'
                : 'bg-white text-[#004582] hover:bg-[#F0F6FB] border border-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Data Platform Media Sosial</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'platforms' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {platforms.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: KONTEN PROMOSI */}
      {activeTab === 'contents' && (
        <div className="space-y-4">
          {/* Status Bar Filter */}
          <div className="bg-[#F0F6FB] p-2 rounded-[22px] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none border border-slate-100">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedStatus('')}
                className={`px-4 py-2 rounded-[16px] text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStatus === '' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582] hover:text-[#DE0E86]'
                }`}
              >
                Semua Tahap
              </button>
              {contentStages.map((stg) => (
                <button
                  key={stg}
                  onClick={() => setSelectedStatus(stg)}
                  className={`px-4 py-2 rounded-[16px] text-xs font-bold transition-all whitespace-nowrap ${
                    selectedStatus === stg ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582] hover:text-[#DE0E86]'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>

            {/* Filter by Platform */}
            <div className="flex-shrink-0 pr-1">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="text-xs font-bold bg-white text-[#004582] border border-slate-200 rounded-[14px] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#DE0E86]/30"
              >
                <option value="">Semua Platform</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Table */}
          <Card padding="p-6 md:p-8" className="space-y-4 border border-slate-100 shadow-sm">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton height="h-16" rounded="rounded-[20px]" />
                <Skeleton height="h-16" rounded="rounded-[20px]" />
                <Skeleton height="h-16" rounded="rounded-[20px]" />
              </div>
            ) : contents.length === 0 ? (
              <EmptyState
                icon={Share2}
                title="Tidak Ada Konten Promosi"
                description="Belum ada rencana konten promosi pada status atau filter yang dipilih."
              />
            ) : (
              <Table
                headers={[
                  'Judul / Topik Konten',
                  'Platform',
                  'Jadwal Tayang',
                  'Desainer / PIC',
                  'Status Alur',
                  'Hasil Desain',
                  'Aksi Konten',
                ]}
              >
                {contents.map((cnt) => (
                  <tr key={cnt.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                    {/* Judul & Brief Singkat (Bisa diklik untuk melihat detail) */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(cnt)}
                        className="text-left group cursor-pointer block max-w-xs sm:max-w-sm"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-extrabold text-[#004582] group-hover:text-[#DE0E86] transition-colors leading-snug">
                            {cnt.title}
                          </p>
                          {cnt.is_high_priority && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                              Prioritas
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {cnt.brief || cnt.concept_brief || 'Klik untuk lihat detail brief'}
                        </p>
                      </button>
                    </td>

                    {/* Platform Media Sosial */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
                        {cnt.platform?.logo ? (
                          <img
                            src={getLogoSrc(cnt.platform.logo)}
                            alt=""
                            className="w-3.5 h-3.5 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <Globe className="w-3 h-3 text-[#DE0E86]" />
                        )}
                        <span>{cnt.platform?.name || 'Sosial Media'}</span>
                      </div>
                    </td>

                    {/* Jadwal Publikasi */}
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {cnt.publish_schedule ? (
                        <div>
                          <p className="font-bold text-slate-700">
                            {new Date(cnt.publish_schedule).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <span className="text-[10px] text-slate-400">Target Tayang</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Fleksibel</span>
                      )}
                    </td>

                    {/* Desainer / PIC */}
                    <td className="py-4 px-6 text-xs font-semibold text-[#004582]">
                      <p className="font-bold">{cnt.designer?.name || cnt.designerUser?.name || '-'}</p>
                      {cnt.picUser && cnt.picUser?.name !== cnt.designer?.name && (
                        <p className="text-[10px] text-slate-500 font-normal">PIC: {cnt.picUser.name}</p>
                      )}
                    </td>

                    {/* Status Alur */}
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          cnt.status === 'Konten Sudah Tayang'
                            ? 'success'
                            : cnt.status === 'Konten Siap Tayang'
                            ? 'primary'
                            : cnt.status === 'Konten Sedang Revisi'
                            ? 'danger'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {cnt.status}
                      </Badge>
                    </td>

                    {/* Hasil Konten / File Link */}
                    <td className="py-4 px-6">
                      {cnt.result_url || cnt.result_link ? (
                        <a
                          href={cnt.result_url || cnt.result_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#DE0E86] font-bold underline inline-flex items-center gap-1 hover:text-[#004582] transition-colors"
                        >
                          <span>Buka File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Belum Ada</span>
                      )}
                    </td>

                    {/* Aksi Lengkap: Detail, Lanjut, Edit, Hapus */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Tombol Detail Lengkap */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(cnt)}
                          className="px-2.5 py-1.5 rounded-[12px] bg-[#004582]/10 text-[#004582] hover:bg-[#004582] hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                          title="Lihat Detail Lengkap Konten"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {/* Langkah 2: Tugaskan Tim & Antrikan (Tahap Ide) */}
                        {cnt.status === 'Ide' && (isExecutive || role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleOpenQueue(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-[#004582] text-white hover:bg-[#003362] transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Tugaskan Tim (PIC, Desain, Produksi, Upload) & Antrikan"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Tugaskan Tim</span>
                          </button>
                        )}

                        {/* Langkah 4: Mulai Kerjakan (Tahap Konten Antri) */}
                        {cnt.status === 'Konten Antri' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStartWork(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-[#004582] text-white hover:bg-[#003362] transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Mulai Kerjakan Konten Ini"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Mulai</span>
                          </button>
                        )}

                        {/* Langkah 5: Desain klik Ajukan (Tahap Di Proses / Sedang Revisi) */}
                        {(cnt.status === 'Konten Di Proses' || cnt.status === 'Konten Sedang Revisi') && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmitWork(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-[#DE0E86] text-white hover:bg-pink-700 transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Ajukan Hasil Karya Konten ke Admin"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Ajukan</span>
                          </button>
                        )}

                        {/* Langkah 6: Admin Tinjau Desain yang Diajukan (Revisi / Oke) */}
                        {(cnt.status === 'Konten Di Proses' || cnt.status === 'Konten Sedang Revisi') && (cnt.result_link || cnt.result_url) && (isExecutive || role === 'admin') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenAdminReview(cnt, 'revisi')}
                              className="px-2 py-1.5 rounded-[12px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                              title="Minta Revisi Desain"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdminReview(cnt, 'oke')}
                              className="px-2 py-1.5 rounded-[12px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                              title="Setujui Desain (Konten Ok)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Oke</span>
                            </button>
                          </>
                        )}

                        {/* Langkah 7: Admin Ajukan ke Manager (Tahap Konten Ok) */}
                        {cnt.status === 'Konten Ok' && !cnt.manager_approval && (isExecutive || role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleSubmitToManager(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-[#004582] text-white hover:bg-[#003362] transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Ajukan ke Manager untuk Persetujuan Penayangan"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Ke Manager</span>
                          </button>
                        )}

                        {/* Langkah 8: Manager Tinjau Persetujuan (Revisi / ACC) */}
                        {cnt.manager_approval === 'menunggu' && isExecutive && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenManagerReview(cnt, 'revisi')}
                              className="px-2 py-1.5 rounded-[12px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                              title="Manager Minta Revisi"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenManagerReview(cnt, 'oke')}
                              className="px-2 py-1.5 rounded-[12px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                              title="Setujui Konten (ACC Manager)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ACC</span>
                            </button>
                          </>
                        )}

                        {/* Langkah 8b: Admin Teruskan Revisi Manager ke Desainer */}
                        {cnt.manager_approval === 'revisi' && (isExecutive || role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleOpenForwardManagerRevision(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-amber-500 text-white hover:bg-amber-600 transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Teruskan Catatan Revisi Manager ke Desainer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Teruskan Revisi</span>
                          </button>
                        )}

                        {/* Langkah 9: Admin Naikkan ke Siap Tayang (Setelah ACC Manager) */}
                        {cnt.manager_approval === 'disetujui' && cnt.status === 'Konten Ok' && (isExecutive || role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleReadyToPublish(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-[#DE0E86] text-white hover:bg-pink-700 transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Naikkan ke Konten Siap Tayang"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Siap Tayang</span>
                          </button>
                        )}

                        {/* Langkah 10: Tandai Konten Sudah Tayang */}
                        {cnt.status === 'Konten Siap Tayang' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPublish(cnt)}
                            className="px-2.5 py-1.5 rounded-[12px] bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                            title="Isi Link Hasil & Tandai Konten Sudah Tayang"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Tayangkan</span>
                          </button>
                        )}

                        {/* Tombol Edit (Executive / Admin) */}
                        {(isExecutive || role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditContent(cnt)}
                            className="p-1.5 rounded-[12px] text-slate-400 hover:text-[#004582] hover:bg-slate-100 transition-all"
                            title="Edit Data Konten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Tombol Hapus (Executive) */}
                        {isExecutive && (
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteContent(cnt)}
                            className="p-1.5 rounded-[12px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Hapus Konten"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: DATA PLATFORM MEDIA SOSIAL (Hanya untuk Owner & Manager) */}
      {activeTab === 'platforms' && isExecutive && (
        <Card padding="p-6 md:p-8" className="space-y-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-[#004582]">Daftar Platform Media Sosial Promosi</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tambahkan platform media sosial (Instagram, TikTok, YouTube, dll) tempat publikasi promosi kemasan box Kalebox.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenCreatePlatform}
              className="shadow-sm hover:shadow"
            >
              Tambah Platform
            </Button>
          </div>

          {isLoadingPlatforms ? (
            <div className="space-y-3">
              <Skeleton height="h-16" rounded="rounded-[20px]" />
              <Skeleton height="h-16" rounded="rounded-[20px]" />
            </div>
          ) : platforms.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="Belum Ada Platform Media Sosial"
              description="Klik tombol 'Tambah Platform' di atas untuk menambahkan media promosi baru."
            />
          ) : (
            <Table
              headers={[
                'Platform Promosi',
                'Tautan Akun / Profil',
                'Jumlah Konten Terkait',
                'Aksi Kelola',
              ]}
            >
              {platforms.map((p) => {
                const logoSrc = getLogoSrc(p.logo);

                return (
                  <tr key={p.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                    {/* Platform Name & Logo */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={p.name}
                              className="w-full h-full object-contain rounded-[8px]"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <Globe className={`w-5 h-5 text-[#DE0E86] ${logoSrc ? 'hidden' : 'block'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-[#004582] text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">ID Platform: #{p.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Account Link */}
                    <td className="py-4 px-6 text-xs font-medium">
                      {p.account_link ? (
                        <a
                          href={p.account_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#004582] font-bold hover:text-[#DE0E86] hover:underline"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="max-w-xs truncate">{p.account_link}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Belum diatur</span>
                      )}
                    </td>

                    {/* Content Count */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#004582] border border-sky-100">
                        <Layers className="w-3 h-3 text-sky-500" />
                        <span>{p.contents_count ?? 0} Konten</span>
                      </span>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditPlatform(p)}
                          className="p-2 rounded-[12px] bg-slate-100 text-slate-600 hover:bg-[#004582] hover:text-white transition-all shadow-2xs"
                          title="Edit Platform"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleConfirmDeletePlatform(p)}
                          className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-2xs"
                          title="Hapus Platform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* MODAL: Tambah / Edit Platform */}
      <Modal
        isOpen={platformModalOpen}
        onClose={() => setPlatformModalOpen(false)}
        title={editingPlatform ? 'Edit Platform Promosi' : 'Tambah Platform Media Sosial'}
        subtitle={editingPlatform ? `Perbarui data untuk platform ${editingPlatform.name}` : 'Daftarkan saluran promosi baru untuk konten Kalebox'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSavePlatform} className="space-y-4 text-left">
          <Input
            label="Nama Platform"
            required
            value={platformForm.name}
            onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
            placeholder="Contoh: Instagram, TikTok, YouTube, Facebook, WhatsApp Channel..."
          />

          <Input
            label="Tautan Akun / Link Profil (Opsional)"
            type="text"
            value={platformForm.account_link}
            onChange={(e) => setPlatformForm({ ...platformForm, account_link: e.target.value })}
            placeholder="Contoh: https://instagram.com/kalebox.id atau https://tiktok.com/@kalebox"
          />

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              Logo / Icon Platform (Opsional)
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={(e) => setPlatformLogo(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-[12px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Format didukung: PNG, JPG, WEBP, SVG (Maks. 2MB)</p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlatformModalOpen(false)}
              disabled={isSubmittingPlatform}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmittingPlatform}
              disabled={isSubmittingPlatform}
              className="shadow-sm"
            >
              {isSubmittingPlatform ? 'Menyimpan...' : (editingPlatform ? 'Simpan Perubahan' : 'Tambahkan Platform')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Konfirmasi Hapus Platform */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Platform Promosi"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus platform <strong className="text-[#004582]">{platformToDelete?.name}</strong>?
          </p>

          {platformToDelete?.contents_count > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[14px] text-xs font-medium">
              Platform ini masih memiliki <strong>{platformToDelete.contents_count} konten</strong> terkait. Hapus atau pindahkan konten terlebih dahulu sebelum menghapus platform ini.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeletingPlatform}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={isDeletingPlatform}
              disabled={isDeletingPlatform || (platformToDelete?.contents_count > 0)}
              onClick={handleDeletePlatform}
              icon={Trash2}
            >
              Hapus Platform
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Tambah / Edit Konten */}
      <Modal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setEditingContent(null);
        }}
        title={editingContent ? 'Edit Konten Promosi' : 'Catat Ide Konten Baru'}
        subtitle={editingContent ? `Ubah data untuk konten "${editingContent.title}"` : 'Tuliskan ide konten kreatif untuk tim digital marketing'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveContent} className="space-y-4 text-left">
          <Input
            label="Judul / Topik Utama"
            required
            value={contentForm.title}
            onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
            placeholder="Contoh: Video Edukasi Kertas Food Grade vs Biasa"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Platform Media Sosial"
              required
              value={contentForm.platform_id}
              onChange={(e) => setContentForm({ ...contentForm, platform_id: e.target.value })}
            >
              <option value="">Pilih Platform...</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            <Select
              label="Format Konten"
              value={contentForm.content_type}
              onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
            >
              <option value="feed">Feed Post (Gambar)</option>
              <option value="reels">Reels / Video Pendek</option>
              <option value="carousel">Carousel Multi-Slide</option>
              <option value="stories">Stories</option>
              <option value="flyer">Flyer Digital</option>
            </Select>
          </div>

          <Textarea
            label="Konsep & Brief Ringkas"
            required
            rows={3}
            value={contentForm.brief}
            onChange={(e) => setContentForm({ ...contentForm, brief: e.target.value })}
            placeholder="Poin-poin penting, pesan utama, visual yang diinginkan, hook video..."
          />

          <Textarea
            label="Naskah / Caption Copywriting (Opsional)"
            rows={3}
            value={contentForm.caption}
            onChange={(e) => setContentForm({ ...contentForm, caption: e.target.value })}
            placeholder="Tuliskan naskah caption, hashtag, atau call-to-action (CTA)..."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Tanggal Tayang"
              type="date"
              value={contentForm.publish_schedule}
              onChange={(e) => setContentForm({ ...contentForm, publish_schedule: e.target.value })}
            />
            <Select
              label="Tugaskan Desainer / PIC"
              value={contentForm.designer_user_id}
              onChange={(e) => setContentForm({ ...contentForm, designer_user_id: e.target.value })}
            >
              <option value="">Pilih PIC...</option>
              {designers.map((d) => (
                <option key={d.user_id} value={d.user_id}>{d.name}</option>
              ))}
            </Select>
          </div>

          {/* Toggle Prioritas Tinggi */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={contentForm.is_high_priority}
              onChange={(e) => setContentForm({ ...contentForm, is_high_priority: e.target.checked })}
              className="w-4 h-4 text-[#DE0E86] rounded focus:ring-[#DE0E86]"
            />
            <span className="text-xs font-bold text-slate-700">
              Tandai sebagai Prioritas Tinggi (Urgent)
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContentModalOpen(false);
                setEditingContent(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="shadow-md">
              {editingContent ? 'Simpan Perubahan' : 'Simpan Ide Konten'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Konfirmasi Hapus Konten */}
      <Modal
        isOpen={deleteContentModalOpen}
        onClose={() => setDeleteContentModalOpen(false)}
        title="Hapus Konten Promosi"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menghapus konten <strong className="text-[#004582]">{contentToDelete?.title}</strong>?
          </p>
          <p className="text-xs text-slate-400">
            Tindakan ini akan memindahkan konten ke arsip tempat sampah dan tidak akan tampil lagi di alur promosi aktif.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteContentModalOpen(false)}
              disabled={isDeletingContent}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={isDeletingContent}
              disabled={isDeletingContent}
              onClick={handleDeleteContent}
              icon={Trash2}
            >
              Hapus Konten
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Detail Konten Lengkap */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="max-w-3xl"
      >
        {isLoadingDetail && !detailContent ? (
          <div className="space-y-4 py-8">
            <Skeleton height="h-10" rounded="rounded-2xl" />
            <Skeleton height="h-28" rounded="rounded-2xl" />
            <Skeleton height="h-36" rounded="rounded-2xl" />
          </div>
        ) : detailContent ? (
          <div className="space-y-6 text-left">
            {/* Header: Platform, Format, Status, Priority */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Platform Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#004582] text-xs font-bold border border-slate-200">
                  {detailContent.platform?.logo ? (
                    <img
                      src={getLogoSrc(detailContent.platform.logo)}
                      alt=""
                      className="w-4 h-4 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-[#DE0E86]" />
                  )}
                  <span>{detailContent.platform?.name || 'Sosial Media'}</span>
                  {detailContent.platform?.account_link && (
                    <a
                      href={detailContent.platform.account_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#DE0E86] hover:underline"
                      title="Buka profil akun"
                    >
                      <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                    </a>
                  )}
                </div>

                {/* Content Type Pill */}
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#004582]/10 text-[#004582] uppercase tracking-wider">
                  {detailContent.content_type || 'Feed'}
                </span>

                {/* Status Badge */}
                <Badge
                  variant={
                    detailContent.status === 'Konten Sudah Tayang'
                      ? 'success'
                      : detailContent.status === 'Konten Siap Tayang'
                      ? 'primary'
                      : detailContent.status === 'Konten Sedang Revisi'
                      ? 'danger'
                      : 'secondary'
                  }
                  size="md"
                >
                  {detailContent.status}
                </Badge>

                {/* High Priority Badge */}
                {detailContent.is_high_priority && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold uppercase tracking-wider border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prioritas Tinggi</span>
                  </span>
                )}
              </div>

              {/* Quick Actions at Top Right */}
              <div className="flex items-center gap-1.5">
                {(isExecutive || role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenEditContent(detailContent);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-[#004582] hover:bg-slate-100 transition-colors"
                    title="Edit Data Konten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {isExecutive && (
                  <button
                    type="button"
                    onClick={() => handleConfirmDeleteContent(detailContent)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Konten"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Key Schedule Metadata */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#004582] tracking-tight leading-snug">
                {detailContent.title}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Tayang
                  </span>
                  <strong className="text-[#004582] font-extrabold text-xs sm:text-sm mt-0.5 block">
                    {detailContent.publish_schedule
                      ? new Date(detailContent.publish_schedule).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Fleksibel'}
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Batas Pengerjaan
                  </span>
                  <strong className="text-slate-700 font-extrabold text-xs sm:text-sm mt-0.5 block">
                    {detailContent.deadline
                      ? new Date(detailContent.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Sesuai Jadwal'}
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Diusulkan Oleh
                  </span>
                  <strong className="text-slate-700 font-extrabold text-xs sm:text-sm mt-0.5 block truncate">
                    {detailContent.idea_user?.name || detailContent.ideaUser?.name || 'Tim Marketing'}
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tanggal Dicatat
                  </span>
                  <strong className="text-slate-700 font-extrabold text-xs sm:text-sm mt-0.5 block">
                    {detailContent.created_at
                      ? new Date(detailContent.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '-'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Status Information Banner */}
            <div className={`p-4 rounded-[20px] border flex items-start gap-3 text-xs leading-relaxed ${
              detailContent.status === 'Ide'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : detailContent.status === 'Konten Antri'
                ? 'bg-sky-50/70 border-sky-200 text-sky-900'
                : detailContent.status === 'Konten Di Proses'
                ? (detailContent.result_link || detailContent.result_url ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-blue-50 border-blue-200 text-blue-900')
                : detailContent.status === 'Konten Sedang Revisi'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : detailContent.status === 'Konten Ok'
                ? (detailContent.manager_approval === 'menunggu' ? 'bg-amber-50 border-amber-200 text-amber-900' : detailContent.manager_approval === 'revisi' ? 'bg-rose-50 border-rose-200 text-rose-900' : detailContent.manager_approval === 'disetujui' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900')
                : detailContent.status === 'Konten Siap Tayang'
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-current mt-1 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <p className="font-extrabold uppercase tracking-wider text-[11px]">
                  Tahapan Saat Ini: {detailContent.status}
                  {detailContent.manager_approval && ` (Manager: ${detailContent.manager_approval})`}
                </p>
                <p className="font-medium text-xs">
                  {detailContent.status === 'Ide' && 'Ide konten telah dicatat. Admin silakan menaikkan ke "Konten Antri" dan memilih Penanggung Jawab, Desain, Produksi, dan Upload.'}
                  {detailContent.status === 'Konten Antri' && 'Konten berada di antrean pengerjaan. Desainer grafis yang ditugaskan dapat mengklik "Mulai Kerjakan".'}
                  {detailContent.status === 'Konten Di Proses' && !(detailContent.result_link || detailContent.result_url) && 'Desainer sedang memproses desain konten. Jika selesai, klik "Ajukan Hasil Karya" dengan menyertakan tautan desain.'}
                  {detailContent.status === 'Konten Di Proses' && (detailContent.result_link || detailContent.result_url) && 'Desainer telah mengajukan draf hasil karya! Admin silakan meninjau: pilih "Revisi" atau "Oke".'}
                  {detailContent.status === 'Konten Sedang Revisi' && (
                    detailContent.manager_notes
                      ? `Revisi dari Manager: "${detailContent.manager_notes}". Desainer sedang memperbaiki materi.`
                      : detailContent.admin_notes
                      ? `Revisi dari Admin: "${detailContent.admin_notes}". Desainer sedang memperbaiki materi.`
                      : 'Konten dalam tahap perbaikan / revisi oleh Desainer.'
                  )}
                  {detailContent.status === 'Konten Ok' && !detailContent.manager_approval && 'Admin telah menyetujui hasil desain (Oke)! Klik "Ajukan ke Manager" untuk memohon persetujuan penayangan.'}
                  {detailContent.status === 'Konten Ok' && detailContent.manager_approval === 'menunggu' && 'Konten telah diajukan ke Manager. Menunggu Manager meninjau dan memberikan persetujuan (ACC).'}
                  {detailContent.status === 'Konten Ok' && detailContent.manager_approval === 'revisi' && `Manager meminta perbaikan dengan catatan: "${detailContent.manager_notes}". Admin silakan teruskan revisi ke Desainer.`}
                  {detailContent.status === 'Konten Ok' && detailContent.manager_approval === 'disetujui' && 'Manager telah menyetujui konten ini (ACC Disetujui)! Admin sekarang dapat menaikkannya ke "Konten Siap Tayang".'}
                  {detailContent.status === 'Konten Siap Tayang' && `Konten siap diposting ke media sosial oleh Tim Upload (${detailContent.uploader_user?.name || detailContent.uploaderUser?.name || 'Petugas Upload'}).`}
                  {detailContent.status === 'Konten Sudah Tayang' && 'Konten promosi telah resmi dipublikasikan di platform media sosial.'}
                </p>
              </div>
            </div>

            {/* Section 1: Konsep & Brief Kreatif */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#DE0E86]" />
                <h4 className="text-xs font-extrabold text-[#004582] uppercase tracking-wider">
                  Konsep & Brief Kreatif Konten
                </h4>
              </div>
              <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-normal">
                {detailContent.brief || 'Belum ada brief rinci yang dituliskan.'}
              </div>
            </div>

            {/* Section 2: Copywriting & Naskah Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#DE0E86]" />
                  <h4 className="text-xs font-extrabold text-[#004582] uppercase tracking-wider">
                    Naskah & Caption Copywriting
                  </h4>
                </div>
                {detailContent.caption && (
                  <button
                    type="button"
                    onClick={() => handleCopyCaption(detailContent.caption)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DE0E86]/10 text-[#DE0E86] hover:bg-[#DE0E86] hover:text-white transition-all shadow-2xs"
                  >
                    {isCopiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedCaption ? 'Tersalin!' : 'Salin Caption'}</span>
                  </button>
                )}
              </div>
              <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {detailContent.caption ? (
                  detailContent.caption
                ) : (
                  <span className="text-slate-400 italic">
                    Belum ada naskah caption. Naskah dapat ditambahkan atau diperbarui oleh PIC / Desainer selama alur pengerjaan.
                  </span>
                )}
              </div>
            </div>

            {/* Section 3: Tautan Hasil Desain / Konten */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#DE0E86]" />
                <h4 className="text-xs font-extrabold text-[#004582] uppercase tracking-wider">
                  Hasil Karya / Tautan Desain & File
                </h4>
              </div>
              {detailContent.result_url || detailContent.result_link ? (
                <div className="p-4 rounded-[20px] bg-[#F0F6FB] border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs font-bold text-[#004582]">Tautan File / Postingan Resmi:</p>
                    <p className="text-xs text-slate-600 truncate underline font-medium">
                      {detailContent.result_url || detailContent.result_link}
                    </p>
                  </div>
                  <a
                    href={detailContent.result_url || detailContent.result_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="primary" size="sm" icon={ExternalLink} className="flex-shrink-0 shadow-sm">
                      Buka File
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="p-3.5 rounded-[18px] bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
                  <span>Belum ada link hasil yang dilampirkan. Lampirkan link Google Drive/Canva saat mengajukan hasil karya.</span>
                  <button
                    type="button"
                    onClick={() => handleOpenSubmitWork(detailContent)}
                    className="text-[#DE0E86] font-bold text-xs hover:underline flex-shrink-0 ml-2"
                  >
                    + Unggah Link
                  </button>
                </div>
              )}
            </div>

            {/* Section 4: Tim Penanggung Jawab (Langkah 2: PIC, Desain, Produksi, Upload) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#DE0E86]" />
                <h4 className="text-xs font-extrabold text-[#004582] uppercase tracking-wider">
                  Penugasan Tim & Penanggung Jawab
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengusul Ide</span>
                  <p className="font-extrabold text-[#004582] text-xs truncate">
                    {detailContent.idea_user?.name || detailContent.ideaUser?.name || '-'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penanggung Jawab</span>
                  <p className="font-extrabold text-[#004582] text-xs truncate">
                    {detailContent.pic_user?.name || detailContent.picUser?.name || '-'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desain</span>
                  <p className="font-extrabold text-[#DE0E86] text-xs truncate">
                    {detailContent.designer_user?.name || detailContent.designer?.name || detailContent.designerUser?.name || '-'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produksi</span>
                  <p className="font-extrabold text-slate-700 text-xs truncate">
                    {detailContent.production_user?.name || detailContent.productionUser?.name || '-'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload / Tayang</span>
                  <p className="font-extrabold text-slate-700 text-xs truncate">
                    {detailContent.uploader_user?.name || detailContent.uploaderUser?.name || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Riwayat Alur & Catatan Status (Timeline) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#DE0E86]" />
                <h4 className="text-xs font-extrabold text-[#004582] uppercase tracking-wider">
                  Riwayat Alur Konten & Catatan
                </h4>
              </div>

              {(detailContent.status_histories?.length > 0 || detailContent.statusHistories?.length > 0) ? (
                <div className="space-y-2 bg-slate-50 p-4 rounded-[20px] border border-slate-200 max-h-48 overflow-y-auto">
                  {(detailContent.status_histories || detailContent.statusHistories || []).map((h, i) => (
                    <div key={h.id || i} className="flex items-start gap-3 text-xs pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-[#DE0E86] mt-1.5 flex-shrink-0" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#004582]">{h.status}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(h.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium">{h.notes || 'Perubahan tahap alur'}</p>
                        <p className="text-[10px] text-slate-400">Oleh: {h.user?.name || 'Sistem'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-[16px] border border-slate-200">
                  Belum ada riwayat perpindahan alur.
                </p>
              )}
            </div>

            {/* Footer Action Buttons Sesuai Skenario Alur */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {(isExecutive || role === 'admin') && (
                  <Button
                    type="button"
                    variant="light"
                    icon={Edit2}
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenEditContent(detailContent);
                    }}
                  >
                    Edit Data
                  </Button>
                )}

                {/* Langkah 2: Tugaskan Tim & Antrikan (Tahap Ide) */}
                {detailContent.status === 'Ide' && (isExecutive || role === 'admin') && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={UserCheck}
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenQueue(detailContent);
                    }}
                    className="font-bold shadow-xs bg-[#004582] hover:bg-[#003362]"
                  >
                    Tugaskan Tim & Antrikan
                  </Button>
                )}

                {/* Langkah 4: Mulai Kerjakan (Tahap Konten Antri) */}
                {detailContent.status === 'Konten Antri' && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={Play}
                    onClick={() => handleQuickStartWork(detailContent)}
                    className="font-bold shadow-xs bg-[#004582] hover:bg-[#003362]"
                  >
                    Mulai Kerjakan
                  </Button>
                )}

                {/* Langkah 5: Desain klik Ajukan (Tahap Di Proses / Sedang Revisi) */}
                {(detailContent.status === 'Konten Di Proses' || detailContent.status === 'Konten Sedang Revisi') && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={Send}
                    onClick={() => handleOpenSubmitWork(detailContent)}
                    className="font-bold shadow-xs bg-[#DE0E86] hover:bg-pink-700 text-white"
                  >
                    Ajukan Hasil Karya
                  </Button>
                )}

                {/* Langkah 6: Admin Tinjau (Revisi / Oke) */}
                {(detailContent.status === 'Konten Di Proses' || detailContent.status === 'Konten Sedang Revisi') && (detailContent.result_link || detailContent.result_url) && (isExecutive || role === 'admin') && (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      icon={RotateCcw}
                      onClick={() => handleOpenAdminReview(detailContent, 'revisi')}
                      className="font-bold shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Minta Revisi
                    </Button>
                    <Button
                      type="button"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => handleOpenAdminReview(detailContent, 'oke')}
                      className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      ACC Desain (Oke)
                    </Button>
                  </>
                )}

                {/* Langkah 7: Admin Ajukan ke Manager (Tahap Konten Ok) */}
                {detailContent.status === 'Konten Ok' && !detailContent.manager_approval && (isExecutive || role === 'admin') && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={ArrowRight}
                    onClick={() => handleSubmitToManager(detailContent)}
                    className="font-bold shadow-xs bg-[#004582] hover:bg-[#003362]"
                  >
                    Ajukan ke Manager
                  </Button>
                )}

                {/* Langkah 8: Manager Tinjau (Revisi / ACC) */}
                {detailContent.manager_approval === 'menunggu' && isExecutive && (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      icon={RotateCcw}
                      onClick={() => handleOpenManagerReview(detailContent, 'revisi')}
                      className="font-bold shadow-xs bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Minta Revisi (Manager)
                    </Button>
                    <Button
                      type="button"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => handleOpenManagerReview(detailContent, 'oke')}
                      className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Setujui (ACC Manager)
                    </Button>
                  </>
                )}

                {/* Langkah 8b: Admin Teruskan Revisi Manager ke Desainer */}
                {detailContent.manager_approval === 'revisi' && (isExecutive || role === 'admin') && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={RotateCcw}
                    onClick={() => handleOpenForwardManagerRevision(detailContent)}
                    className="font-bold shadow-xs bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Teruskan Revisi ke Desain
                  </Button>
                )}

                {/* Langkah 9: Admin Naikkan ke Siap Tayang */}
                {detailContent.manager_approval === 'disetujui' && detailContent.status === 'Konten Ok' && (isExecutive || role === 'admin') && (
                  <Button
                    type="button"
                    variant="primary"
                    icon={ArrowRight}
                    onClick={() => handleReadyToPublish(detailContent)}
                    className="font-bold shadow-xs bg-[#DE0E86] hover:bg-pink-700 text-white"
                  >
                    Naikkan ke Siap Tayang
                  </Button>
                )}

                {/* Langkah 10: Tandai Sudah Tayang */}
                {detailContent.status === 'Konten Siap Tayang' && (
                  <Button
                    type="button"
                    variant="success"
                    icon={CheckCheck}
                    onClick={() => handleOpenPublish(detailContent)}
                    className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Tandai Sudah Tayang
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL 1: Tugaskan Tim & Antrikan (Langkah 2) */}
      <Modal
        isOpen={queueModalOpen}
        onClose={() => setQueueModalOpen(false)}
        title="Tugaskan Tim & Naikkan ke Konten Antri"
        subtitle={`Konten: "${contentToQueue?.title}"`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQueueSubmit} className="space-y-4 text-left">
          <p className="text-xs text-slate-500 leading-relaxed">
            Pilih anggota tim yang bertanggung jawab untuk eksekusi konten ini. Konten akan otomatis muncul di dasbor masing-masing tim.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="1. Penanggung Jawab (PIC) *"
              required
              value={queueForm.pic_user_id}
              onChange={(e) => setQueueForm({ ...queueForm, pic_user_id: e.target.value })}
            >
              <option value="">Pilih Penanggung Jawab...</option>
              {employees.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name} {emp.position?.name ? `(${emp.position.name})` : ''}
                </option>
              ))}
            </Select>

            <Select
              label="2. Desain (Desainer Grafis) *"
              required
              value={queueForm.designer_user_id}
              onChange={(e) => setQueueForm({ ...queueForm, designer_user_id: e.target.value })}
            >
              <option value="">Pilih Desainer...</option>
              {employees.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name} {emp.position?.name ? `(${emp.position.name})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="3. Produksi (Opsional)"
              value={queueForm.production_user_id}
              onChange={(e) => setQueueForm({ ...queueForm, production_user_id: e.target.value })}
            >
              <option value="">Pilih Tim Produksi...</option>
              {employees.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name} {emp.position?.name ? `(${emp.position.name})` : ''}
                </option>
              ))}
            </Select>

            <Select
              label="4. Upload (Petugas Upload) *"
              required
              value={queueForm.uploader_user_id}
              onChange={(e) => setQueueForm({ ...queueForm, uploader_user_id: e.target.value })}
            >
              <option value="">Pilih Petugas Upload...</option>
              {employees.map((emp) => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.name} {emp.position?.name ? `(${emp.position.name})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Batas Deadline Desain"
              type="date"
              value={queueForm.deadline}
              onChange={(e) => setQueueForm({ ...queueForm, deadline: e.target.value })}
            />
            <Input
              label="Target Tanggal Tayang"
              type="date"
              value={queueForm.publish_schedule}
              onChange={(e) => setQueueForm({ ...queueForm, publish_schedule: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setQueueModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmittingQueue}
              className="shadow-md bg-[#004582] hover:bg-[#003362]"
            >
              Tugaskan & Masukkan Antrean
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Ajukan Hasil Karya Desain (Langkah 5) */}
      <Modal
        isOpen={submitWorkModalOpen}
        onClose={() => setSubmitWorkModalOpen(false)}
        title="Ajukan Hasil Karya Konten"
        subtitle={`Konten: "${contentToSubmit?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitWork} className="space-y-4 text-left">
          <Input
            label="Link Hasil Karya / Google Drive / Canva / Figma *"
            type="url"
            required
            value={submitWorkForm.result_link}
            onChange={(e) => setSubmitWorkForm({ ...submitWorkForm, result_link: e.target.value })}
            placeholder="https://drive.google.com/... atau https://canva.com/..."
            helper="Tautan file desain atau video yang dapat ditinjau oleh Admin."
          />

          <Textarea
            label="Catatan Pengajuan (Opsional)"
            rows={3}
            value={submitWorkForm.notes}
            onChange={(e) => setSubmitWorkForm({ ...submitWorkForm, notes: e.target.value })}
            placeholder="Keterangan mengenai variasi visual atau instruksi khusus..."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitWorkModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmittingWork}
              className="shadow-md bg-[#DE0E86] hover:bg-pink-700"
            >
              Ajukan ke Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Admin Review (Langkah 6) */}
      <Modal
        isOpen={adminReviewModalOpen}
        onClose={() => setAdminReviewModalOpen(false)}
        title={adminReviewDecision === 'oke' ? 'ACC / Setujui Desain Konten' : 'Minta Revisi Desain Konten'}
        subtitle={`Konten: "${adminReviewContent?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdminReviewSubmit} className="space-y-4 text-left">
          {adminReviewDecision === 'oke' ? (
            <p className="text-xs text-slate-600">
              Desain ini akan disetujui dan statusnya berubah menjadi <strong className="text-emerald-700">Konten Ok</strong>. Setelah ini Anda dapat mengajukannya ke Manager untuk persetujuan akhir.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Konten akan dikembalikan ke Desainer dengan status <strong className="text-rose-700">Konten Sedang Revisi</strong>.
              </p>
              <Textarea
                label="Catatan Revisi untuk Desainer *"
                required
                rows={4}
                value={adminReviewNotes}
                onChange={(e) => setAdminReviewNotes(e.target.value)}
                placeholder="Jelaskan secara rinci bagian yang perlu diperbaiki (font, warna box, logo, tata letak)..."
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdminReviewModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={adminReviewDecision === 'oke' ? 'success' : 'danger'}
              loading={isSubmittingAdminReview}
              className="shadow-md"
            >
              {adminReviewDecision === 'oke' ? 'Konfirmasi ACC (Oke)' : 'Kirim Catatan Revisi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Manager Review (Langkah 8) */}
      <Modal
        isOpen={managerReviewModalOpen}
        onClose={() => setManagerReviewModalOpen(false)}
        title={managerReviewDecision === 'oke' ? 'Setujui Konten (ACC Manager)' : 'Minta Revisi Konten (Manager)'}
        subtitle={`Konten: "${managerReviewContent?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleManagerReviewSubmit} className="space-y-4 text-left">
          {managerReviewDecision === 'oke' ? (
            <p className="text-xs text-slate-600">
              Apakah Anda yakin menyetujui penayangan konten ini? Setelah disetujui, Admin dapat menaikkannya ke tahap <strong className="text-purple-700">Konten Siap Tayang</strong>.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Catatan revisi Anda akan dikembalikan ke Admin untuk diteruskan kepada Desainer.
              </p>
              <Textarea
                label="Catatan Arahan Perbaikan dari Manager *"
                required
                rows={4}
                value={managerReviewNotes}
                onChange={(e) => setManagerReviewNotes(e.target.value)}
                placeholder="Tuliskan arahan perbaikan konten..."
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagerReviewModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant={managerReviewDecision === 'oke' ? 'success' : 'danger'}
              loading={isSubmittingManagerReview}
              className="shadow-md"
            >
              {managerReviewDecision === 'oke' ? 'Konfirmasi ACC Manager' : 'Kirimkan Revisi ke Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Teruskan Revisi Manager ke Desainer (Langkah 8b) */}
      <Modal
        isOpen={forwardRevisionModalOpen}
        onClose={() => setForwardRevisionModalOpen(false)}
        title="Teruskan Revisi Manager ke Desainer"
        subtitle={`Konten: "${contentToForward?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleForwardManagerRevisionSubmit} className="space-y-4 text-left">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-[16px] text-xs text-rose-900 space-y-1">
            <span className="font-bold block uppercase text-[10px]">Catatan Asli dari Manager:</span>
            <p className="font-medium italic">{contentToForward?.manager_notes || 'Perbaikan materi konten'}</p>
          </div>

          <Textarea
            label="Catatan Tambahan Pengantar dari Admin (Opsional)"
            rows={3}
            value={forwardNotes}
            onChange={(e) => setForwardNotes(e.target.value)}
            placeholder="Instruksi tambahan jika ada..."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForwardRevisionModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmittingForward}
              className="shadow-md bg-amber-500 hover:bg-amber-600 text-white"
            >
              Teruskan ke Desainer
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: Tandai Konten Sudah Tayang (Langkah 10) */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Tandai Konten Sudah Tayang"
        subtitle={`Konten: "${contentToPublish?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePublishSubmit} className="space-y-4 text-left">
          <p className="text-xs text-slate-600">
            Masukkan tautan langsung postingan yang sudah tayang di {contentToPublish?.platform?.name || 'media sosial'}.
          </p>

          <Input
            label="Tautan / Link Postingan yang Sudah Tayang *"
            type="url"
            required
            value={publishResultLink}
            onChange={(e) => setPublishResultLink(e.target.value)}
            placeholder="https://instagram.com/p/... atau https://tiktok.com/@..."
            helper="Tautan ini dapat diakses untuk memantau performa konten."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublishModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={isSubmittingPublish}
              className="shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Konfirmasi Sudah Tayang
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Advance Status Modal */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title={
          selectedContent?.status === 'Konten Di Proses' || selectedContent?.status === 'Konten Sedang Revisi'
            ? 'Ajukan Hasil Karya Konten'
            : selectedContent?.status === 'Ide' || selectedContent?.status === 'Konten Antri'
            ? 'Mulai Kerjakan Konten'
            : 'Perbarui Tahapan Konten'
        }
        subtitle={`Konten: ${selectedContent?.title}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdvanceStatus} className="space-y-4 text-left">
          <div className="bg-sky-50 text-[#004582] p-3 rounded-[16px] text-xs font-semibold flex items-center justify-between">
            <span>Tahap Saat Ini:</span>
            <strong className="text-[#DE0E86]">{selectedContent?.status}</strong>
          </div>

          <Input
            label="Link Hasil Karya / Drive / Canva / Figma"
            type="url"
            value={advanceResultUrl}
            onChange={(e) => setAdvanceResultUrl(e.target.value)}
            placeholder="https://drive.google.com/... atau https://canva.com/..."
            helper="Tautan link desain, visual, atau video hasil produksi Anda."
          />

          <Textarea
            label="Naskah Caption Copywriting (Opsional)"
            rows={3}
            value={advanceCaption}
            onChange={(e) => setAdvanceCaption(e.target.value)}
            placeholder="Tuliskan naskah teks postingan, hashtag, atau CTA..."
          />

          <Textarea
            label="Catatan Perkembangan / Keterangan (Opsional)"
            rows={2}
            value={advanceNotes}
            onChange={(e) => setAdvanceNotes(e.target.value)}
            placeholder="Catatan mengenai layout atau revisi..."
          />

          <Button type="submit" variant="primary" className="w-full shadow-md" isLoading={isAdvancing}>
            {selectedContent?.status === 'Konten Di Proses' || selectedContent?.status === 'Konten Sedang Revisi'
              ? 'Ajukan Hasil Sekarang'
              : selectedContent?.status === 'Konten Siap Tayang'
              ? 'Konfirmasi Tayang'
              : 'Konfirmasi Pindah Tahap'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ContentsPage;
