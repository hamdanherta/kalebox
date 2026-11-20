import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="text-center space-y-4 pt-2">
        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#F0F6FB] text-[#004582]'
        }`}>
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#004582]">{title}</h4>
          <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="light"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
