import React from 'react';
import { PaymentStatus } from '../../types/reconciliation';

interface StatusBadgeProps {
  status: PaymentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();

  // Clean unboxed metadata with subtle tint, accessible contrast
  let styles = 'text-slate-700 bg-slate-100 border border-slate-200';

  if (s === 'FULLY RECEIVED') {
    styles = 'text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
  } else if (s === 'PARTIALLY RECEIVED') {
    styles = 'text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  } else if (s === 'PENDING') {
    styles = 'text-rose-800 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
  } else if (s === 'OVERPAID') {
    styles = 'text-sky-800 bg-sky-50 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
  } else if (s === 'CANCELLED') {
    styles = 'text-slate-700 bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  } else if (s === 'REFUNDED') {
    styles = 'text-purple-800 bg-purple-50 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
  } else if (s === 'UNMATCHED') {
    styles = 'text-indigo-800 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60';
  } else if (s === 'REVIEW REQUIRED') {
    styles = 'text-amber-900 bg-amber-100/80 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-medium tracking-wide rounded ${px} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};
