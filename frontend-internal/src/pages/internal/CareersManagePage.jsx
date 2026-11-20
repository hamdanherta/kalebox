import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import { Table, Pagination } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Briefcase, UserCheck, Plus, FileDown, ExternalLink, Edit2, Trash2 } from 'lucide-react';

export const CareersManagePage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('openings'); // 'openings' or 'applications'
  const [careers, setCareers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Job Opening Modal
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [careerForm, setCareerForm] = useState({
    title: '',
    department: 'Desain Grafis',
    employment_type: 'Full-time',
    location: 'Jambi Workshop',
    description: '',
    requirements: '',
    is_active: true,
  });

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    try {
      if (activeTab === 'openings') {
        const res = await api.get('/internal/careers');
        if (res.data?.status === 'success') {
          setCareers(res.data.data || []);
        }
      } else {
        const res = await api.get(`/internal/job-applications?page=${page}`);
        if (res.data?.status === 'success') {
          const d = res.data.data;
          setApplications(d.data || []);
          setMeta({ current_page: d.current_page || 1, last_page: d.last_page || 1 });
        }
      }
    } catch (err) {
      console.error('Failed to load career data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSaveCareer = async (e) => {
    e.preventDefault();
    try {
      if (editingCareer) {
        await api.put(`/internal/careers/${editingCareer.id}`, careerForm);
        addToast('Lowongan pekerjaan berhasil diperbarui', 'success');
      } else {
        await api.post('/internal/careers', careerForm);
        addToast('Lowongan pekerjaan baru berhasil diterbitkan', 'success');
      }
      setCareerModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan lowongan', 'error');
    }
  };

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      await api.put(`/internal/job-applications/${appId}/status`, { status });
      addToast(`Status pelamar diubah menjadi ${status}`, 'success');
      fetchData(meta.current_page);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui status', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Rekrutmen & Karir</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Manajemen Lowongan & Pelamar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola lowongan pekerjaan terbuka dan evaluasi berkas lamaran CV dari calon kandidat.
          </p>
        </div>

        {activeTab === 'openings' && (
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingCareer(null);
              setCareerForm({
                title: '',
                department: 'Desain Grafis',
                employment_type: 'Full-time',
                location: 'Jambi Workshop',
                description: '',
                requirements: '',
                is_active: true,
              });
              setCareerModalOpen(true);
            }}
          >
            Buka Lowongan Baru
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#F0F6FB] p-1.5 rounded-[22px] inline-flex items-center gap-1">
        <button
          onClick={() => setActiveTab('openings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
            activeTab === 'openings' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Daftar Lowongan</span>
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
            activeTab === 'applications' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Berkas Pelamar Masuk</span>
        </button>
      </div>

      {/* Card Content */}
      <Card padding="p-6 md:p-8" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : activeTab === 'openings' ? (
          /* Openings Table */
          <Table headers={['Posisi Pekerjaan', 'Departemen', 'Tipe', 'Lokasi', 'Pelamar', 'Status', 'Aksi']}>
            {careers.map((c) => (
              <tr key={c.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">{c.title}</td>
                <td className="py-4 px-6 text-xs font-semibold">{c.department}</td>
                <td className="py-4 px-6 text-xs">{c.employment_type}</td>
                <td className="py-4 px-6 text-xs text-slate-500">{c.location}</td>
                <td className="py-4 px-6 font-bold text-[#DE0E86]">{c.applications_count || 0} Orang</td>
                <td className="py-4 px-6">
                  <Badge variant={c.is_active ? 'success' : 'secondary'} size="sm">
                    {c.is_active ? 'Aktif' : 'Ditutup'}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() => {
                      setEditingCareer(c);
                      setCareerForm(c);
                      setCareerModalOpen(true);
                    }}
                    className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          /* Applications Table */
          applications.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Belum Ada Lamaran Masuk"
              description="Calon pelamar yang mendaftar dari website publik akan tampil di sini."
            />
          ) : (
            <>
              <Table headers={['Nama Pelamar', 'Posisi Dilamar', 'Email & WA', 'Berkas CV', 'Status', 'Ubah Status']}>
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#004582]">{app.applicant_name}</td>
                    <td className="py-4 px-6 font-semibold text-xs text-slate-700">{app.career?.title || '-'}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <p>{app.email}</p>
                      <p className="font-semibold text-[#DE0E86]">{app.phone}</p>
                    </td>
                    <td className="py-4 px-6">
                      <a
                        href={app.cv_file}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#004582] hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Unduh CV</span>
                      </a>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          app.status === 'accepted'
                            ? 'success'
                            : app.status === 'rejected'
                            ? 'danger'
                            : app.status === 'interviewed'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                        className="bg-[#F0F6FB] text-[#004582] text-xs font-bold py-1.5 px-2.5 rounded-[12px] outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Direview</option>
                        <option value="interviewed">Wawancara</option>
                        <option value="accepted">Diterima</option>
                        <option value="rejected">Ditolak</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </Table>

              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                onPageChange={(p) => fetchData(p)}
              />
            </>
          )
        )}
      </Card>

      {/* Career Modal */}
      <Modal
        isOpen={careerModalOpen}
        onClose={() => setCareerModalOpen(false)}
        title={editingCareer ? 'Edit Lowongan Pekerjaan' : 'Buka Lowongan Baru'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCareer} className="space-y-4 text-left">
          <Input
            label="Judul Posisi Pekerjaan"
            required
            value={careerForm.title}
            onChange={(e) => setCareerForm({ ...careerForm, title: e.target.value })}
            placeholder="Contoh: Junior Graphic Designer Packaging"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Departemen"
              required
              value={careerForm.department}
              onChange={(e) => setCareerForm({ ...careerForm, department: e.target.value })}
            />
            <Input
              label="Tipe Pekerjaan"
              required
              value={careerForm.employment_type}
              onChange={(e) => setCareerForm({ ...careerForm, employment_type: e.target.value })}
            />
            <Input
              label="Lokasi Workshop"
              required
              value={careerForm.location}
              onChange={(e) => setCareerForm({ ...careerForm, location: e.target.value })}
            />
          </div>

          <Textarea
            label="Deskripsi Pekerjaan"
            required
            rows={3}
            value={careerForm.description}
            onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
          />

          <Textarea
            label="Kualifikasi / Persyaratan"
            required
            rows={3}
            value={careerForm.requirements}
            onChange={(e) => setCareerForm({ ...careerForm, requirements: e.target.value })}
          />

          <Button type="submit" variant="primary" className="w-full">
            Simpan Lowongan
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default CareersManagePage;
