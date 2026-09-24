import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Dumbbell,
  HeartPulse,
  Bell,
  Settings,
  LogOut,
  QrCode,
  ShieldCheck,
  Calendar,
  Activity,
  Flame,
  Search,
  Download,
  ChevronRight,
  Radio,
  Clock,
  MapPin,
  User,
  Waves,
  ShoppingCart,
} from 'lucide-react';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { userInfo, logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy tên thật từ lúc đăng nhập
  const fullName = userInfo?.fullName || 'Active Member';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Dữ liệu mẫu lịch sắp tới
  const scheduleItems = [
    {
      id: 1,
      badge: 'TODAY',
      time: '17:30',
      title: 'HIIT Performance & Conditioning',
      status: 'Confirmed',
      trainer: 'Marcus Vance',
      location: 'Functional Lab 01',
      duration: '60 min',
      canCheckIn: true,
      canCancel: true,
    },
    {
      id: 2,
      badge: 'TOMORROW',
      time: '09:00',
      title: 'Smart Court Tennis Practice',
      status: 'Booked',
      trainer: 'Coach Sarah Lin',
      location: 'Smart Court 3',
      duration: '90 min',
      canReschedule: true,
      canCancel: true,
    },
    {
      id: 3,
      badge: 'OCT 02',
      time: '14:00',
      title: 'Advanced Recovery & Cryo Chamber',
      status: 'Scheduled',
      trainer: 'Dr. Elena Marks',
      location: 'Recovery Zone 4',
      duration: '45 min',
      canCancel: true,
    },
  ];

  // Dữ liệu bảng Recent Activity
  const activityLogs = [
    {
      id: 1,
      dateTime: 'Yesterday, 18:15 PM',
      activity: 'Open Gym Training & Free Weights',
      facility: 'Main Fitness Floor (Zone A)',
      trainer: 'Main Fitness Floor (Zone A)',
      type: 'gym',
      duration: '1h 15m',
      status: 'Completed',
      metric: '485 kcal',
      subMetric: 'Avg HR 142 bpm',
    },
    {
      id: 2,
      dateTime: 'Sep 28, 2025, 10:00 AM',
      activity: 'Smart Badminton Court 4',
      facility: 'Self-Practice Session',
      trainer: 'Self-Practice Session',
      type: 'court',
      duration: '1h 00m',
      status: 'Completed',
      metric: '390 kcal',
      subMetric: 'Avg HR 134 bpm',
    },
    {
      id: 3,
      dateTime: 'Sep 26, 2025, 07:30 AM',
      activity: 'Power Vinyasa Yoga',
      facility: 'Master Chloe Wei',
      trainer: 'Master Chloe Wei',
      type: 'yoga',
      duration: '50m',
      status: 'Attended',
      metric: 'Active Recovery',
      subMetric: 'Avg HR 108 bpm',
    },
    {
      id: 4,
      dateTime: 'Sep 24, 2025, 16:45 PM',
      activity: 'Hydrotherapy & Lap Pool',
      facility: 'Aquatic Zone B (Lane 2)',
      trainer: 'Aquatic Zone B (Lane 2)',
      type: 'pool',
      duration: '45m',
      status: 'Attended',
      metric: '18 Laps',
      subMetric: 'Recovery Routine',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-200 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 border-r border-[#15203b] bg-[#091124] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-white">NEXUS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">SPORTS LAB</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <button className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold text-sm transition-colors">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Dashboard</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            </button>

            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111d38] text-sm font-medium transition-colors">
              <CalendarDays className="w-4 h-4" />
              <span>My Schedule</span>
            </button>

            <button className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111d38] text-sm font-medium transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>Memberships</span>
              </div>
              <span className="text-[10px] font-bold bg-[#1a2b50] text-blue-300 px-1.5 py-0.5 rounded">PRO</span>
            </button>

            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111d38] text-sm font-medium transition-colors">
              <Dumbbell className="w-4 h-4" />
              <span>Book a Class</span>
            </button>

            <button className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111d38] text-sm font-medium transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#111d38] text-sm font-medium transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Member Profile Footer */}
        <div className="p-4 border-t border-[#15203b]">
          <div className="p-2.5 rounded-xl bg-[#0f1b33] border border-[#1b2b4f] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0f1b33]"></span>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">{fullName}</p>
                <p className="text-[10px] text-blue-400">Elite Pro Member</p>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-white transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 overflow-y-auto p-8 max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Customer Dashboard</h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Logged in as: Active Member
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Welcome back, {firstName}! System synced today at 16:42</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-400">Next Session:</span>
              <span className="font-semibold text-white">HIIT Endurance in 1h 45m</span>
            </div>

            <button className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all">
              <QrCode className="w-4 h-4" />
              <span>Check-in QR</span>
            </button>

            {/* Shopping Cart Button */}
            <button className="relative p-2.5 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors" title="View Cart">
              <ShoppingCart className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#060b17]">
                2
              </span>
            </button>

            <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors">
              Logout
            </button>
          </div>
        </header>

        {/* ================= ROW 1: 4 STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Package */}
          <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Package</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">Elite All–Access Pass</h3>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-white">
                  45 <span className="text-xs font-medium text-slate-400">days left</span>
                </span>
                <span className="text-xs font-bold text-blue-400">75% elapsed</span>
              </div>
              <div className="w-full h-1.5 bg-[#162544] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-3/4"></div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Renews Nov 15, 2025 · Auto-billing</span>
              </div>
            </div>
          </div>

          {/* Card 2: Classes Attended */}
          <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classes Attended</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Monthly Cycle</h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-white">
                  14 <span className="text-xs font-medium text-slate-400">Sessions</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-1">
                  <span>↗ +21% vs last month</span>
                </div>
              </div>
              {/* Mini Spark Bar Graph */}
              <div className="flex items-end gap-1 h-10 pb-1">
                <span className="w-1.5 bg-[#172544] rounded-t h-4"></span>
                <span className="w-1.5 bg-[#172544] rounded-t h-6"></span>
                <span className="w-1.5 bg-emerald-500/50 rounded-t h-5"></span>
                <span className="w-1.5 bg-emerald-500 rounded-t h-8"></span>
                <span className="w-1.5 bg-emerald-400 rounded-t h-10"></span>
              </div>
            </div>
          </div>

          {/* Card 3: Facility Allocation */}
          <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Facility Allocation</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Upcoming Bookings</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white">
                3 <span className="text-xs font-medium text-slate-400">Active Reserved</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Search className="w-3 h-3 text-blue-400" />
                <span className="truncate">Smart Court 2 & Cryo Zo...</span>
              </div>
            </div>
          </div>

          {/* Card 4: Bio Readiness */}
          <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bio Readiness</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Physical Index</h3>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-white">
                  94% <span className="text-xs font-medium text-slate-400">Peak Score</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1 font-semibold">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>6-day workout streak</span>
                </div>
              </div>
              {/* Circular Indicator */}
              <div className="w-11 h-11 rounded-full border-2 border-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-300 shadow-lg shadow-cyan-500/20">
                94
              </div>
            </div>
          </div>
        </div>

        {/* ================= ROW 2: SCHEDULE (2/3) + PASS & ACTIONS (1/3) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Schedule (2 Cột bên trái) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
            <div>
              {/* Tiêu đề & Bộ lọc Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Upcoming Schedule</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/40 text-blue-400 text-xs font-bold">
                    3 Active
                  </span>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#060e20] border border-[#172545] text-xs font-semibold">
                  {[
                    { key: 'all', label: 'All (3)' },
                    { key: 'group', label: 'Group Classes' },
                    { key: 'courts', label: 'Smart Courts' },
                    { key: 'recovery', label: 'Recovery' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách các buổi tập */}
              <div className="space-y-3">
                {scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#0e172a] border border-[#1a2947] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Box ngày giờ */}
                      <div className="px-3 py-2 rounded-lg bg-[#080e1c] border border-[#182645] text-center min-w-[70px]">
                        <span className="text-[10px] font-bold text-blue-400 tracking-wider block">{item.badge}</span>
                        <span className="text-base font-extrabold text-white leading-tight">{item.time}</span>
                      </div>

                      {/* Thông tin chi tiết */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            • {item.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.trainer}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.location}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thao tác nút bấm */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {item.canCheckIn && (
                        <button className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-colors">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Check-in</span>
                        </button>
                      )}
                      {item.canReschedule && (
                        <button className="px-3.5 py-1.5 rounded-lg bg-[#14203b] hover:bg-[#1a2b52] text-slate-200 text-xs font-medium border border-[#213560] transition-colors">
                          Reschedule
                        </button>
                      )}
                      {item.canCancel && (
                        <button className="px-3.5 py-1.5 rounded-lg bg-[#11192e] hover:bg-[#182440] text-slate-300 text-xs font-medium border border-[#1b2a4d] transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer đồng bộ Telemetry */}
            <div className="pt-4 mt-6 border-t border-[#172545] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Telemetry synchronization: Connected to Nexus Core
              </span>
              <a href="#calendar" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                View Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Pass & Express Actions (1 Cột bên phải) */}
          <div className="space-y-6">
            {/* NEXUS PASS Card */}
            <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-white uppercase tracking-wider">NEXUS PASS</span>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                  NFC READY
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>MEMBER ID</span>
                <span className="font-mono font-bold text-white tracking-widest">#NX-88204</span>
              </div>

              {/* Giả lập Barcode hiện đại */}
              <div className="p-3 rounded-xl bg-[#060c1a] border border-[#152342] flex items-center justify-center gap-1 my-3">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-8 rounded-sm bg-slate-300 ${
                      i % 3 === 0 ? 'w-1.5' : i % 2 === 0 ? 'w-1' : 'w-0.5 opacity-60'
                    }`}
                  ></span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Hold near turnstile optical scanner</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Simulate Tap
                </span>
              </div>
            </div>

            {/* Express Actions List */}
            <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545]">
              <h3 className="text-sm font-bold text-white mb-3">Express Actions</h3>
              <div className="space-y-2">
                {[
                  {
                    title: 'Book PT Session',
                    subtitle: 'Consult biomechanics coaches',
                    icon: User,
                  },
                  {
                    title: 'Reserve Smart Court',
                    subtitle: 'Tennis, Basketball & Padel',
                    icon: Search,
                  },
                  {
                    title: 'Biometric Telemetry',
                    subtitle: 'VO2 Max & recovery index',
                    icon: Activity,
                  },
                  {
                    title: 'Locker & Facility Access',
                    subtitle: 'Manage digital locker keys',
                    icon: Dumbbell,
                  },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      className="w-full p-3 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 flex items-center justify-between text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{action.title}</p>
                          <p className="text-[10px] text-slate-400">{action.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= ROW 3: RECENT ACTIVITY TABLE ================= */}
        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#172545]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity & Check–in Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified turnstile entries and biometric session outputs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search facility, date..."
                  className="bg-[#0e172a] border border-[#1a2947] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52 transition-colors"
                />
              </div>

              <button className="px-3.5 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#182645] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold">Activity / Facility</th>
                  <th className="pb-3 font-semibold">Trainer / Zone</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Telemetry Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131f3b]">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0e172a]/60 transition-colors">
                    <td className="py-4 font-semibold text-white">{log.dateTime}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          {log.type === 'gym' && <Dumbbell className="w-3.5 h-3.5" />}
                          {log.type === 'court' && <Search className="w-3.5 h-3.5" />}
                          {log.type === 'yoga' && <Activity className="w-3.5 h-3.5" />}
                          {log.type === 'pool' && <Waves className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium text-white">{log.activity}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-300">{log.trainer}</td>
                    <td className="py-4 text-slate-400">{log.duration}</td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          log.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="font-bold text-white">{log.metric}</div>
                      <div className="text-[10px] text-slate-400">{log.subMetric}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="pt-4 mt-2 border-t border-[#182645] flex items-center justify-between text-xs text-slate-400">
            <span>Showing 4 of 38 recorded sessions</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled
                className="w-7 h-7 rounded-lg bg-[#0e172a] border border-[#1a2947] flex items-center justify-center text-slate-600 cursor-not-allowed"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-600/30"
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className="w-7 h-7 rounded-lg bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 flex items-center justify-center transition-colors"
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className="w-7 h-7 rounded-lg bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 flex items-center justify-center transition-colors"
              >
                3
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 flex items-center justify-center transition-colors">
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
