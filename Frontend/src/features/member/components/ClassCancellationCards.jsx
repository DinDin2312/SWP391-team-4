import React from 'react';
import {
  CheckCircle2, Clock, Sparkles, CreditCard, Dumbbell, DollarSign, Check, Copy
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';

export const CancellationGuaranteeNotice = () => {
  useLanguage();
  return (
    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
      <p className="font-bold flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>{t('Terms & Guarantee:')}</span>
      </p>
      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
        <li>{t('100% of your course price will be credited as a 60-day voucher.')}</li>
        <li>{t('Use the voucher at checkout for any other class or gym membership.')}</li>
        <li>{t('All upcoming sessions will be released for other members.')}</li>
      </ul>
    </div>
  );
};

const BENEFIT_THEMES = {
  emerald: {
    selected: 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30',
    hover: 'hover:border-emerald-500/40',
    iconActive: 'bg-emerald-600 text-white',
    iconInactive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    subtext: 'text-emerald-600 dark:text-emerald-400',
    checkBg: 'bg-emerald-600'
  },
  blue: {
    selected: 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/15 ring-2 ring-blue-500/30',
    hover: 'hover:border-blue-500/40',
    iconActive: 'bg-blue-600 text-white',
    iconInactive: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    subtext: 'text-blue-600 dark:text-blue-400',
    checkBg: 'bg-blue-600'
  },
  purple: {
    selected: 'border-purple-600 bg-purple-500/10 dark:bg-purple-500/15 ring-2 ring-purple-500/30',
    hover: 'hover:border-purple-500/40',
    iconActive: 'bg-purple-600 text-white',
    iconInactive: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    subtext: 'text-purple-600 dark:text-purple-400',
    checkBg: 'bg-purple-600'
  }
};

const BenefitOptionCard = ({
  optionKey,
  selectedKey,
  onSelect,
  icon: Icon,
  title,
  badgeText,
  desc,
  subtext,
  themeKey = 'emerald'
}) => {
  const isSelected = selectedKey === optionKey;
  const theme = BENEFIT_THEMES[themeKey] || BENEFIT_THEMES.emerald;

  return (
    <button
      type="button"
      onClick={() => onSelect(optionKey)}
      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
        isSelected
          ? theme.selected
          : `border-[var(--border)] bg-[var(--surface-hover)] ${theme.hover}`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`p-2 rounded-lg mt-0.5 ${
              isSelected ? theme.iconActive : theme.iconInactive
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-[var(--text)]">
                {title}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.badge}`}>
                {badgeText}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
              {desc}
            </p>
            <div className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 ${theme.subtext}`}>
              <CheckCircle2 className="w-3 h-3" />
              <span>{subtext}</span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 ${theme.checkBg}`}>
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </button>
  );
};

