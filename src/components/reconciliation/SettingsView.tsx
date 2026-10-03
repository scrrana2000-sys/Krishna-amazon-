import React, { useState } from 'react';
import { Check, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { ReconciliationSettings } from '../../types/reconciliation';
import { DEFAULT_SETTINGS } from '../../utils/reconciliationEngine';

interface SettingsViewProps {
  settings: ReconciliationSettings;
  onUpdateSettings: (newSettings: ReconciliationSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [current, setCurrent] = useState<ReconciliationSettings>({ ...settings });
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    onUpdateSettings(current);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleReset = () => {
    setCurrent({ ...DEFAULT_SETTINGS });
    onUpdateSettings({ ...DEFAULT_SETTINGS });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Reconciliation & Settlement Business Rules</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure matching tolerance, Amazon Order ID regex validation, and fee formulas
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Currency & Symbol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Operating Currency
            </label>
            <select
              value={current.currency}
              onChange={(e) => {
                const cur = e.target.value as any;
                const sym = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£';
                setCurrent({ ...current, currency: cur, currencySymbol: sym });
              }}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="INR">INR (₹) - Indian Rupee (Default)</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reconciliation Tolerance
            </label>
            <input
              type="number"
              step="0.01"
              value={current.reconciliationTolerance}
              onChange={(e) =>
                setCurrent({
                  ...current,
                  reconciliationTolerance: parseFloat(e.target.value) || 0.01,
                })
              }
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Differences under this amount are classified as FULLY RECEIVED (default: ₹0.01)
            </p>
          </div>
        </div>

        {/* Amazon Regex */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Amazon Order ID Regular Expression
          </label>
          <input
            type="text"
            value={current.amazonIdPattern}
            onChange={(e) => setCurrent({ ...current, amazonIdPattern: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
          />
          <p className="text-[11px] text-slate-400 mt-0.5">
            Default: <code className="font-mono">^\d&#123;3&#125;-\d&#123;7&#125;-\d&#123;7&#125;$</code> (Matches 408-1928374-9182736 format)
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current.autoExcludeCancelledOrders}
              onChange={(e) =>
                setCurrent({ ...current, autoExcludeCancelledOrders: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Exclude Cancelled Orders from Pending Totals
              </span>
              <p className="text-[11px] text-slate-500">
                Cancelled orders will have Pending Amount = 0 and will be marked as CANCELLED rather than outstanding.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current.countDuplicateTxnOnce}
              onChange={(e) =>
                setCurrent({ ...current, countDuplicateTxnOnce: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                De-duplicate Repeated Settlement Disbursements
              </span>
              <p className="text-[11px] text-slate-500">
                When the same transaction appears in overlapping monthly payout batches, only count it once to avoid artificial receipt inflation.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current.treatRefundAsNetDeduction}
              onChange={(e) =>
                setCurrent({ ...current, treatRefundAsNetDeduction: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Deduct Customer Refunds from Net Payout
              </span>
              <p className="text-[11px] text-slate-500">
                Customer refund clawbacks are debited against seller net bank settlement yields.
              </p>
            </div>
          </label>
        </div>

        {/* Save button */}
        <div className="pt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500"
          >
            <Check className="h-4 w-4" />
            <span>Save Rules & Re-run Reconciliation</span>
          </button>

          {savedMsg && (
            <span className="text-xs font-medium text-emerald-600">
              Rules updated and applied successfully!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
