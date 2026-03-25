'use client';

import { useMemo } from 'react';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  className?: string;
  variant?: 'embedded' | 'standalone';
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
  isFetching = false,
  className = '',
  variant = 'embedded',
}: AdminPaginationProps) {
  const paginationItems = useMemo(() => {
    const safeTotalPages = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
    const safeCurrentPage = Number.isFinite(currentPage) ? Math.max(1, Math.floor(currentPage)) : 1;

    if (safeTotalPages <= 1) return [];

    const pages = new Set<number>([1, safeTotalPages, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1]);
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= safeTotalPages)
      .sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  const safeTotalPages = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
  const safeCurrentPage = Number.isFinite(currentPage) ? Math.max(1, Math.floor(currentPage)) : 1;
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, totalItems) : 0;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;

  if (safeTotalPages <= 1) {
    return null;
  }

  const pageStart = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const pageEnd = safeTotalItems === 0 ? 0 : Math.min(safeCurrentPage * safePageSize, safeTotalItems);
  const containerClassName =
    variant === 'standalone'
      ? 'rounded-2xl border border-slate-200 bg-white'
      : 'border-t border-slate-200 bg-slate-50/60';

  return (
    <div className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${containerClassName} ${className}`}>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        {isFetching && <span className="text-slate-400">Đang cập nhật...</span>}
        <span>
          Hiển thị {pageStart}-{pageEnd} / {safeTotalItems} {itemLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage === 1}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trước
        </button>
        <div className="flex items-center gap-2">
          {paginationItems.map((page, index) => {
            const previousPage = paginationItems[index - 1];
            const showGap = previousPage && page - previousPage > 1;

            return (
              <div key={page} className="flex items-center gap-2">
                {showGap && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    safeCurrentPage === page
                      ? 'border-[#7366ff] bg-[#7366ff] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === safeTotalPages}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tiếp
        </button>
      </div>
    </div>
  );
}
