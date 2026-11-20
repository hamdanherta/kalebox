import React from 'react';
import Button from './Button';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Belum Ada Data',
  description = 'Saat ini belum ada data yang tersedia untuk ditampilkan.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-6 flex flex-col items-center justify-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[#F0F6FB] flex items-center justify-center text-[#004582] mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h4 className="text-lg font-bold text-[#004582] tracking-tight mb-1.5">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
