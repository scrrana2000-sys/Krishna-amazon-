import React, { useState } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';
import { ColumnMapping, UploadedFileMetadata } from '../../types/reconciliation';

interface ColumnMappingModalProps {
  file: UploadedFileMetadata;
  initialMapping: ColumnMapping;
  isOpen: boolean;
  onClose: () => void;
  onSaveMapping: (fileId: string, updatedMapping: ColumnMapping) => void;
}

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  file,
  initialMapping,
  isOpen,
  onClose,
  onSaveMapping,
}) => {
  const [mapping, setMapping] = useState<ColumnMapping>({ ...initialMapping });
  const activeSheet = file.sheets.find((s) => s.sheetName === file.selectedSheet) || file.sheets[0];
  const headers = activeSheet?.headers || [];

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof ColumnMapping, val: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: val === '__NONE__' ? '' : val,
    }));
  };

  const fields: Array<{
    key: keyof ColumnMapping;
    label: string;
    description: string;
    required: boolean;
  }> = [
    {
      key: 'orderIdCol',
      label: 'Order ID Column',
      description: 'Unique identifier for Amazon order (e.g. 408-1234567-8901234)',
      required: true,
    },
    {
      key: 'orderDateCol',
      label: 'Date Column',
      description: 'Order purchase date, posted date, or settlement date',
      required: false,
    },
    {
      key: 'orderAmountCol',
      label: 'Order Value / Item Subtotal Column',
      description: 'Gross purchase amount charged to customer',
      required: false,
    },
    {
      key: 'paymentAmountCol',
      label: 'Payment / Settlement Amount Column',
      description: 'Amount disbursed or credited in settlement batch',
      required: false,
    },
    {
      key: 'feeAmountCol',
      label: 'Selling / Logistics Fees Column',
      description: 'Amazon commission, FBA fees, pick & pack charges',
      required: false,
    },
    {
      key: 'taxAmountCol',
      label: 'Taxes Withheld Column',
      description: 'GST, TCS, TDS deductions',
      required: false,
    },
    {
      key: 'refundAmountCol',
      label: 'Refund / Reversals Column',
      description: 'Refund amount credited back to buyer',
      required: false,
    },
    {
      key: 'transactionIdCol',
      label: 'Transaction ID Column',
      description: 'Unique reference identifier for the payout event',
      required: false,
    },
    {
      key: 'settlementIdCol',
      label: 'Settlement Batch ID Column',
      description: 'Amazon bank disbursement batch number',
      required: false,
    },
    {
      key: 'transactionTypeCol',
      label: 'Transaction Event Type Column',
      description: 'Order, Refund, Service Fee, Adjustment, etc.',
      required: false,
    },
    {
      key: 'statusCol',
      label: 'Status Column',
      description: 'Order status (Shipped, Cancelled) or Settlement status',
      required: false,
    },
    {
      key: 'channelCol',
      label: 'Marketplace / Channel Column',
      description: 'Sales channel indicator (Amazon.in, Flipkart, etc.)',
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Verify Column Mapping
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              File: {file.name} · Sheet: {activeSheet.sheetName} ({activeSheet.totalRows} rows)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The system auto-detected columns below based on standard Amazon reports. You can manually adjust any column mapping if your report uses custom header titles.
          </p>

          <div className="space-y-3">
            {fields.map((f) => {
              const currentVal = mapping[f.key] || '';
              return (
                <div
                  key={f.key}
                  className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <div className="sm:max-w-xs">
                    <label className="text-xs font-medium text-slate-900 flex items-center gap-1 dark:text-white">
                      {f.label}
                      {f.required && <span className="text-rose-500">*</span>}
                    </label>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {f.description}
                    </p>
                  </div>

                  <select
                    value={currentVal || '__NONE__'}
                    onChange={(e) => handleFieldChange(f.key, e.target.value)}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="__NONE__">— None / Unmapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveMapping(file.id, mapping);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs"
          >
            <Check className="h-3.5 w-3.5" />
            Save & Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
};
