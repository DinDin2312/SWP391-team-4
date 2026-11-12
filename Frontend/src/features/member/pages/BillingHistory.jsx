import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import { formatPaymentMethodLabel } from '../memberUtils';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Receipt, 
  Dumbbell, 
  CreditCard, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
  Printer
} from 'lucide-react';
import InvoiceReceiptModal from '../../receptionist/components/InvoiceReceiptModal';
import { API_ORIGIN } from '../../../config/apiBase.js';

const getPaginationRange = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

const getStatusBadgeStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'PAID':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'PENDING':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
  }
};

const BillingHistory = () => {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  
  // Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Progressive Disclosure: Track which invoice's items are expanded
  const [expandedInvoices, setExpandedInvoices] = useState({});

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const toggleExpand = (invoiceId) => {
    setExpandedInvoices(prev => ({ ...prev, [invoiceId]: !prev[invoiceId] }));
  };

  const handleOpenReceipt = (invoice) => {
    setSelectedReceipt({
      ...invoice,
      invoiceCode: invoice.invoiceCode || `INV-${String(invoice.invoiceId).padStart(6, '0')}`,
      items: invoice.details || []
    });
    setIsReceiptModalOpen(true);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_ORIGIN}/api/v1/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      setError("Unable to load billing history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const rawId = searchParams.get('invoiceId');
    if (!rawId || loading || invoices.length === 0) return;
    const targetId = Number(rawId);
    const idx = invoices.findIndex((inv) => Number(inv.invoiceId) === targetId);
    if (idx === -1) return;

    setStatusFilter('ALL');
    setSearchQuery('');
    setCurrentPage(Math.floor(idx / pageSize) + 1);
    setExpandedInvoices((prev) => ({ ...prev, [targetId]: true }));
    setHighlightedInvoiceId(targetId);

    setTimeout(() => {
      document.getElementById(`invoice-card-${targetId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    const next = new URLSearchParams(searchParams);
    next.delete('invoiceId');
    setSearchParams(next, { replace: true });

    const timer = setTimeout(() => setHighlightedInvoiceId(null), 4000);
    return () => clearTimeout(timer);
  }, [searchParams, setSearchParams, loading, invoices, pageSize]);

  const handleCancelInvoice = async (invoiceId) => {
    try {
      setCancellingId(invoiceId);
      const token = localStorage.getItem('token');
      await axios.post(`${API_ORIGIN}/api/v1/payment/cancel-pending-checkout`,
        { invoiceId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      window.dispatchEvent(new Event('cartUpdated'));
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || t('Unable to cancel order.'));
    } finally {
      setCancellingId(null);
    }
  };

  // Metrics for Sidebar Widgets
  const { totalSpent, paidCount, pendingCount, cancelledCount, pendingInvoices } = useMemo(() => {
    let spent = 0;
    let paid = 0;
    let pending = 0;
    let cancelled = 0;
    const pendings = [];

    invoices.forEach((inv) => {
      const s = (inv.status || '').toUpperCase();
      if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') {
        spent += Number(inv.totalAmount || 0);
        paid += 1;
      } else if (s === 'PENDING') {
        pending += 1;
        pendings.push(inv);
      } else if (s === 'CANCELLED' || s === 'FAILED') {
        cancelled += 1;
      }
    });

    return {
      totalSpent: spent,
      paidCount: paid,
      pendingCount: pending,
      cancelledCount: cancelled,
      pendingInvoices: pendings
    };
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const s = (inv.status || '').toUpperCase();
      if (statusFilter === 'PAID' && !(s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED')) {
        return false;
      }
      if (statusFilter === 'PENDING' && s !== 'PENDING') {
        return false;
      }
      if (statusFilter === 'CANCELLED' && !(s === 'CANCELLED' || s === 'FAILED')) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const invoiceNo = String(inv.invoiceId || '');
        const formattedId = invoiceNo.padStart(6, '0');
        const transNo = String(inv.transactionNo || '').toLowerCase();
        const hasItemMatch = (inv.details || []).some((item) =>
          String(item.itemName || '').toLowerCase().includes(q)
        );
        if (!invoiceNo.includes(q) && !formattedId.includes(q) && !transNo.includes(q) && !hasItemMatch) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const applyStatusFilter = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const applySearchQuery = (nextQuery) => {
    setSearchQuery(nextQuery);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, validPage, pageSize]);

  const startRecord = filteredInvoices.length === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endRecord = Math.min(validPage * pageSize, filteredInvoices.length);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-80 gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("Loading Billing History...")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 pb-5 mb-6 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <span>{t("Billing & Invoices")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("View your purchase history, membership payments, and class bookings.")}
            </p>
          </div>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title={t("Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t("Refresh")}</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Segmented Filter Buttons */}
          <div className="inline-flex p-1 rounded-md bg-[var(--surface)] border border-[var(--border)] self-start overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: t('All'), count: invoices.length },
              { id: 'PAID', label: t('Paid'), count: paidCount },
              { id: 'PENDING', label: t('Pending'), count: pendingCount },
              { id: 'CANCELLED', label: t('Cancelled'), count: cancelledCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => applyStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-sm font-mono font-bold ${
                  statusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px] md:max-w-xs w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => applySearchQuery(e.target.value)}
              placeholder={t("Search by invoice # or package...")}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-md bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => applySearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-md text-sm font-semibold">
          {t(error)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-[var(--surface)] rounded-md border border-[var(--border)] text-center">
          <div className="w-12 h-12 rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)] flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">{t("No invoices found")}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
            {t("You haven't made any purchases yet.")}
          </p>
        </div>
      ) : (
        /* 2-Column Responsive Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Column (8 cols): Invoices List */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface)] rounded-md border border-[var(--border)] text-center">
                <Receipt className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <h4 className="text-sm font-bold text-[var(--text)]">{t("No matching invoices found")}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t("Try adjusting your keyword filter or changing status tab.")}
                </p>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }}
                  className="mt-3 px-3 py-1.5 rounded-md bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer"
                >
                  {t("Clear filters")}
                </button>
              </div>
            ) : (
              paginatedInvoices.map((invoice) => {
                const isExpanded = !!expandedInvoices[invoice.invoiceId];
                const details = invoice.details || [];
                const hasMultiple = details.length > 1;
                const visibleDetails = isExpanded || !hasMultiple ? details : [details[0]];

                const originalSubtotal = (invoice.subtotal && Number(invoice.subtotal) > 0)
                  ? Number(invoice.subtotal)
                  : Number(invoice.totalAmount || 0);
                const finalAmount = Number(invoice.totalAmount || 0);
                const discount = (invoice.discountAmount && Number(invoice.discountAmount) > 0)
                  ? Number(invoice.discountAmount)
                  : Math.max(0, originalSubtotal - finalAmount);

                const invCode = invoice.invoiceCode || `#INV-${invoice.invoiceId.toString().padStart(6, '0')}`;

                return (
                  <div 
                    key={invoice.invoiceId}
                    id={`invoice-card-${invoice.invoiceId}`}
                    className={`rounded-md bg-[var(--surface)] overflow-hidden flex flex-col transition-all shadow-xs hover:shadow-sm border ${
                      highlightedInvoiceId === invoice.invoiceId
                        ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30'
                        : 'border-slate-300 dark:border-white/15'
                    }`}
                  >
                    {/* 1. Card Header - Dark Header Cap for Maximum Contrast & Clear Separation */}
                    <div className="p-4 bg-slate-900 dark:bg-black text-white border-b border-slate-800 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                          <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-white font-mono tracking-wide">
                              {invCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${getStatusBadgeStyle(invoice.status)}`}>
                              {t(invoice.status || 'UNKNOWN')}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateTime(invoice.createdAt)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Header Right: Payment Method & Ref */}
                      <div className="flex flex-col sm:items-end text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {t("Payment Method")}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap sm:justify-end">
                          <span className="font-bold text-white">
                            {formatPaymentMethodLabel(invoice.paymentMethod, lang)}
                          </span>
                          {invoice.transactionNo && (
                            <span className="text-[11px] font-mono text-slate-400">
                              ({t("Transaction ID")}: <strong className="text-slate-200 font-semibold">{invoice.transactionNo}</strong>)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Card Body */}
                    <div className="p-4 flex flex-col gap-3">
                      
                      {/* Section A: Purchased Items (Clean list with clear toggle) */}
                      <div className="rounded-md bg-[var(--bg)] border border-[var(--border)] p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>{t("Purchased Items")} ({details.length} {t("services")})</span>
                          </span>
                          {hasMultiple && (
                            <span className="text-[11px] font-medium text-[var(--text-muted)]">
                              {isExpanded ? t("Showing all") : `1 / ${details.length}`}
                            </span>
                          )}
                        </div>

                        {/* Items rows */}
                        {visibleDetails.length > 0 ? (
                          <div className="space-y-1.5">
                            {visibleDetails.map((item, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-2.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-sm bg-[var(--surface-hover)] text-[var(--primary)] flex items-center justify-center shrink-0">
                                    {item.itemType === 'CLASS' || item.itemType === 'CLASS_SCHEDULE' ? (
                                      <Dumbbell className="w-3.5 h-3.5" />
                                    ) : (
                                      <CreditCard className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <span className="font-semibold text-[var(--text)] truncate">{item.itemName}</span>
                                </div>
                                <span className="font-mono font-semibold text-[var(--text)] shrink-0 ml-2">
                                  {formatMoney(item.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic py-1">{t("No detailed items found for this invoice.")}</span>
                        )}

                        {/* Expand / Collapse Button if multiple items */}
                        {hasMultiple && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(invoice.invoiceId)}
                            className="mt-1 py-1.5 px-3 rounded-md bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--primary)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <span>{t("Hide items")}</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <Layers className="w-3.5 h-3.5" />
                                <span>+{details.length - 1} {t("more services")} • {t("Show all items")}</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Section B: Financial Breakdown (The ONLY place displaying financial computation) */}
                      <div className="rounded-md bg-[var(--surface-hover)]/60 border border-[var(--border)] p-3 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[var(--text)]">
                          <span className="text-[var(--text-muted)]">
                            {t("Total Items Price")} ({details.length} {t("services")}):
                          </span>
                          <span className="font-mono font-semibold">{formatMoney(originalSubtotal)}</span>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Tag className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-semibold">{t("Discount / Voucher")}:</span>
                              {invoice.voucherCode && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                  {invoice.voucherCode}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold">-{formatMoney(discount)}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center font-bold">
                          <span className="text-[var(--text)] uppercase tracking-wide text-[11px]">{t("Grand Total")}:</span>
                          <span className="text-base sm:text-lg font-mono text-[var(--text)] font-extrabold">{formatMoney(finalAmount)}</span>
                        </div>
                      </div>

                      {/* Section C: Card Footer - Action Buttons Only (No duplicated text) */}
                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2 text-xs">
                        {invoice.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelInvoice(invoice.invoiceId)}
                              disabled={cancellingId === invoice.invoiceId}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {cancellingId === invoice.invoiceId ? t('Cancelling...') : t('Cancel Order')}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/member/vietqr-pay?invoiceId=${invoice.invoiceId}`)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-md bg-[var(--primary)] hover:opacity-90 text-white transition-opacity flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t('Resume Payment')}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(invoice)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer"
                            title={t("View Receipt")}
                          >
                            <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{t("View Receipt")}</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {filteredInvoices.length > 0 && totalPages > 1 && (
              <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 order-2 sm:order-1">
                  <span>{t("Showing")}</span>
                  <strong className="text-[var(--text)] font-semibold">{startRecord}–{endRecord}</strong>
                  <span>{t("of")}</span>
                  <strong className="text-[var(--text)] font-semibold">{filteredInvoices.length}</strong>
                  <span>{t("invoices")}</span>
                </div>

                <div className="flex items-center gap-1 order-1 sm:order-2 select-none">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validPage === 1}
                    className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none text-xs text-[var(--text)] transition-colors flex items-center gap-1 cursor-pointer"
                    title={t("Previous")}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">{t("Previous")}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPaginationRange(validPage, totalPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = p === validPage;
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            isCurrent
                              ? "bg-[var(--primary)] text-white"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validPage === totalPages}
                    className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none text-xs text-[var(--text)] transition-colors flex items-center gap-1 cursor-pointer"
                    title={t("Next")}
                  >
                    <span className="hidden sm:inline">{t("Next")}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-6">
            
            {/* Widget 1: Spending Overview Card */}
            <div className="rounded-md p-5 bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between min-h-[170px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <Wallet className="w-4 h-4 text-[var(--primary)]" />
                  <span>{t("Total Spending")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {paidCount} {t("paid")}
                </span>
              </div>

              <div className="my-3">
                <span className="text-2xl font-black font-mono tracking-tight text-[var(--text)]">{formatMoney(totalSpent)}</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">{t("Lifetime verified membership & course investment")}</p>
              </div>

              <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{t("Active Invoices")}: <strong className="text-[var(--text)]">{invoices.length}</strong></span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t("100% Protected")}</span>
                </span>
              </div>
            </div>

            {/* Widget 2: Pending Quick-Pay Action Alert */}
            {pendingInvoices.length > 0 && (
              <div className="rounded-md p-4 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">{t("Pending Action Required")}</h4>
                    <span className="text-[11px] opacity-80">{pendingInvoices.length} {t("order(s) waiting for payment")}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {t("Invoice #")}{pendingInvoices[0].invoiceId.toString().padStart(6, '0')} ({formatMoney(pendingInvoices[0].totalAmount)}) {t("is currently reserving your slots. Complete checkout before expiration.")}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/member/vietqr-pay?invoiceId=${pendingInvoices[0].invoiceId}`)}
                  className="w-full py-2 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{t("Pay Invoice Now")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Widget 3: Transaction Breakdown & Legal VAT Note */}
            <div className="rounded-md p-4 bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t("Transaction Breakdown")}</span>
              </h4>

              <div className="space-y-1.5 text-xs">
                <div 
                  onClick={() => applyStatusFilter('PAID')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/40'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/15 hover:bg-emerald-500/15'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("Paid Orders")}</span>
                  </span>
                  <strong className="font-mono">{paidCount}</strong>
                </div>

                <div 
                  onClick={() => applyStatusFilter('PENDING')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/15 hover:bg-amber-500/15'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t("Pending Orders")}</span>
                  </span>
                  <strong className="font-mono">{pendingCount}</strong>
                </div>

                <div 
                  onClick={() => applyStatusFilter('CANCELLED')}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/40'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/15 hover:bg-rose-500/15'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t("Cancelled / Expired")}</span>
                  </span>
                  <strong className="font-mono">{cancelledCount}</strong>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1 font-semibold text-[var(--text)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t("Official Electronic Invoices")}</span>
                </div>
                <p>
                  {t("All transactions are digitally logged with SSL 256-bit encryption. Present your Invoice ID at Reception for corporate VAT tax receipts.")}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Official White Paper Invoice & Payment Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />

    </div>
  );
};

export default BillingHistory;
