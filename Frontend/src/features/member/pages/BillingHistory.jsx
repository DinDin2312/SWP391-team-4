import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  XCircle,
  ShieldCheck,
  Search,
  ArrowRight,
  FileText
} from 'lucide-react';

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
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const BillingHistory = () => {
  useLanguage();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  
  // Filtering & Pagination
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/invoices', {
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

  const handleCancelInvoice = async (invoiceId) => {
    try {
      setCancellingId(invoiceId);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/v1/payment/cancel-pending-checkout',
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

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
        <RefreshCw className="w-8 h-8 text-[#0071E3] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("Loading Billing History...")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 pb-6 mb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <span>{t("Billing & Invoices")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
              {t("View your purchase history, membership payments, and class bookings.")}
            </p>
          </div>

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer active:scale-95"
            title={t("Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t("Refresh")}</span>
          </button>
        </div>

        {/* Cupertino Segmented Control & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Segmented Control */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.05] self-start overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: t('All'), count: invoices.length },
              { id: 'PAID', label: t('Paid'), count: paidCount },
              { id: 'PENDING', label: t('Pending'), count: pendingCount },
              { id: 'CANCELLED', label: t('Cancelled'), count: cancelledCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? 'bg-blue-500/15 text-[#0071E3] dark:text-[#0A84FF]'
                    : 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px] md:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search by invoice # or package...")}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold">
          {t(error)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t("No invoices found")}</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {t("You haven't made any purchases yet.")}
          </p>
        </div>
      ) : (
        /* 2-Column Responsive Apple HIG Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column (8 cols): Invoices List */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 text-center backdrop-blur-xl">
                <Receipt className="w-10 h-10 text-slate-400 mb-3 opacity-50" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{t("No matching invoices found")}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t("Try adjusting your keyword filter or changing status tab.")}
                </p>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-bold hover:bg-[#0077ED] transition-all cursor-pointer shadow-sm"
                >
                  {t("Clear filters")}
                </button>
              </div>
            ) : (
              paginatedInvoices.map((invoice) => (
                <div 
                  key={invoice.invoiceId} 
                  className="rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
                        <Receipt className="w-6 h-6 shrink-0" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {t("Invoice #")}{invoice.invoiceId.toString().padStart(6, '0')}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${getStatusBadgeStyle(invoice.status)}`}>
                            {t(invoice.status || 'UNKNOWN')}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{formatDateTime(invoice.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end bg-white/60 dark:bg-slate-900/40 p-2.5 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("Total Amount")}</span>
                      <span className="text-xl sm:text-2xl font-black text-[#0071E3] dark:text-[#0A84FF] tracking-tight">{formatMoney(invoice.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex flex-col gap-5">
                    
                    {/* Purchased Items Sub-container */}
                    <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] p-4 flex flex-col gap-2.5">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>{t("Purchased Items")}</span>
                      </span>
                      {invoice.details && invoice.details.length > 0 ? (
                        invoice.details.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/60 dark:border-white/[0.05] shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0">
                                {item.itemType === 'CLASS' || item.itemType === 'CLASS_SCHEDULE' ? (
                                  <Dumbbell className="w-4 h-4" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.itemName}</span>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shrink-0 ml-3">{formatMoney(item.unitPrice)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic py-1">{t("No detailed items found for this invoice.")}</span>
                      )}
                    </div>

                    {/* Payment Metadata Stripe */}
                    {(invoice.paymentMethod || invoice.transactionNo || invoice.paymentDate) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
                        {invoice.paymentMethod && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("Payment Method")}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{invoice.paymentMethod}</span>
                          </div>
                        )}
                        {invoice.transactionNo && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("Transaction ID")}</span>
                            <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{invoice.transactionNo}</span>
                          </div>
                        )}
                        {invoice.paymentDate && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t("Payment Date")}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatDateTime(invoice.paymentDate)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions for PENDING invoice */}
                    {invoice.status === 'PENDING' && (
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => handleCancelInvoice(invoice.invoiceId)}
                          disabled={cancellingId === invoice.invoiceId}
                          className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {cancellingId === invoice.invoiceId ? t('Cancelling...') : t('Cancel Order')}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/member/vietqr-pay?invoiceId=${invoice.invoiceId}`)}
                          className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t('Resume Payment')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}

            {/* Pagination Controls */}
            {filteredInvoices.length > 0 && (
              <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 order-2 sm:order-1">
                  <span>{t("Showing")}</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{startRecord}–{endRecord}</strong>
                  <span>{t("of")}</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{filteredInvoices.length}</strong>
                  <span>{t("invoices")}</span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 order-1 sm:order-2 select-none">
                    {/* Previous button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                      title={t("Previous")}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("Previous")}</span>
                    </button>

                    {/* Page numbers (1, 2, 3...) */}
                    <div className="flex items-center gap-1">
                      {getPaginationRange(validPage, totalPages).map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400">
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
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-[#0071E3] text-white shadow-xs shadow-blue-500/30 ring-1 ring-blue-500"
                                : "border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                      title={t("Next")}
                    >
                      <span className="hidden sm:inline">{t("Next")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Column (4 cols): Apple Glass Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-6">
            
            {/* Widget 1: Spending Overview (Apple Gradient Card) */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#0071E3] via-blue-700 to-indigo-800 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
              {/* Diffused specular glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-400/30 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                  <Wallet className="w-4 h-4" />
                  <span>{t("Total Spending")}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-md text-white border border-white/20">
                  {paidCount} {t("paid")}
                </span>
              </div>

              <div className="relative z-10 my-3">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">{formatMoney(totalSpent)}</span>
                <p className="text-[11px] text-white/80 mt-1 font-normal">{t("Lifetime verified membership & course investment")}</p>
              </div>

              <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-medium text-white/90">
                <span>{t("Active Invoices")}: {invoices.length}</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t("100% Protected")}</span>
                </span>
              </div>
            </div>

            {/* Widget 2: Pending Quick-Pay Action Alert (if any PENDING invoices exist) */}
            {pendingInvoices.length > 0 && (
              <div className="rounded-3xl p-5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-900 dark:text-amber-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
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
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{t("Pay Invoice Now")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Widget 3: Transaction Breakdown & Legal VAT Note */}
            <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>{t("Transaction Breakdown")}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div 
                  onClick={() => setStatusFilter('PAID')}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40 font-bold'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/15 hover:bg-emerald-500/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("Paid Orders")}</span>
                  </span>
                  <strong className="font-bold">{paidCount}</strong>
                </div>

                <div 
                  onClick={() => setStatusFilter('PENDING')}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/40 font-bold'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/15 hover:bg-amber-500/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t("Pending Orders")}</span>
                  </span>
                  <strong className="font-bold">{pendingCount}</strong>
                </div>

                <div 
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40 font-bold'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/15 hover:bg-rose-500/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t("Cancelled / Expired")}</span>
                  </span>
                  <strong className="font-bold">{cancelledCount}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
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
    </div>
  );
};

export default BillingHistory;
