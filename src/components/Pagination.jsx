import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50] }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1 && totalItems <= pageSizeOptions[0]) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const btnBase = {
    minWidth: '36px', height: '36px', borderRadius: '10px', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
    padding: '0 8px'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 0', marginTop: '8px' }}>
      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            style={{ marginLeft: '12px', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}
          >
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          style={{ ...btnBase, background: 'rgba(0,0,0,0.04)', color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)', opacity: currentPage === 1 ? 0.4 : 1 }}>
          <ChevronLeft size={18} />
        </button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              style={{ ...btnBase, background: p === currentPage ? 'var(--color-mustard)' : 'rgba(0,0,0,0.04)', color: p === currentPage ? 'white' : 'var(--color-text)' }}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          style={{ ...btnBase, background: 'rgba(0,0,0,0.04)', color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)', opacity: currentPage === totalPages ? 0.4 : 1 }}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
