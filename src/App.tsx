import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Menu,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { PaymentSummary } from './components/dashboard/PaymentSummary';
import { ReconciliationCharts } from './components/dashboard/ReconciliationCharts';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { FileUploader } from './components/import/FileUploader';
import { AuditLogView } from './components/reconciliation/AuditLogView';
import { DataQualityView } from './components/reconciliation/DataQualityView';
import { DuplicatesView } from './components/reconciliation/DuplicatesView';
import { MonthlyAnalysisView } from './components/reconciliation/MonthlyAnalysisView';
import { OrderDetailModal } from './components/reconciliation/OrderDetailModal';
import { OrdersTable } from './components/reconciliation/OrdersTable';
import { SettingsView } from './components/reconciliation/SettingsView';
import { TransactionsTable } from './components/reconciliation/TransactionsTable';
import {
  AuditLogEntry,
  ColumnMapping,
  DataQualityIssue,
  NormalizedOrder,
  PaymentStatus,
  ReconciliationResult,
  ReconciliationSettings,
  UploadedFileMetadata,
} from './types/reconciliation';
import { runDataQualityValidation } from './utils/dataValidator';
import { exportFullReconciliationWorkbook } from './utils/excelExporter';
import {
  DEFAULT_SETTINGS,
  runReconciliation,
} from './utils/reconciliationEngine';
import { createAmazonSampleFiles } from './utils/sampleData';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core reconciliation state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMetadata[]>([]);
  const [fileMappings, setFileMappings] = useState<Record<string, ColumnMapping>>({});
  const [settings, setSettings] = useState<ReconciliationSettings>(DEFAULT_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Selected Order for detail drilldown
  const [selectedOrder, setSelectedOrder] = useState<NormalizedOrder | null>(null);

  // Status filter passed from Dashboard KPI click
  const [orderStatusFilter, setOrderStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  // Toggle Dark Mode in document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Execute reconciliation engine
  const reconResult: ReconciliationResult | null = useMemo(() => {
    if (uploadedFiles.length === 0) return null;
    return runReconciliation(uploadedFiles, fileMappings, settings, auditLogs);
  }, [uploadedFiles, fileMappings, settings, auditLogs]);

  // Compute data quality issues
  const dataQualityIssues: DataQualityIssue[] = useMemo(() => {
    if (!reconResult) return [];
    return runDataQualityValidation(reconResult.orders, reconResult.transactions);
  }, [reconResult]);

  // Synchronous or stepped reconciliation run with status updates
  const handleExecuteReconciliation = async () => {
    if (uploadedFiles.length === 0) return;
    setIsProcessing(true);

    const steps = [
      'Reading files & worksheets...',
      'Detecting columns & headers...',
      'Normalizing Amazon Order IDs...',
      'Matching orders with payout records...',
      'Calculating fees & net disbursements...',
      'Detecting duplicate settlements...',
      'Running data quality validation...',
      'Reconciliation complete!',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i]);
      await new Promise((r) => setTimeout(r, 120));
    }

    setIsProcessing(false);
    setCurrentTab('dashboard');
  };

  // Load sample dataset
  const handleLoadSampleData = () => {
    const { files, mappings } = createAmazonSampleFiles();
    setUploadedFiles(files);
    setFileMappings(mappings);
    setCurrentTab('dashboard');

    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'LOAD_SAMPLE_DATA',
      oldValue: 'Empty Ledger',
      newValue: 'Amazon Merchant Sample Dataset',
      reason: 'User loaded Amazon India seller test files for demo reconciliation.',
      user: 'Seller Admin',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Clear all data
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all imported files and reconciliation data?')) {
      setUploadedFiles([]);
      setFileMappings({});
      setAuditLogs([]);
      setCurrentTab('import');
    }
  };

  // Manual status override on order
  const handleOverrideStatus = (orderId: string, newStatus: PaymentStatus, reason: string) => {
    const existingOrder = reconResult?.orders.find((o: NormalizedOrder) => o.normalizedOrderId === orderId);
    const oldStatus = existingOrder ? existingOrder.status : 'UNKNOWN';

    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'OVERRIDE_STATUS',
      orderId,
      oldValue: oldStatus,
      newValue: newStatus,
      reason,
      user: 'Seller Admin',
    };

    setAuditLogs((prev) => [logEntry, ...prev]);

    // Update selected order in drilldown view immediately
    if (selectedOrder && selectedOrder.normalizedOrderId === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        status: newStatus,
        hasManualOverride: true,
        matchingExplanation: `[Manual Override] ${reason}. (Previously: ${selectedOrder.status})`,
      });
    }
  };

  // Trigger Excel 13-sheet export
  const handleExportFullReport = () => {
    if (!reconResult) return;
    exportFullReconciliationWorkbook({
      summary: reconResult.summary,
      orders: reconResult.orders,
      transactions: reconResult.transactions,
      duplicates: reconResult.duplicates,
      dataQuality: dataQualityIssues,
      monthlyAnalysis: reconResult.monthlyAnalysis,
    });
  };

  // KPI card click: filters order list directly
  const handleFilterStatusFromCard = (status: PaymentStatus | 'ALL') => {
    setOrderStatusFilter(status);
    setCurrentTab('orders');
  };

  // Click month from monthly view
  const handleSelectMonthFromMonthly = (month: string) => {
    setCurrentTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* 3-Zone Contract Top Bar */}
      <Navbar
        summary={reconResult ? reconResult.summary : null}
        hasData={uploadedFiles.length > 0}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenUpload={() => setCurrentTab('import')}
        onExport={handleExportFullReport}
        onClearData={handleClearData}
        onLoadSample={handleLoadSampleData}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          duplicatesCount={reconResult ? reconResult.duplicates.length : 0}
          dataQualityIssues={dataQualityIssues}
          duplicates={reconResult ? reconResult.duplicates : []}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Mobile Nav Drawer Button */}
            <div className="flex items-center justify-between lg:hidden border-b border-slate-200 pb-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Menu className="h-4 w-4" />
                <span>Menu Navigation</span>
              </button>
              <span className="text-xs font-semibold capitalize text-slate-500">
                {currentTab.replace('-', ' ')}
              </span>
            </div>

            {/* Empty State when no files are loaded */}
            {uploadedFiles.length === 0 && currentTab !== 'import' && currentTab !== 'settings' && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  No Data Imported Yet
                </h3>
                <p className="mt-1 max-w-md text-xs text-slate-500">
                  Upload your Amazon Order Reports & Date Range Settlement files (.xlsx, .xls, .csv), or load our realistic sample dataset to inspect reconciliation immediately.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentTab('import')}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Excel / CSV Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Load Realistic Amazon Sample Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: DASHBOARD */}
            {currentTab === 'dashboard' && reconResult && (
              <div className="space-y-6">
                {/* 12 Metric Summary Cards */}
                <SummaryCards
                  summary={reconResult.summary}
                  onFilterStatus={handleFilterStatusFromCard}
                />

                {/* Visualizations: Comparisons, Trajectory, and Status Breakdown */}
                <ReconciliationCharts
                  summary={reconResult.summary}
                  monthlyData={reconResult.monthlyAnalysis}
                  onSelectStatus={handleFilterStatusFromCard}
                  onSelectMonth={handleSelectMonthFromMonthly}
                />

                {/* Financial Gross-to-Net Payment Summary */}
                <PaymentSummary summary={reconResult.summary} />

                {/* Fast Preview Table of Orders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Order Reconciliation Preview
                      </h3>
                      <p className="text-xs text-slate-500">
                        Top recent orders matched against payment settlements
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('orders')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                    >
                      <span>View All {reconResult.orders.length} Orders</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <OrdersTable
                    orders={reconResult.orders}
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                    initialStatusFilter={orderStatusFilter}
                  />
                </div>
              </div>
            )}

            {/* TAB: IMPORT DATA */}
            {currentTab === 'import' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Import Amazon Files
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload single or multiple Excel/CSV files. The engine will inspect sheet headers, identify column semantics, and prepare the reconciliation model.
                  </p>
                </div>

                <FileUploader
                  files={uploadedFiles}
                  fileMappings={fileMappings}
                  onFilesChanged={(f, m) => {
                    setUploadedFiles(f);
                    setFileMappings(m);
                  }}
                  onRunReconciliation={handleExecuteReconciliation}
                  isProcessing={isProcessing}
                  processingStep={processingStep}
                  onLoadSampleData={handleLoadSampleData}
                />
              </div>
            )}

            {/* TAB: RECONCILIATION / ORDERS */}
            {(currentTab === 'reconciliation' || currentTab === 'orders') && reconResult && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Order-Wise Reconciliation Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Search, filter, inspect transaction drilldowns, and audit pending or partial Amazon disbursements
                  </p>
                </div>

                <OrdersTable
                  orders={reconResult.orders}
                  onSelectOrder={(ord) => setSelectedOrder(ord)}
                  initialStatusFilter={orderStatusFilter}
                />
              </div>
            )}

            {/* TAB: PAYMENT SUMMARY */}
            {currentTab === 'payments' && reconResult && (
              <div className="space-y-4">
                <PaymentSummary summary={reconResult.summary} />
              </div>
            )}

            {/* TAB: TRANSACTIONS */}
            {currentTab === 'transactions' && reconResult && (
              <div className="space-y-4">
                <TransactionsTable transactions={reconResult.transactions} />
              </div>
            )}

            {/* TAB: MONTHLY ANALYSIS */}
            {currentTab === 'monthly' && reconResult && (
              <div className="space-y-4">
                <MonthlyAnalysisView
                  monthlyData={reconResult.monthlyAnalysis}
                  onSelectMonth={handleSelectMonthFromMonthly}
                />
              </div>
            )}

            {/* TAB: DUPLICATES */}
            {currentTab === 'duplicates' && reconResult && (
              <div className="space-y-4">
                <DuplicatesView duplicates={reconResult.duplicates} />
              </div>
            )}

            {/* TAB: DATA QUALITY */}
            {currentTab === 'data-quality' && (
              <div className="space-y-4">
                <DataQualityView issues={dataQualityIssues} />
              </div>
            )}

            {/* TAB: AUDIT LOG */}
            {currentTab === 'audit-log' && (
              <div className="space-y-4">
                <AuditLogView logs={auditLogs} />
              </div>
            )}

            {/* TAB: SETTINGS */}
            {currentTab === 'settings' && (
              <div className="space-y-4">
                <SettingsView
                  settings={settings}
                  onUpdateSettings={(newSettings) => setSettings(newSettings)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Drilldown Modal for Order Detail */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          onOverrideStatus={handleOverrideStatus}
        />
      )}
    </div>
  );
}
