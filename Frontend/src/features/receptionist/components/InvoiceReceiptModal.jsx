import React, { useRef, useState } from 'react';
import { Printer, X, CheckCircle2, Receipt, Building2, Phone, Mail, MapPin, Copy, Check } from 'lucide-react';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import { t } from '../../../i18n/useLanguage';

export default function InvoiceReceiptModal({ isOpen, onClose, receipt }) {
  const [copied, setCopied] = useState(false);
  const printContainerRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handleCopyCode = () => {
    const code = receipt.invoiceCode || `INV-${receipt.invoiceId}`;
    if (code) {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paymentMethodLabel = (method) => {
    if (!method) return t('Cash');
    const m = method.toUpperCase();
    if (m === 'CASH') return t('Cash');
    if (m === 'BANK_TRANSFER' || m === 'TRANSFER') return t('Bank Transfer');
    if (m === 'VNPAY') return 'VNPay';
    if (m === 'MOMO') return 'MoMo';
    return method;
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const invCode = receipt.invoiceCode || `INV-${receipt.invoiceId}`;
    const formattedDate = formatDateTime(receipt.createdAt);
    const totalFormatted = formatMoney(receipt.totalAmount);
    const cashier = receipt.cashierName || t('Front Desk');

    const itemsRows = (receipt.items && receipt.items.length > 0)
      ? receipt.items.map((it, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a;">${it.itemName || ''}</td>
          <td style="color: #475569;">${it.itemType === 'PACKAGE' ? t('Membership Package') : it.itemType === 'CLASS' ? t('Class / Course') : t('Sports Service')}</td>
          <td style="text-align: center; color: #334155;">${it.durationDays ? `${it.durationDays} ${t('days')}` : (it.totalSessions ? `${it.totalSessions} ${t('sessions')}` : '-')}</td>
          <td style="text-align: right; color: #334155;">${formatMoney(it.unitPrice)}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(it.amount)}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="text-align: center; color: #64748b;">1</td>
          <td style="font-weight: 700; color: #0f172a;">${t('Front Desk Sports Service')}</td>
          <td style="color: #475569;">${t('Sports Service')}</td>
          <td style="text-align: center; color: #334155;">-</td>
          <td style="text-align: right; color: #334155;">${totalFormatted}</td>
          <td style="text-align: right; font-weight: 700; color: #0f172a;">${totalFormatted}</td>
        </tr>
      `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>${invCode}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #ffffff;
              color: #0f172a;
              font-size: 12px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 1.5px dashed #cbd5e1;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .center-name {
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .center-sub {
              font-size: 11px;
              color: #475569;
              font-weight: 500;
              margin-top: 2px;
            }
            .center-contact {
              margin-top: 5px;
              font-size: 10.5px;
              color: #64748b;
            }
            .title-box {
              text-align: center;
              margin-bottom: 14px;
            }
            .receipt-title {
              font-size: 17px;
              font-weight: 800;
              text-transform: uppercase;
              color: #1d4ed8;
              letter-spacing: 0.8px;
            }
            .receipt-sub {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }
            .meta-strip {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 16px;
              margin-top: 8px;
              font-size: 11.5px;
            }
            .code-badge {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 2px 8px;
              border-radius: 4px;
              font-family: monospace;
              font-weight: 700;
              color: #1d4ed8;
            }
            .status-badge {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #86efac;
              padding: 2px 8px;
              border-radius: 10px;
              font-weight: 700;
              font-size: 10.5px;
            }
            .box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 14px;
            }
            .box-title {
              font-weight: 700;
              font-size: 11.5px;
              color: #0f172a;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              margin-bottom: 6px;
              display: flex;
              justify-content: space-between;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px 12px;
              font-size: 11.5px;
              color: #334155;
            }
            .table-wrap {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11.5px;
            }
            th {
              background: #f1f5f9;
              border-bottom: 1px solid #cbd5e1;
              padding: 7px 10px;
              font-weight: 700;
              color: #334155;
              text-align: left;
            }
            td {
              padding: 7px 10px;
              border-bottom: 1px solid #f1f5f9;
            }
            .summary-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .total-val {
              font-size: 19px;
              font-weight: 900;
              color: #1d4ed8;
            }
            .sigs {
              display: flex;
              justify-content: space-between;
              text-align: center;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              margin-bottom: 22px;
            }
            .sig-col {
              width: 45%;
            }
            .sig-name {
              font-weight: 700;
              font-size: 12px;
              color: #1e293b;
            }
            .sig-sub {
              font-size: 10px;
              font-style: italic;
              color: #64748b;
              margin-top: 2px;
              margin-bottom: 50px;
            }
            .footer-msg {
              text-align: center;
              font-size: 10.5px;
              font-style: italic;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="center-name">Nexus Sport Center</h1>
            <p class="center-sub">${t('International Sports & Fitness Center')}</p>
            <p class="center-contact">Toà nhà FPT, Cái Răng, Cần Thơ &nbsp;|&nbsp; Hotline: 1900 6868 &nbsp;|&nbsp; support@nexussport.vn</p>
          </div>

          <div class="title-box">
            <h2 class="receipt-title">${t('Service Payment Receipt')}</h2>
            <p class="receipt-sub">SERVICE PAYMENT RECEIPT</p>
            <div class="meta-strip">
              <span>${t('Invoice No.')}: <strong class="code-badge">${invCode}</strong></span>
              <span>${t('Date & Time')}: <strong>${formattedDate}</strong></span>
              <span class="status-badge">${receipt.status === 'PAID' ? t('PAID') : (receipt.status || t('COMPLETED'))}</span>
            </div>
          </div>

          <div class="box">
            <div class="box-title">
              <span>${t('Member Information')}</span>
              ${receipt.userId ? `<span style="font-family: monospace; color: #64748b;">ID #${receipt.userId}</span>` : ''}
            </div>
            <div class="grid-2">
              <div><span style="color: #64748b;">${t('Customer')}:</span> <strong>${receipt.memberName || t('Walk-in Guest')}</strong></div>
              <div><span style="color: #64748b;">${t('Phone number')}:</span> <strong>${receipt.memberPhone || '-'}</strong></div>
              <div style="grid-column: span 2;"><span style="color: #64748b;">Email:</span> <strong>${receipt.memberEmail || '-'}</strong></div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 32px; text-align: center;">#</th>
                  <th>${t('Service / Course Name')}</th>
                  <th>${t('Service Type')}</th>
                  <th style="text-align: center;">${t('Duration / Sessions')}</th>
                  <th style="text-align: right;">${t('Unit Price')}</th>
                  <th style="text-align: right;">${t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <div class="summary-box">
            <div>
              <div style="color: #64748b; font-size: 11px;">${t('Payment Method')}: <strong style="color: #0f172a; font-size: 12px;">${paymentMethodLabel(receipt.paymentMethod)}</strong></div>
              ${receipt.transactionNo ? `<div style="color: #64748b; font-size: 10.5px; font-family: monospace; margin-top: 2px;">Ref: ${receipt.transactionNo}</div>` : ''}
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${t('Cashier')}: <strong style="color: #334155;">${cashier}</strong></div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">${t('Total Payment')}</span>
              <span class="total-val">${totalFormatted}</span>
            </div>
          </div>

          <div class="sigs">
            <div class="sig-col">
              <div class="sig-name">${t('Payer / Customer')}</div>
              <div class="sig-sub">${t('(Signature & Full Name)')}</div>
            </div>
            <div class="sig-col">
              <div class="sig-name">${t('Cashier / Receptionist')}</div>
              <div class="sig-sub">${cashier}</div>
            </div>
          </div>

          <p class="footer-msg">${t('Thank you for using our services at Nexus Sport Center!')}</p>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);
  };

  const invCode = receipt.invoiceCode || `INV-${receipt.invoiceId}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      {/* Modal Dialog Card - Spacious 768px width, pristine white paper styling */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Header: Clean Title + Only Close Button (NO duplicate Print button here) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 text-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-slate-800 text-base">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>{t('Invoice & Payment Receipt')}</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors"
            title={t('Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: Fits all content comfortably */}
        <div ref={printContainerRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-slate-900 flex-1">
          
          {/* Center Brand Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-5">
            <div className="inline-flex items-center gap-2 justify-center mb-1">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase">
                Nexus Sport Center
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {t('International Sports & Fitness Center')}
            </p>
            <div className="mt-2 text-xs text-slate-500 flex flex-wrap justify-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Toà nhà FPT, Cái Răng, Cần Thơ</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>1900 6868</span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@nexussport.vn</span>
              </span>
            </div>
          </div>

          {/* Receipt Title & Meta */}
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-blue-700">
              {t('Service Payment Receipt')}
            </h3>
            <p className="text-xs text-slate-400 font-medium tracking-wider">
              SERVICE PAYMENT RECEIPT
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md font-mono font-medium text-slate-700 border border-slate-200">
                <span>{t('Invoice No.')}:</span>
                <span className="text-blue-700 font-bold">{invCode}</span>
                <button
                  onClick={handleCopyCode}
                  type="button"
                  className="ml-1 text-slate-400 hover:text-blue-600 transition-colors"
                  title={t('Copy')}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-slate-600">
                {t('Date & Time')}: <span className="font-semibold text-slate-800">{formatDateTime(receipt.createdAt)}</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{receipt.status === 'PAID' ? t('PAID') : (receipt.status || t('COMPLETED'))}</span>
              </div>
            </div>
          </div>

          {/* Member Information Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
            <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
              <span>{t('Member Information')}</span>
              {receipt.userId && <span className="font-mono text-slate-500 text-xs font-bold">ID #{receipt.userId}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500">{t('Customer')}: </span>
                <span className="font-bold text-slate-900">{receipt.memberName || t('Walk-in Guest')}</span>
              </div>
              <div>
                <span className="text-slate-500">{t('Phone number')}: </span>
                <span className="font-semibold text-slate-800">{receipt.memberPhone || '-'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Email: </span>
                <span className="font-semibold text-slate-800">{receipt.memberEmail || '-'}</span>
              </div>
            </div>
          </div>

          {/* Items Table - Broad columns that never wrap awkwardly */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5">{t('Service / Course Name')}</th>
                  <th className="py-3 px-3.5">{t('Service Type')}</th>
                  <th className="py-3 px-3.5 text-center">{t('Duration / Sessions')}</th>
                  <th className="py-3 px-3.5 text-right">{t('Unit Price')}</th>
                  <th className="py-3 px-3.5 text-right">{t('Total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {item.itemName}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {item.itemType === 'PACKAGE'
                          ? t('Membership Package')
                          : item.itemType === 'CLASS'
                          ? t('Class / Course')
                          : t('Sports Service')}
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-700 font-medium">
                        {item.durationDays ? `${item.durationDays} ${t('days')}` : (item.totalSessions ? `${item.totalSessions} ${t('sessions')}` : '-')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-800">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                        {formatMoney(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-3.5 text-center font-mono text-slate-400">1</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {t('Front Desk Sports Service')}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">{t('Sports Service')}</td>
                    <td className="py-3 px-3.5 text-center text-slate-500">-</td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-800">{formatMoney(receipt.totalAmount)}</td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900">{formatMoney(receipt.totalAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">{t('Payment Method')}: </span>
                <span className="font-bold text-slate-900">{paymentMethodLabel(receipt.paymentMethod)}</span>
              </div>
              {receipt.transactionNo && (
                <div>
                  <span className="text-slate-500">{t('Reference No.')}: </span>
                  <span className="font-mono text-xs text-slate-700 font-semibold">{receipt.transactionNo}</span>
                </div>
              )}
              {receipt.cashierName && (
                <div>
                  <span className="text-slate-500">{t('Cashier')}: </span>
                  <span className="font-medium text-slate-800">{receipt.cashierName}</span>
                </div>
              )}
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 w-full sm:w-auto">
              <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold block">
                {t('Total Payment')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-700">
                {formatMoney(receipt.totalAmount)}
              </span>
            </div>
          </div>

          {/* Signatures & Footer Note */}
          <div className="pt-4 border-t border-dashed border-slate-300">
            <div className="grid grid-cols-2 text-center text-xs sm:text-sm">
              <div className="space-y-12">
                <span className="font-bold text-slate-800 block">
                  {t('Payer / Customer')}
                </span>
                <span className="text-xs italic text-slate-500 block">{t('(Signature & Full Name)')}</span>
              </div>
              <div className="space-y-12">
                <span className="font-bold text-slate-800 block">
                  {t('Cashier / Receptionist')}
                </span>
                <span className="text-xs italic text-slate-600 block">{receipt.cashierName || t('(Signature & Full Name)')}</span>
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] text-slate-500 italic">
              {t('Thank you for using our services at Nexus Sport Center!')}
            </p>
          </div>

        </div>

        {/* Modal Bottom Actions: ONLY ONE Print Invoice Button + Close Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-sm"
          >
            {t('Close')}
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Invoice')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
