import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  User,
  ArrowUpDown,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  Clock,
  Eye,
  Layers,
  Globe,
  Building
} from 'lucide-react';
import { receptionistService } from '../services/receptionistService';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import { t } from '../../../i18n/useLanguage';
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

export default function InvoiceManagementView(props) {
  const initialKeyword = props?.initialKeyword || '';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);

  useEffect(() => {
    if (initialKeyword) {
      setSearchKeyword(initialKeyword);
      setPaymentFilter('ALL');
      setDateFilter('ALL');
      setCurrentPage(1);
    }
  }, [initialKeyword]);

  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [processingId, setProcessingId] = useState(null);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await receptionistService.getAllInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Keyword search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((inv) => {
        const code = (inv.invoiceCode || `INV-${inv.invoiceId}`).toLowerCase();
        const memberName = (inv.memberName || '').toLowerCase();
        const memberPhone = (inv.memberPhone || '').toLowerCase();
        const cashier = (inv.cashierName || '').toLowerCase();
        const itemNames = (inv.items || []).map((it) => (it.itemName || '').toLowerCase()).join(' ');
        return (
          code.includes(kw) ||
          memberName.includes(kw) ||
          memberPhone.includes(kw) ||
          cashier.includes(kw) ||
          itemNames.includes(kw)
        );
      });
    }

    // Payment method filter
    if (paymentFilter !== 'ALL') {
      result = result.filter((inv) => {
        const method = (inv.paymentMethod || 'CASH').toUpperCase();
        if (paymentFilter === 'CASH') return method === 'CASH';
        if (paymentFilter === 'BANK_TRANSFER') return method === 'BANK_TRANSFER' || method === 'TRANSFER' || method === 'VNPAY' || method === 'PAYOS' || method === 'VIETQR';
        return true;
      });
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((inv) => {
        if (statusFilter === 'AWAITING_CONFIRMATION') return inv.status === 'AWAITING_CONFIRMATION';
        if (statusFilter === 'PAID') return inv.status === 'PAID';
        if (statusFilter === 'CANCELLED') return inv.status === 'CANCELLED' || inv.status === 'FAILED';
        return true;
      });
    }

    // Date range filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter((inv) => {
        if (!inv.createdAt) return false;
        const invDate = new Date(inv.createdAt);
        if (dateFilter === 'TODAY') {
          return (
            invDate.getDate() === now.getDate() &&
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear()
          );
        }
        if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return invDate >= sevenDaysAgo;
        }
        if (dateFilter === 'THIS_MONTH') {
          return (
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear()
          );
        }
        return true;
      });
    }

    // Sort by createdAt
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [invoices, searchKeyword, paymentFilter, statusFilter, dateFilter, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, paymentFilter, statusFilter, dateFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, validPage, pageSize]);

  const startRecord = filteredInvoices.length === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endRecord = Math.min(validPage * pageSize, filteredInvoices.length);

  const handleOpenReceipt = (invoice) => {
    setSelectedReceipt(invoice);
    setIsReceiptModalOpen(true);
  };

  const handleApprove = async (invoiceId) => {
    if (!window.confirm(t('Are you sure you want to approve this invoice? The member packages/classes will be activated immediately.'))) return;
    try {
      setProcessingId(invoiceId);
      const token = localStorage.getItem('token');
      await axios.post(`${API_ORIGIN}/api/v1/payment/vietqr-confirm/${invoiceId}`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || t('Failed to approve invoice.'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invoiceId) => {
    if (!window.confirm(t('Are you sure you want to cancel/reject this invoice? The held spots will be released.'))) return;
    try {
      setProcessingId(invoiceId);
      const token = localStorage.getItem('token');
      await axios.post(`${API_ORIGIN}/api/v1/payment/vietqr-reject/${invoiceId}`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || t('Failed to cancel invoice.'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
      
      {/* Front Desk Header - Structured & Sharp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
                {t('Front Desk Invoices & Receipts')}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                {t('Look up recent payment transactions and print/export service receipts for members.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Search Bar - Flat & Square */}
      <div className="p-3 rounded-md bg-[var(--surface)] border border-[var(--border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={t('Search by invoice code (#INV-...), member name, phone...')}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-md px-2 py-1 text-xs">
            <span className="text-[var(--text-muted)]">{t('Status')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('All')}</option>
              <option value="AWAITING_CONFIRMATION">{t('Awaiting Confirmation')}</option>
              <option value="PAID">{t('Paid')}</option>
              <option value="CANCELLED">{t('Cancelled')}</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-md px-2 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('All Methods')}</option>
              <option value="CASH">{t('Cash')}</option>
              <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-md px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-[var(--text)] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('All Time')}</option>
              <option value="TODAY">{t('Today')}</option>
              <option value="LAST_7_DAYS">{t('Last 7 Days')}</option>
              <option value="THIS_MONTH">{t('This Month')}</option>
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text)] transition-colors cursor-pointer"
            title={sortOrder === 'DESC' ? t('Newest First') : t('Oldest First')}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{sortOrder === 'DESC' ? t('Newest') : t('Oldest')}</span>
          </button>
        </div>
      </div>

      {/* Main Invoices Table - Square, Sharp & Clean */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)] text-sm space-y-3">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
            <p className="font-medium">{t('Loading invoice list...')}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] space-y-3">
            <div className="w-10 h-10 rounded-md bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-[var(--text)]">
                {t('No matching invoices found')}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {t('Try changing search keywords or adjusting filters.')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold">
                    <th className="py-2.5 px-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('Invoice No.')}</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('Date & Time')}</th>
                    <th className="py-2.5 px-3">{t('Customer')}</th>
                    <th className="py-2.5 px-3 min-w-[200px]">{t('Service')}</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('Payment Channel')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('Original Amount')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('Actual Amount')}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{t('Status')}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px]">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                  {paginatedInvoices.map((inv, idx) => {
                    const method = (inv.paymentMethod || 'CASH').toUpperCase();
                    const isCash = method === 'CASH';
                    
                    // Determine cashier / channel attribution
                    const isOnline = inv.cashierName && (
                      inv.cashierName.toLowerCase().includes('trực tuyến') ||
                      inv.cashierName.toLowerCase().includes('online') ||
                      inv.cashierName.toLowerCase().includes('hệ thống')
                    );

                    // Multi-service formatting
                    const items = inv.items || [];
                    const hasMultipleItems = items.length > 1;
                    const firstItem = items[0];
                    const allItemsTooltip = items.map((it, i) => 
                      `${i + 1}. ${it.itemName || ''} (${it.durationDays ? `${it.durationDays}d` : (it.totalSessions ? `${it.totalSessions}s` : '-')}) - ${formatMoney(it.amount || it.unitPrice || 0)}`
                    ).join('\n');

                    // Financial amounts
                    const originalAmount = (inv.subtotal && Number(inv.subtotal) > 0)
                      ? Number(inv.subtotal)
                      : Number(inv.totalAmount || 0);
                    const finalAmount = Number(inv.totalAmount || 0);
                    const discount = (inv.discountAmount && Number(inv.discountAmount) > 0)
                      ? Number(inv.discountAmount)
                      : Math.max(0, originalAmount - finalAmount);

                    return (
                      <tr
                        key={inv.invoiceId}
                        className="hover:bg-[var(--surface-hover)]/60 transition-colors"
                      >
                        {/* 1. Row Index */}
                        <td className="py-2.5 px-2 text-center font-mono text-[var(--text-muted)] text-xs">
                          {(validPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* 2. Invoice Code */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-[var(--primary)] text-xs sm:text-sm">
                            {inv.invoiceCode || `INV-${inv.invoiceId}`}
                          </span>
                        </td>

                        {/* 3. Date & Time */}
                        <td className="py-2.5 px-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                          {formatDateTime(inv.createdAt)}
                        </td>

                        {/* 4. Customer */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[var(--text)]">
                            {inv.memberName || t('Walk-in Guest')}
                          </div>
                          {inv.memberPhone && (
                            <div className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <a href={`tel:${inv.memberPhone}`} className="hover:underline">
                                {inv.memberPhone}
                              </a>
                            </div>
                          )}
                        </td>

                        {/* 5. Service (Single vs Multiple) */}
                        <td className="py-2.5 px-3 max-w-[240px]">
                          {hasMultipleItems ? (
                            <div title={allItemsTooltip}>
                              <div className="font-medium text-[var(--text)] truncate">
                                {firstItem?.itemName || t('Sports Service')}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sm text-[10px] font-semibold bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)]">
                                  <Layers className="w-3 h-3" />
                                  <span>+{items.length - 1} {t('more services')}</span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-[var(--text)] truncate">
                                {firstItem?.itemName || t('Sports Service')}
                              </div>
                              {firstItem?.durationDays && (
                                <div className="text-[11px] text-[var(--text-muted)]">
                                  {firstItem.durationDays} {t('days')}
                                </div>
                              )}
                              {firstItem?.totalSessions && (
                                <div className="text-[11px] text-[var(--text-muted)]">
                                  {firstItem.totalSessions} {t('sessions')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. Payment Channel & Method */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                              isCash
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                            }`}>
                              {isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                              <span>{isCash ? t('Cash') : t('Bank Transfer')}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                            {isOnline ? (
                              <>
                                <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                                <span>{t('Online Checkout')}</span>
                              </>
                            ) : (
                              <>
                                <Building className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{inv.cashierName || t('Front Desk')}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 7. Original Amount (Subtotal) */}
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-[var(--text-muted)] whitespace-nowrap">
                          {formatMoney(originalAmount)}
                        </td>

                        {/* 8. Actual Payment (Amount) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text)]">
                            {formatMoney(finalAmount)}
                          </div>
                          {discount > 0 && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                              (-{formatMoney(discount)})
                            </div>
                          )}
                        </td>

                        {/* 9. Status Badge - Square */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {inv.status === 'AWAITING_CONFIRMATION' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              {t('Awaiting Confirmation')}
                            </span>
                          ) : inv.status === 'PAID' ? (
                            <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              {t('PAID')}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              {inv.status || t('CANCELLED')}
                            </span>
                          )}
                        </td>

                        {/* 10. Action Buttons - Progressive Disclosure */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {inv.status === 'AWAITING_CONFIRMATION' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApprove(inv.invoiceId)}
                                disabled={processingId === inv.invoiceId}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
                                title={t('Approve Payment')}
                              >
                                {processingId === inv.invoiceId ? <RotateCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span>{t('Approve')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(inv.invoiceId)}
                                disabled={processingId === inv.invoiceId}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                                title={t('Reject / Cancel Order')}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{t('Reject')}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Primary: View Details (Modal) */}
                              <button
                                onClick={() => handleOpenReceipt(inv)}
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] transition-colors cursor-pointer"
                                title={t('View Details')}
                              >
                                <Eye className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <span>{t('View Details')}</span>
                              </button>

                              {/* Secondary: Print Receipt */}
                              <button
                                onClick={() => handleOpenReceipt(inv)}
                                type="button"
                                className="p-1 text-xs font-medium rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer"
                                title={t('Print Receipt')}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Square & Minimal */}
            {filteredInvoices.length > 0 && (
              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-hover)]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 order-2 sm:order-1">
                  <span>{t("Showing")}</span>
                  <strong className="text-[var(--text)] font-semibold">{startRecord}–{endRecord}</strong>
                  <span>{t("of")}</span>
                  <strong className="text-[var(--text)] font-semibold">{filteredInvoices.length}</strong>
                  <span>{t("invoices")}</span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 order-1 sm:order-2 select-none">
                    {/* Previous button */}
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

                    {/* Page numbers */}
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

                    {/* Next button */}
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
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reusable White Paper Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
