import React, { useState } from 'react';
import { QrCode, X } from 'lucide-react';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { formatDate } from '../../../utils/displayFormat';
import { buildMemberQrPayload, buildMemberQrImageUrl } from '../memberUtils';

/**
 * Shared scannable QR modal for member class bookings and turnstile pass.
 */
const MemberSessionQrModal = ({
  isOpen,
  onClose,
  session,
  userInfo,
  fallbackUserId = null,
  getStatusBadgeClass = null,
}) => {
  useLanguage();
  const [failedQrUrl, setFailedQrUrl] = useState(null);

  const resolvedUserId = userInfo?.userId || fallbackUserId || null;
  const bookingId = session?.isTurnstile ? null : (session?.bookingId || null);
  const qrPayload = buildMemberQrPayload({
    userId: resolvedUserId,
    email: userInfo?.email,
    bookingId,
  });
  const qrImageUrl = buildMemberQrImageUrl(qrPayload, 220);
  const imgFailed = Boolean(qrImageUrl) && failedQrUrl === qrImageUrl;

  if (!isOpen || !session) return null;

  const statusBadgeClass = getStatusBadgeClass
    ? `px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(session.status)}`
    : 'font-semibold text-[var(--success-text)]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)]"
          aria-label={t('Close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
          <QrCode className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-[var(--text)]">{t('Session Check-in Pass')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">{session.className}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[var(--border)] flex flex-col items-center gap-2">
          {qrImageUrl && !imgFailed ? (
            <img
              src={qrImageUrl}
              alt="NEXUS Session QR"
              onError={() => setFailedQrUrl(qrImageUrl)}
              className="w-40 h-40 rounded-lg object-contain"
            />
          ) : (
            <QrCode className="w-36 h-36 text-slate-900" />
          )}
          <span className="font-mono text-[11px] font-bold text-slate-700 tracking-wide break-all text-center max-w-[210px]">
            {qrPayload || `NXS-${session.bookingId || session.classId || 'PASS'}`}
          </span>
        </div>

        <div className="w-full text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)] flex flex-col gap-1.5">
          {session.startTime && !session.isTurnstile && (
            <div className="flex justify-between gap-2">
              <span>{t('Session Date:')}</span>
              <span className="font-semibold text-[var(--text)] text-right">
                {formatDate(session.startTime)}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span>{t('Coach:')}</span>
            <span className="font-semibold text-[var(--text)] text-right">{session.coachName || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>{t('Location:')}</span>
            <span className="font-semibold text-[var(--text)] text-right">{session.roomName || '—'}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span>{t('Status:')}</span>
            <span className={statusBadgeClass}>{codeLabel(session.status)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] font-bold text-xs cursor-pointer"
        >
          {t('Done')}
        </button>
      </div>
    </div>
  );
};

export default MemberSessionQrModal;