export const ClassCancellationPreviewCard = ({
  preview,
  preferredResolution,
  onSelectResolution
}) => {
  useLanguage();
  if (!preview) return null;

  return (
    <div className="space-y-4">
      {/* Status Header Badge */}
      <div
        className={`p-4 rounded-xl border ${
          !preview.hasStarted
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2.5 font-bold text-sm mb-1">
          {!preview.hasStarted ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('Class Has Not Started Yet - 100% Credit Eligible')}</span>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t('Class In Progress - Reception Support Required')}</span>
            </>
          )}
        </div>
        <p className="text-xs leading-relaxed opacity-90">
          {preview.policyNotice}
        </p>
      </div>

      {/* Course Progress & Pricing Breakdown */}
      <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">{t('Course Name')}:</span>
          <span className="font-bold text-[var(--text)]">{preview.className}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">{t('Course Tuition')}:</span>
          <span className="font-bold text-[var(--text)]">{formatMoney(preview.classPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">{t('Session Progress')}:</span>
          <span className="font-medium text-[var(--text)]">
            {preview.attendedSessions} / {preview.totalSessions} {t('sessions taken')} ({preview.remainingSessions} {t('remaining')})
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{
              width: `${
                preview.totalSessions > 0
                  ? (preview.attendedSessions / preview.totalSessions) * 100
                  : 0
              }%`
            }}
          />
        </div>

        {preview.hasStarted && (
          <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {t('Estimated Prorated Credit Value:')}
            </span>
            <span className="text-base font-extrabold text-[var(--primary)]">
              {formatMoney(preview.proratedCredit)}
            </span>
          </div>
        )}
      </div>

      {/* Member Compensation Benefit Selection */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-extrabold text-[var(--text)] uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{t('Select Desired Compensation Benefit')}</span>
          </label>
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            {t('Choose how you would like to be compensated if this class is cancelled.')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <BenefitOptionCard
            optionKey="ISSUE_CREDIT"
            selectedKey={preferredResolution}
            onSelect={onSelectResolution}
            icon={CreditCard}
            title={t('Course Credit Voucher (Recommended)')}
            badgeText={
              !preview.hasStarted
                ? `100% ${t('Tuition Value')}`
                : formatMoney(preview.proratedCredit)
            }
            desc={t('100% or prorated value credited for 60 days to book any other class or gym package.')}
            subtext={
              !preview.hasStarted
                ? t('Auto-issued instantly (1-click)')
                : t('Quick reception review')
            }
            themeKey="emerald"
          />

          <BenefitOptionCard
            optionKey="GYM_PASS"
            selectedKey={preferredResolution}
            onSelect={onSelectResolution}
            icon={Dumbbell}
            title={t('Free 1-Month Gym Pass')}
            badgeText={`1 ${t('Month')} VIP`}
            desc={t('Exchange remaining sessions for 1 full month of unlimited gym & fitness access.')}
            subtext={t('Instant activation upon review')}
            themeKey="blue"
          />

          <BenefitOptionCard
            optionKey="CASH_REFUND"
            selectedKey={preferredResolution}
            onSelect={onSelectResolution}
            icon={DollarSign}
            title={t('Cash / Bank Refund Request')}
            badgeText={
              !preview.hasStarted
                ? formatMoney(preview.classPrice)
                : formatMoney(preview.proratedCredit)
            }
            desc={t('Request remaining class tuition refunded via bank transfer or cash at counter.')}
            subtext={t('Requires Center Manager approval')}
            themeKey="purple"
          />
        </div>
      </div>
    </div>
  );
};

export const ClassCancellationSuccessCard = ({
  result,
  onClose,
  onViewDetails,
  viewDetailsText,
  copiedCode,
  onCopyCode
}) => {
  useLanguage();
  if (!result) return null;

  return (
    <div className="py-4 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      {result.type === 'DIRECT_CANCEL_SUCCESS' ? (
        <>
          <h3 className="text-xl font-bold text-[var(--text)]">
            {t('Class Cancelled & 100% Credit Granted!')}
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {t('Because this class has not started yet, 100% of your course fee has been converted into a Course Credit Voucher valid for 60 days.')}
          </p>

          <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-w-sm mx-auto text-left space-y-2">
            <div className="text-xs text-[var(--text-muted)] font-medium">
              {t('Credit Voucher Code')}
            </div>
            <div className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
              <code className="text-base font-bold text-[var(--primary)] tracking-wider">
                {result.creditCode}
              </code>
              <button
                type="button"
                onClick={() => onCopyCode(result.creditCode)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? t('Copied') : t('Copy')}
              </button>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-[var(--text-muted)]">{t('Amount:')}</span>
              <span className="font-bold text-[var(--text)]">
                {formatMoney(result.creditAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">{t('Valid Until:')}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {result.expiryDate} (60 {t('days')})
              </span>
            </div>
            {result.requestId && (
              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)]">{t('Ticket ID')}:</span>
                <span className="font-bold text-[var(--text)]">
                  #{result.requestId} &bull;{' '}
                  <span className="text-emerald-600 font-bold">
                    {t('Approved & Resolved')}
                  </span>
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold text-[var(--text)]">
            {t('Support Ticket Submitted!')}
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {result.message}
          </p>
          {result.preferredLabel && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20">
              <span>{t('Requested Benefit')}:</span>
              <span>{result.preferredLabel}</span>
            </div>
          )}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
            {t('Ticket ID')}: #{result.requestId} &bull;{' '}
            {t('You will receive a notification once Reception reviews and resolves your ticket.')}
          </div>
        </>
      )}

      <div className="pt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
        >
          {t('Close')}
        </button>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {viewDetailsText || t('View My Credits & Tickets')}
          </button>
        )}
      </div>
    </div>
  );
};
