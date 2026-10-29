import React, { useState } from 'react';
import { Sparkles, Crown, ShieldCheck, Check } from 'lucide-react';
import { t } from '../i18n/useLanguage';

const TIER_RING_CONFIG = {
  PLATINUM: {
    key: 'PLATINUM',
    name: 'Platinum VIP',
    badgeLabel: 'PRO',
    ringClass: 'avatar-ring-platinum',
    glowClass: 'bg-gradient-to-tr from-[#1A73E8] via-[#8E24AA] to-[#FF4081]',
    badgeBg: 'bg-gradient-to-tr from-[#1A73E8] via-[#8E24AA] to-[#FF4081] text-white shadow-[0_2px_8px_rgba(142,36,170,0.45)] border-white dark:border-slate-900',
    badgeIcon: Sparkles,
    avatarBg: 'bg-gradient-to-tr from-[#0d1e3d] to-[#1e1b4b] text-cyan-200',
    title: 'NEXUS Pro • Platinum VIP'
  },
  GOLD: {
    key: 'GOLD',
    name: 'Gold Elite',
    badgeLabel: 'GOLD',
    ringClass: 'avatar-ring-gold',
    glowClass: 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600',
    badgeBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-[0_2px_8px_rgba(245,158,11,0.4)] border-white dark:border-slate-900',
    badgeIcon: Crown,
    avatarBg: 'bg-gradient-to-tr from-[#2b1803] to-[#451a03] text-amber-200',
    title: 'Gold Elite Member'
  },
  SILVER: {
    key: 'SILVER',
    name: 'Silver Member',
    badgeLabel: 'SLV',
    ringClass: 'avatar-ring-silver',
    glowClass: 'bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-300',
    badgeBg: 'bg-gradient-to-tr from-slate-600 to-slate-400 text-white shadow-[0_2px_6px_rgba(148,163,184,0.3)] border-white dark:border-slate-900',
    badgeIcon: ShieldCheck,
    avatarBg: 'bg-gradient-to-tr from-[#1e293b] to-[#334155] text-slate-100',
    title: 'Silver Member'
  },
  MEMBER: {
    key: 'MEMBER',
    name: 'Standard Member',
    badgeLabel: 'STD',
    ringClass: 'avatar-ring-member',
    glowClass: 'bg-gradient-to-tr from-blue-400 to-blue-600',
    badgeBg: 'bg-emerald-500 text-white border-white dark:border-slate-900 shadow-xs',
    badgeIcon: Check,
    avatarBg: 'bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-blue-200',
    title: 'Standard Member'
  }
};

const SIZES = {
  xs: {
    container: 'w-8 h-8',
    ringPadding: 'p-[2px]',
    gapPadding: 'p-[1.5px]',
    text: 'text-[10px]',
    badge: 'w-3 h-3 -bottom-0.5 -right-0.5 border',
    iconSize: 'w-2 h-2 stroke-[2.5]',
    pillText: 'text-[7px]'
  },
  sm: {
    container: 'w-10 h-10',
    ringPadding: 'p-[2px]',
    gapPadding: 'p-[1.5px]',
    text: 'text-xs',
    badge: 'w-4 h-4 -bottom-0.5 -right-0.5 border-[1.5px]',
    iconSize: 'w-2.5 h-2.5 stroke-[2.5]',
    pillText: 'text-[8px]'
  },
  md: {
    container: 'w-12 h-12',
    ringPadding: 'p-[2.5px]',
    gapPadding: 'p-[2px]',
    text: 'text-sm',
    badge: 'w-5 h-5 -bottom-0.5 -right-0.5 border-2',
    iconSize: 'w-3 h-3 stroke-[2.5]',
    pillText: 'text-[9px]'
  },
  lg: {
    container: 'w-16 h-16',
    ringPadding: 'p-[3px]',
    gapPadding: 'p-[2.5px]',
    text: 'text-lg',
    badge: 'w-6 h-6 -bottom-0.5 -right-0.5 border-2',
    iconSize: 'w-3.5 h-3.5 stroke-[2.5]',
    pillText: 'text-[10px]'
  },
  xl: {
    container: 'w-24 h-24 sm:w-28 sm:h-28',
    ringPadding: 'p-[3.5px]',
    gapPadding: 'p-[3px]',
    text: 'text-2xl sm:text-3xl',
    badge: 'w-7 h-7 sm:w-8 sm:h-8 -bottom-1 -right-1 border-2 shadow-md',
    iconSize: 'w-4 h-4 stroke-[2.5]',
    pillText: 'text-xs'
  }
};

/**
 * MemberTierAvatar: Google Pro / Gemini-style avatar ring customized by membership tier
 */
export default function MemberTierAvatar({
  avatarUrl,
  fullName = 'Member',
  memberTier = 'MEMBER',
  size = 'md',
  showBadge = true,
  className = '',
  onClick,
  children
}) {
  const [imgError, setImgError] = useState(false);
  const normalizedTier = (memberTier || 'MEMBER').toUpperCase();
  const config = TIER_RING_CONFIG[normalizedTier] || TIER_RING_CONFIG.MEMBER;
  const sizeConfig = SIZES[size] || SIZES.md;

  const initials = fullName
    ? fullName
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NX';

  const fullAvatarUrl = avatarUrl
    ? avatarUrl.startsWith('http')
      ? avatarUrl
      : `http://localhost:8080${avatarUrl}`
    : null;

  const BadgeIcon = config.badgeIcon;
  const isPro = normalizedTier === 'PLATINUM';

  return (
    <div
      onClick={onClick}
      title={t(config.title)}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeConfig.container} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* Google Pro Ambient Aura Glow (subtle breathing effect for Platinum and Gold) */}
      {(isPro || normalizedTier === 'GOLD') && (
        <span
          className={`absolute -inset-0.5 rounded-full ${config.glowClass} opacity-40 blur-[3px] animate-pulse-subtle pointer-events-none`}
        />
      )}

      {/* Outer Google Pro Tier Ring */}
      <div
        className={`relative w-full h-full rounded-full ${sizeConfig.ringPadding} ${config.ringClass} shadow-sm overflow-hidden flex items-center justify-center`}
      >
        {/* Platinum Slow Smooth Conic Rotation */}
        {isPro && (
          <div className="absolute inset-0 avatar-ring-platinum animate-spin-slow rounded-full pointer-events-none" />
        )}

        {/* Inner Gap (Apple / Google White & Dark Surface Boundary) */}
        <div
          className={`relative z-10 w-full h-full rounded-full ${sizeConfig.gapPadding} bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden`}
        >
          {/* Real Avatar Photo */}
          {fullAvatarUrl && !imgError ? (
            <img
              src={fullAvatarUrl}
              alt={fullName}
              className="w-full h-full object-cover rounded-full"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Fallback Initials with Tier Palette */
            <div
              className={`w-full h-full rounded-full flex items-center justify-center font-bold tracking-wider font-mono ${sizeConfig.text} ${config.avatarBg}`}
            >
              {initials}
            </div>
          )}

          {/* Optional Overlay Child Content (e.g. upload spinner or camera overlay) */}
          {children}
        </div>
      </div>

      {/* Floating Tier Status Badge in Corner */}
      {showBadge && (
        <div
          className={`absolute z-20 rounded-full flex items-center justify-center shrink-0 ${sizeConfig.badge} ${config.badgeBg}`}
        >
          <BadgeIcon className={sizeConfig.iconSize} />
        </div>
      )}
    </div>
  );
}
