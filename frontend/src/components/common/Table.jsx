import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Table = ({
  headers = [],
  children,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto w-full rounded-[24px] ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/50">
            {headers.map((head, idx) => {
              const label = typeof head === 'object' && head !== null ? head.label : head;
              const align = typeof head === 'object' && head !== null && head.align ? head.align : 'text-left';
              const customClass = typeof head === 'object' && head !== null && head.className ? head.className : '';
              return (
                <th
                  key={idx}
                  className={`py-3.5 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap first:rounded-l-[20px] last:rounded-r-[20px] ${align} ${customClass}`}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({
  currentPage = 1,
  lastPage = 1,
  totalItems = null,
  onPageChange,
  className = '',
}) => {
  if (lastPage <= 1 && !totalItems) return null;

  // Generate page numbers with ellipsis
  const pages = [];
  for (let i = 1; i <= lastPage; i++) {
    if (
      i === 1 ||
      i === lastPage ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-slate-500 ${className}`}>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-slate-600 hover:text-[#004582] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return <span key={idx} className="px-2 text-slate-400">...</span>;
            }
            const isActive = p === currentPage;
            return (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-[#004582] text-white shadow-sm ring-2 ring-[#004582]/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-slate-600 hover:text-[#004582] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {totalItems != null && (
        <p className="text-slate-400 font-medium">
          Menampilkan <span className="font-bold text-slate-700">{totalItems}</span> total data
        </p>
      )}
    </div>
  );
};

export default Table;
