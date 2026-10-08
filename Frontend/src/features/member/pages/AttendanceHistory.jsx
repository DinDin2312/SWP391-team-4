import { t, useLanguage } from '../../../i18n/useLanguage';
import React from "react";
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Activity, Filter } from "lucide-react";
import { useAttendanceHistory } from "../hooks/useAttendanceHistory";
import { TracingBeam } from "../../../components/ui/tracing-beam";

// Extracted UI Component for Badges (React Modernization pattern)
const StatusBadge = ({ status }) => {
  useLanguage();
  if (status === "PRESENT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
        <CheckCircle className="w-3.5 h-3.5" />{t("Present")}</span>
    );
  }
  if (status === "ABSENT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider">
        <XCircle className="w-3.5 h-3.5" />{t("Absent")}</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-[var(--text-muted)] border border-slate-500/20 text-xs font-semibold uppercase tracking-wider">
      <Clock className="w-3.5 h-3.5" />{t("Not Yet")}</span>
  );
};

const AttendanceHistory = () => {
  useLanguage();
  // Logic extracted to custom hook (Frontend Developer pattern)
  const { loading, filterStatus, setFilterStatus, stats, filteredBookings } = useAttendanceHistory();

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">{t("Loading history...")}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TracingBeam className="px-2 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />{t("Attendance History")}</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">{t("Your attendance history and participation rate.")}</p>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterStatus("ALL")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${filterStatus === "ALL" ? "border-blue-500 shadow-blue-500/20" : "border-blue-500/20 hover:border-blue-500/50"}`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">{t("Attendance Rate")}</p>
            <p className="text-2xl font-bold text-[var(--text)]">{stats.attendanceRate}%</p>
          </div>
        </div>
        
        <div 
          onClick={() => setFilterStatus("PRESENT")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${filterStatus === "PRESENT" ? "border-emerald-500 shadow-emerald-500/20" : "border-emerald-500/20 hover:border-emerald-500/50"}`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">{t("Present Sessions")}</p>
            <p className="text-2xl font-bold text-[var(--text)]">{stats.presentCount}</p>
          </div>
        </div>
        
        <div 
          onClick={() => setFilterStatus("ABSENT")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${filterStatus === "ABSENT" ? "border-rose-500 shadow-rose-500/20" : "border-rose-500/20 hover:border-rose-500/50"}`}
        >
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">{t("Absent Sessions")}</p>
            <p className="text-2xl font-bold text-[var(--text)]">{stats.absentCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text)]">{t("Session Details")}</h2>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">{t("No attendance records found matching your filter.")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t("Date & Time")}</th>
                  <th className="p-4 font-semibold">{t("Course")}</th>
                  <th className="p-4 font-semibold">{t("Info")}</th>
                  <th className="p-4 font-semibold text-right">{t("Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredBookings.map((booking) => {
                  const date = new Date(booking.startTime);
                  const endTime = new Date(booking.endTime);
                  return (
                    <tr key={booking.bookingId} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex flex-col items-center justify-center border border-[var(--border)]">
                            <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold leading-none">{date.toLocaleString("en-US", { month: "short" })}</span>
                            <span className="text-sm text-[var(--text)] font-bold leading-none mt-0.5">{date.getDate()}</span>
                          </div>
                          <div>
                            <p className="text-[var(--text)] font-medium">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {date.getFullYear()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-[var(--text)] font-semibold">{booking.className}</p>
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{t("Class ID: #")}{booking.bookingId}</span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <p className="text-[var(--text)] text-sm flex items-center gap-2"><User className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {booking.coachName}</p>
                          <p className="text-[var(--text-muted)] text-xs flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {booking.roomName}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <StatusBadge status={booking.attendanceStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </TracingBeam>
    </div>
  );
};

export default AttendanceHistory;
