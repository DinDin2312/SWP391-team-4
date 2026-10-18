import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Dumbbell, Award, ArrowRight, Clock, MapPin } from 'lucide-react';
import { coachService } from '../services/coachService';

const CoachDashboard = () => {
  useLanguage();
  const navigate = useNavigate();

  const [classesCount, setClassesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachStats = async () => {
      try {
        setLoading(true);
        const [classesData, studentsData, schedulesData] = await Promise.all([
          coachService.getClasses(),
          coachService.getStudents(),
          coachService.getSchedules()
        ]);

        const classesList = Array.isArray(classesData) ? classesData : [];
        const studentsList = Array.isArray(studentsData) ? studentsData : [];
        const schedulesList = Array.isArray(schedulesData) ? schedulesData : [];

        setClassesCount(classesList.length);
        setStudentsCount(studentsList.length);

        const now = new Date();
        const upcoming = schedulesList
          .filter((s) => s.startTime && new Date(s.startTime) >= now && s.status !== 'CANCELLED')
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setUpcomingSessions(upcoming);
      } catch (err) {
        console.error('Failed to load coach dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchCoachStats();
    } else {
      setLoading(false);
    }
  }, []);

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
            <span className="text-2xl font-bold text-[var(--text)]">
              {loading ? '...' : `${classesCount} ${t("Active")}`}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--success-soft)] text-[var(--success-text)] flex items-center justify-center border border-[var(--success-soft)]">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Enrolled Trainees")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">
              {loading ? '...' : `${studentsCount} ${t("Synced")}`}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-text)] flex items-center justify-center border border-[var(--warning-soft)]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Upcoming Sessions")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">
              {loading ? '...' : `${upcomingSessions.length} ${t("Ready")}`}
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Teaching Sessions Preview */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text)]">{t("Next Teaching Sessions")}</h2>
          <button
            onClick={() => navigate('/coach/schedule')}
            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            <span>{t("Open Full Roster")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-[var(--text-muted)] py-4 text-center">{t("Loading...")}</div>
        ) : upcomingSessions.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)] py-4 text-center">{t("No upcoming sessions scheduled.")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSessions.slice(0, 3).map((session) => {
              const startObj = new Date(session.startTime);
              const dateLabel = startObj.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeLabel = startObj.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
              return (
                <div
                  key={session.scheduleId}
                  onClick={() => navigate('/coach/schedule')}
                  className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--primary-soft)] cursor-pointer transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--primary)] font-bold">
                    <span>{dateLabel}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeLabel}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text)] truncate">{session.className}</h4>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-1">
                    <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" />{session.roomName}</span>
                    <span className="font-semibold text-[var(--text)]">{session.enrolledCount ?? 0}/{session.maxCapacity ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;
