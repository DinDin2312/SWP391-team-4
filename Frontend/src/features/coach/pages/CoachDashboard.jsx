import { t, useLanguage } from '../../../i18n/useLanguage';
import React from 'react';

import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Dumbbell, Award, ArrowRight } from 'lucide-react';


const CoachDashboard = () => {
  useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary-soft)] via-[var(--surface)] to-[var(--surface)] border border-[var(--border)] p-8 shadow-[var(--shadow)]">
        <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold w-fit">
            <Award className="w-3.5 h-3.5" />
            <span>{t("Nexus Certified Athletic Coach")}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">{t("Coach Command Center")}</h1>
          <p className="text-sm text-[var(--text)] leading-relaxed">{t("Welcome to your teaching dashboard. Easily manage your upcoming group fitness sessions, inspect enrolled trainee rosters, and track class schedules.")}</p>
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => navigate('/coach/schedule')}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm flex items-center gap-2 shadow-[var(--shadow)] transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{t("View Teaching Schedule")}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)]">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Assigned Classes")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{t("Active")}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--success-soft)] text-[var(--success-text)] flex items-center justify-center border border-[var(--success-soft)]">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Enrolled Trainees")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{t("Synced")}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-text)] flex items-center justify-center border border-[var(--warning-soft)]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Status")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{t("Ready")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
