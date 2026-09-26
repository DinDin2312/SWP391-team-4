import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Dumbbell, Award, ArrowRight } from 'lucide-react';

const CoachDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-[#0b1326] to-[#0e172a] border border-[#1a2947] p-8 shadow-xl">
        <div className="relative z-10 flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold w-fit">
            <Award className="w-3.5 h-3.5" />
            <span>Nexus Certified Athletic Coach</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Coach Command Center</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to your teaching dashboard. Easily manage your upcoming group fitness sessions, inspect enrolled trainee rosters, and track class schedules.
          </p>
          <div className="pt-4 flex items-center gap-3">
            <button 
              onClick={() => navigate('/coach/schedule')} 
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              <span>View Teaching Schedule</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Assigned Classes</span>
            <span className="text-2xl font-bold text-white">Active</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Enrolled Trainees</span>
            <span className="text-2xl font-bold text-white">Synced</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Status</span>
            <span className="text-2xl font-bold text-white">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
