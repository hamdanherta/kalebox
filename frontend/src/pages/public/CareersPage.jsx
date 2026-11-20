import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Briefcase, MapPin, Clock, ArrowRight, Upload, CheckCircle2 } from 'lucide-react';

export const CareersPage = () => {
  const { addToast } = useToast();
  const [careers, setCareers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply modal
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await api.get('/careers');
        if (res.data?.status === 'success') {
          setCareers(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load careers', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareers();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      addToast('Mohon lampirkan dokumen CV dalam format PDF', 'warning');
      return;
    }

    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append('applicant_name', applicantName);
      formData.append('email', applicantEmail);
      formData.append('phone', applicantPhone);
      formData.append('cover_letter', coverLetter);
      formData.append('cv_file', cvFile);

      const res = await api.post(`/careers/${selectedCareer.id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        addToast('Lamaran Anda berhasil dikirim! Tim HR akan meninjau kualifikasi Anda.', 'success');
        setSelectedCareer(null);
        setApplicantName('');
        setApplicantEmail('');
        setApplicantPhone('');
        setCoverLetter('');
        setCvFile(null);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengirim lamaran', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-left">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <Badge variant="secondary" size="md">Karir di Kalebox</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004582] tracking-tight">
          Bergabung Bersama Tim Manufaktur Modern
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Kami membuka kesempatan bagi profesional yang berdedikasi dalam bidang desain grafis kemasan, operasional mesin cetak, dan manajemen bisnis untuk berkembang bersama kami.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height="h-32" rounded="rounded-[32px]" />
          <Skeleton height="h-32" rounded="rounded-[32px]" />
        </div>
      ) : careers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Belum Ada Lowongan Aktif"
          description="Saat ini belum ada posisi baru yang dibuka. Anda dapat memantau kembali halaman ini secara berkala."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {careers.map((c) => (
            <Card key={c.id} padding="p-6 md:p-8" hover className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">{c.department}</Badge>
                  <Badge variant="secondary" size="sm">{c.employment_type}</Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#DE0E86]" /> {c.location}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#004582]">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl leading-relaxed">
                  {c.description}
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                className="flex-shrink-0"
                onClick={() => setSelectedCareer(c)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Lihat & Lamar
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Detail & Apply Modal */}
      {selectedCareer && (
        <Modal
          isOpen={!!selectedCareer}
          onClose={() => setSelectedCareer(null)}
          title={selectedCareer.title}
          subtitle={`${selectedCareer.department} • ${selectedCareer.employment_type} • ${selectedCareer.location}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">Deskripsi Pekerjaan</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {selectedCareer.description}
              </p>
            </div>

            <div className="space-y-2 text-left">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">Kualifikasi / Persyaratan</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
                {selectedCareer.requirements}
              </p>
            </div>

            {/* Application Form */}
            <form onSubmit={handleApply} className="space-y-4 pt-4 border-t border-slate-100 text-left">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">
                Formulir Lamaran Pekerjaan
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nama Lengkap"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                />
                <Input
                  label="Alamat Email"
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                />
                <Input
                  label="Nomor WhatsApp"
                  type="tel"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
                    Upload CV (PDF, Maks 10 MB) <span className="text-[#DE0E86]">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => setCvFile(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] hover:file:bg-[#DE0E86] hover:file:text-white cursor-pointer"
                  />
                </div>
              </div>

              <Textarea
                label="Surat Lamaran Singkat / Pengalaman Terkait (Opsional)"
                rows={3}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Ceritakan secara singkat keahlian dan alasan ketertarikan Anda pada posisi ini..."
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isApplying}
                icon={Upload}
              >
                Kirim Lamaran Sekarang
              </Button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CareersPage;
