import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck,
  FileSpreadsheet,
  Layers,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Table,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { ColumnMapping, UploadedFileMetadata } from '../../types/reconciliation';
import {
  autoDetectColumnMapping,
  parseUploadedFile,
} from '../../utils/excelParser';
import { downloadSampleExcelWorkbook } from '../../utils/sampleData';
import { ColumnMappingModal } from './ColumnMappingModal';

interface FileUploaderProps {
  files: UploadedFileMetadata[];
  fileMappings: Record<string, ColumnMapping>;
  onFilesChanged: (files: UploadedFileMetadata[], mappings: Record<string, ColumnMapping>) => void;
  onRunReconciliation: () => void;
  isProcessing: boolean;
  processingStep: string;
  onLoadSampleData: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  fileMappings,
  onFilesChanged,
  onRunReconciliation,
  isProcessing,
  processingStep,
  onLoadSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [activeMappingFile, setActiveMappingFile] = useState<UploadedFileMetadata | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFileMetadata | null>(null);

  const handleFiles = async (newFileList: FileList | File[]) => {
    setParsingError(null);
    const parsedFiles: UploadedFileMetadata[] = [];
    const newMappings: Record<string, ColumnMapping> = { ...fileMappings };

    try {
      for (let i = 0; i < newFileList.length; i++) {
        const file = newFileList[i];
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
          continue;
        }
        const meta = await parseUploadedFile(file);
        parsedFiles.push(meta);

        // Map primary sheet
        const primarySheet = meta.sheets[0];
        if (primarySheet) {
          newMappings[meta.id] = autoDetectColumnMapping(primarySheet.headers);
        }
      }

      if (parsedFiles.length === 0) {
        setParsingError('Please upload valid Excel (.xlsx, .xls) or CSV (.csv) files.');
        return;
      }

      const combinedFiles = [...files, ...parsedFiles];
      onFilesChanged(combinedFiles, newMappings);
      if (!previewFile && combinedFiles.length > 0) {
        setPreviewFile(combinedFiles[0]);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParsingError(err?.message || 'Error reading Excel file. Please ensure it is not password-protected.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updated = files.filter((f) => f.id !== fileId);
    const updatedMappings = { ...fileMappings };
    delete updatedMappings[fileId];
    onFilesChanged(updated, updatedMappings);
    if (previewFile?.id === fileId) {
      setPreviewFile(updated[0] || null);
    }
  };

  const handleSheetChange = (fileId: string, sheetName: string) => {
    const updated = files.map((f) => {
      if (f.id === fileId) {
        return { ...f, selectedSheet: sheetName };
      }
      return f;
    });

    const targetFile = updated.find((f) => f.id === fileId);
    if (targetFile) {
      const sheet = targetFile.sheets.find((s) => s.sheetName === sheetName);
      if (sheet) {
        const updatedMappings = {
          ...fileMappings,
          [fileId]: autoDetectColumnMapping(sheet.headers),
        };
        onFilesChanged(updated, updatedMappings);
        return;
      }
    }
    onFilesChanged(updated, fileMappings);
  };

  const handleSaveMapping = (fileId: string, updatedMapping: ColumnMapping) => {
    const updated = {
      ...fileMappings,
      [fileId]: updatedMapping,
    };
    onFilesChanged(files, updated);
  };

  const totalDetectedRows = files.reduce(
    (acc, f) =>
      acc + (f.sheets.find((s) => s.sheetName === f.selectedSheet)?.totalRows || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105 dark:bg-indigo-950/60 dark:text-indigo-400">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
          Drop Amazon Excel (.xlsx, .xls) or CSV files here
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Upload Order Reports, Monthly Date Range Settlement reports, or combined transaction spreadsheets.
          Multi-file matching combines orders with all relevant payout batches automatically.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            XLSX / XLS / CSV
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Auto-Header Detection
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Multi-Sheet Support
          </span>
        </div>
      </div>

      {/* Parsing error notification */}
      {parsingError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{parsingError}</span>
        </div>
      )}

      {/* Quick Sample File Download & Load Assistance */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
              Don&apos;t have Amazon files right now?
            </h4>
            <p className="text-[11px] text-slate-500">
              Load realistic Amazon India seller reports (Orders + Settlement Payouts) or download them to test manual upload.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-slate-50 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
          >
            Load Sample Dataset
          </button>

          <button
            type="button"
            onClick={() => downloadSampleExcelWorkbook('both')}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Download authentic .xlsx sample spreadsheets"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Sample .xlsx</span>
          </button>
        </div>
      </div>

      {/* Uploaded Files Manifest */}
      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <span>Uploaded Files Manifest ({files.length} file{files.length > 1 ? 's' : ''})</span>
              </h3>
              <p className="text-xs text-slate-500">
                {totalDetectedRows.toLocaleString()} total rows detected ready for reconciliation
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onRunReconciliation}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{processingStep || 'Reconciling...'}</span>
                </>
              ) : (
                <>
                  <span>Ready for Reconciliation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {files.map((file) => {
              const mapping = fileMappings[file.id] || {};
              const currentSheet =
                file.sheets.find((s) => s.sheetName === file.selectedSheet) || file.sheets[0];

              return (
                <div
                  key={file.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-750"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {file.name}
                          </span>
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-mono font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            {file.detectedType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <span aria-hidden="true">·</span>
                          <span>{currentSheet?.totalRows} rows</span>
                          <span aria-hidden="true">·</span>
                          <span>{file.sheets.length} sheet{file.sheets.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sheet Selector */}
                      {file.sheets.length > 1 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <span className="text-[11px] text-slate-400">Sheet:</span>
                          <select
                            value={file.selectedSheet}
                            onChange={(e) => handleSheetChange(file.id, e.target.value)}
                            className="h-7 rounded border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          >
                            {file.sheets.map((s) => (
                              <option key={s.sheetName} value={s.sheetName}>
                                {s.sheetName} ({s.totalRows} rows)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Verify / Map Columns */}
                      <button
                        type="button"
                        onClick={() => setActiveMappingFile(file)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Column Mapping</span>
                      </button>

                      {/* View Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Table className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mapping status pill row */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      Order ID: <b className="text-slate-900 dark:text-white">{mapping.orderIdCol || 'Missing'}</b>
                    </span>
                    {mapping.orderAmountCol && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        Order Amt: <b className="text-slate-900 dark:text-white">{mapping.orderAmountCol}</b>
                      </span>
                    )}
                    {mapping.paymentAmountCol && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        Payment Amt: <b className="text-slate-900 dark:text-white">{mapping.paymentAmountCol}</b>
                      </span>
                    )}
                    {mapping.settlementIdCol && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        Settlement ID: <b className="text-slate-900 dark:text-white">{mapping.settlementIdCol}</b>
                      </span>
                    )}
                    {mapping.feeAmountCol && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        Fees: <b className="text-slate-900 dark:text-white">{mapping.feeAmountCol}</b>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Preview Table */}
      {previewFile && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Data Preview: {previewFile.name}
              </h3>
              <p className="text-xs text-slate-500">
                First 5 rows of sheet &apos;{previewFile.selectedSheet}&apos; inspected
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Read-Only Original Data</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {(() => {
              const sheet =
                previewFile.sheets.find((s) => s.sheetName === previewFile.selectedSheet) ||
                previewFile.sheets[0];
              if (!sheet || sheet.rows.length === 0) {
                return <p className="text-xs text-slate-500 py-4">No rows in this sheet.</p>;
              }
              const displayHeaders = sheet.headers.slice(0, 10);
              const previewRows = sheet.rows.slice(0, 5);

              return (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <th className="py-2 px-3">#</th>
                      {displayHeaders.map((h) => (
                        <th key={h} className="py-2 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        {displayHeaders.map((h) => (
                          <td key={h} className="py-2 px-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                            {r[h] !== null && r[h] !== undefined ? String(r[h]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {activeMappingFile && (
        <ColumnMappingModal
          file={activeMappingFile}
          initialMapping={fileMappings[activeMappingFile.id] || { orderIdCol: '' }}
          isOpen={true}
          onClose={() => setActiveMappingFile(null)}
          onSaveMapping={handleSaveMapping}
        />
      )}
    </div>
  );
};
