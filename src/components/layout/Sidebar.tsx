import React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  UploadCloud,
} from 'lucide-react';
import { DataQualityIssue, DuplicateRecord } from '../../types/reconciliation';

export type NavTab =
  | 'dashboard'
  | 'import'
  | 'reconciliation'
  | 'orders'
  | 'payments'
  | 'transactions'
  | 'monthly'
  | 'duplicates'
  | 'data-quality'
  | 'audit-log'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  duplicatesCount: number;
  dataQualityIssues: DataQualityIssue[];
  duplicates: DuplicateRecord[];
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  duplicatesCount,
  dataQualityIssues,
  isMobileOpen,
  onCloseMobile,
}) => {
  const errorCount = dataQualityIssues.filter((i) => i.severity === 'ERROR').length;
  const warningCount = dataQualityIssues.filter((i) => i.severity === 'WARNING').length;

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: 'Import Data', icon: UploadCloud },
    { id: 'reconciliation', label: 'Reconciliation', icon: ArrowRightLeft },
    { id: 'orders', label: 'Orders', icon: FileCheck },
    { id: 'payments', label: 'Payment Summary', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'monthly', label: 'Monthly Analysis', icon: Calendar },
    {
      id: 'duplicates',
      label: 'Duplicates',
      icon: Copy,
      badge: duplicatesCount > 0 ? duplicatesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'data-quality',
      label: 'Data Quality',
      icon: AlertTriangle,
      badge: errorCount > 0 ? `${errorCount} Err` : warningCount > 0 ? `${warningCount} Warn` : undefined,
      badgeColor: errorCount > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-slate-200 text-slate-750 dark:bg-slate-800 dark:text-slate-300',
    },
    { id: 'audit-log', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Trust & Compliance Indicator */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Offline & Private</span>
            </div>
            <p className="leading-tight text-slate-500 dark:text-slate-400">
              Files are parsed directly in your browser. Sensitive ledger data is never transmitted to third parties.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
