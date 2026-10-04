import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Activity } from "lucide-react";

const AttendanceHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/v1/member/calendar-bookings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setBookings(sorted);
    } catch (err) {
      setError("Failed to fetch attendance history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "PRESENT") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider"><CheckCircle className="w-3.5 h-3.5" /> Present</span>;
    if (status === "ABSENT") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider"><XCircle className="w-3.5 h-3.5" /> Absent</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-semibold uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Not Yet</span>;
  };

  const presentCount = bookings.filter(b => b.attendanceStatus === "PRESENT").length;
  const absentCount = bookings.filter(b => b.attendanceStatus === "ABSENT").length;
  const totalCompleted = presentCount + absentCount;
  const attendanceRate = totalCompleted > 0 ? Math.round((presentCount / totalCompleted) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading history...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Attendance History
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your attendance history and participation rate.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111d38]/40 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-bold text-white">{attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-[#111d38]/40 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Present Sessions</p>
            <p className="text-2xl font-bold text-white">{presentCount}</p>
          </div>
        </div>
        <div className="bg-[#111d38]/40 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Absent Sessions</p>
            <p className="text-2xl font-bold text-white">{absentCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111d38] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white">Session Details</h2>
        </div>
        
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f1b33] border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Course</th>
                  <th className="p-4 font-semibold">Info</th>
                  <th className="p-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {bookings.map((booking) => {
                  const date = new Date(booking.startTime);
                  const endTime = new Date(booking.endTime);
                  return (
                    <tr key={booking.bookingId} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex flex-col items-center justify-center border border-slate-700">
                            <span className="text-[10px] uppercase text-slate-400 font-bold leading-none">{date.toLocaleString("en-US", { month: "short" })}</span>
                            <span className="text-sm text-white font-bold leading-none mt-0.5">{date.getDate()}</span>
                          </div>
                          <div>
                            <p className="text-slate-300 font-medium">{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {date.getFullYear()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-semibold">{booking.className}</p>
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Class ID: #{booking.bookingId}</span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <p className="text-slate-300 text-sm flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-500" /> {booking.coachName}</p>
                          <p className="text-slate-400 text-xs flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {booking.roomName}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {getStatusBadge(booking.attendanceStatus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
