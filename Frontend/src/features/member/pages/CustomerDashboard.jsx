import { ConfirmModal } from '../../../components/ui/confirm-modal';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import {
  Dumbbell,
  QrCode,
  ShieldCheck,
  Calendar,
  Activity,
  Flame,
  Search,
  Download,
  ChevronRight, ChevronLeft,
  Radio,
  Clock,
  MapPin,
  User, TrendingUp,
} from 'lucide-react';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, classId: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

// Status for Membership Card
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

// Status for Upcoming Schedule
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [memberTier, setMemberTier] = useState('MEMBER');
  const [recentActivities, setRecentActivities] = useState([]);

// Fetch membership card and schedule data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
// Call 2 APIs in parallel for speed
        const [membershipRes, bookingsRes, checkInsRes, recentRes, profileRes] = await Promise.all([
          axios.get('http://localhost:8080/api/v1/member/my-membership', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/upcoming-bookings', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/total-checkins', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/recent-activities', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setMembership(membershipRes.data);
        setUpcomingBookings(bookingsRes.data);
        setTotalCheckIns(checkInsRes.data);
        if (profileRes.data) {
          setLoyaltyPoints(profileRes.data.loyaltyPoints);
          setMemberTier(profileRes.data.memberTier);
        }
        setRecentActivities(recentRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingMembership(false);
        setLoadingBookings(false);
      }
    };
    
    if (localStorage.getItem('token')) {
      fetchData();
    } else {
      setLoadingMembership(false);
      setLoadingBookings(false);
    }
  }, []);

// Get full name from login session
  
  const getMemberId = (email) => {
    if (!email) return '88204';
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString().substring(0, 5);
  };
  const dynamicMemberId = getMemberId(userInfo?.email);
  return (
    <div className="space-y-6">
      

        {/* ================= ROW 1: 4 STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Package */}
          <div className="p-5 rounded-3xl bg-[#0b1326]/80 backdrop-blur-md border border-[#172545] relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Package</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              {loadingMembership ? (
                <h3 className="text-lg font-bold text-slate-500 leading-snug animate-pulse">Loading...</h3>
              ) : membership ? (
                <h3 className="text-lg font-bold text-white leading-snug">{membership.packageName}</h3>
              ) : (
                <h3 className="text-lg font-bold text-red-400 leading-snug">No Active Package</h3>
              )}
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-white">
                  {membership ? membership.remainingDays : 0} <span className="text-xs font-medium text-slate-400">days left</span>
                </span>
                <span className={`text-xs font-bold ${membership && membership.remainingDays > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {membership ? membership.status : 'N/A'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#162544] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: membership ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Valid till: {membership?.endDate || 'Unknown'}</span>
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
                  {totalCheckIns} <span className="text-xs font-medium text-slate-400">Sessions</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-1">
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +21% vs last month</span>
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

          {/* Card 3: Upcoming Bookings (Dynamic) */}
          <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Upcoming Classes</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white">
                {upcomingBookings.length} <span className="text-xs font-medium text-slate-400">Reserved</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Search className="w-3 h-3 text-blue-400" />
                <span className="truncate">Check schedule below</span>
              </div>
            </div>
          </div>

          {/* Card 4: Nexus Rewards */}
            <div className="p-5 rounded-2xl bg-[#0b1326] border border-[#172545] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Loyalty Program</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">Nexus Rewards</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-white">
                    {loyaltyPoints} <span className="text-xs font-medium text-slate-400">Pts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1 font-semibold">
                    <span>{memberTier === 'PLATINUM' ? '15% Off all purchases' : memberTier === 'GOLD' ? '10% Off all purchases' : memberTier === 'SILVER' ? '5% Off all purchases' : 'Reach 500 Pts for 5% Off'}</span>
                  </div>
                </div>
                {/* Circular Indicator */}
                <div className="w-11 h-11 rounded-full border-2 border-amber-500/30 flex items-center justify-center font-bold text-[10px] text-amber-400 shadow-lg shadow-amber-500/10">
                  {memberTier === 'PLATINUM' ? 'PLAT' : memberTier === 'MEMBER' ? 'NEW' : memberTier}
                </div>
              </div>
            </div>
          </div>

        {/* ================= ROW 2: SCHEDULE (2/3) + PASS & ACTIONS (1/3) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Schedule (Left 2 Columns) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0b1326]/80 backdrop-blur-md border border-[#172545] flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
            <div>
              {/* Header & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Upcoming Schedule</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/40 text-blue-400 text-xs font-bold">{upcomingBookings.length} Active</span>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#060e20] border border-[#172545] text-xs font-semibold">
                  {[
                    { key: 'all', label: `All (${upcomingBookings.length})` },
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

                {/* List of training sessions */}
              <div className="space-y-3">
                {loadingBookings ? (
    <div className="text-slate-400 text-sm py-4 text-center animate-pulse">Loading upcoming classes...</div>
  ) : upcomingBookings.length === 0 ? (
    <div className="text-slate-400 text-sm py-4 text-center">No upcoming classes scheduled.</div>
  ) : (
    upcomingBookings.filter(item => {
      if (activeTab === 'all') return true;
      const name = item.className.toLowerCase();
      if (activeTab === 'group') return name.includes('yoga') || name.includes('gym') || name.includes('cÄ‚â€ Ă‚Â¡');
      if (activeTab === 'courts') return name.includes('court') || name.includes('sĂ„â€Ă‚Â¢n');
      if (activeTab === 'recovery') return name.includes('recovery') || name.includes('hÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“i phÄ‚Â¡Ă‚Â»Ă‚Â¥c');
      return true;
    }).map((item) => {
      const dateObj = new Date(item.startTime);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const badge = isToday ? "TODAY" : dateObj.toLocaleDateString("en-GB", { month: "short", day: "2-digit" }).toUpperCase();
      const time = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      
      return (
        <div
          key={item.bookingId}
          className="p-4 rounded-xl bg-[#0e172a] border border-[#1a2947] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-start sm:items-center gap-4">
                    {/* Date & Time Box */}
            <div className="px-3 py-2 rounded-lg bg-[#080e1c] border border-[#182645] text-center min-w-[70px]">
              <span className="text-[10px] font-bold text-blue-400 tracking-wider block">{badge}</span>
              <span className="text-base font-extrabold text-white leading-tight">{time}</span>
            </div>

                    {/* Session Details */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{item.className}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  &bull; {item.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.coachName}</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.roomName}</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.durationMinutes} min</span>
                </div>
              </div>
            </div>
          </div>

                    {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors">
              <QrCode className="w-3.5 h-3.5" />
              Check-in
            </button>
            <button onClick={() => setCancelModal({ isOpen: true, classId: item.classId })} className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"> Cancel </button>
          </div>
        </div>
      );
    })
  )}
              </div>
            </div>

            {/* Footer - Telemetry Sync */}
            <div className="pt-4 mt-6 border-t border-[#172545] flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Telemetry synchronization: Connected to Nexus Core
              </span>
              <a href="/member/schedule" onClick={(e) => { e.preventDefault(); navigate('/member/schedule'); }} className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                View Full Calendar <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

            {/* Right Column: Pass & Express Actions */}
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
                <span className="font-mono font-bold text-white tracking-widest">#NX-{dynamicMemberId}</span>
              </div>

                {/* Simulated Modern Barcode */}
                {/* QR Code section */}
              <div className="p-4 rounded-xl bg-white flex items-center justify-center my-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=NEXUS-${dynamicMemberId}-${userInfo?.email}`} 
                  alt="Nexus Pass QR" 
                  className="w-full max-w-[120px] rounded-lg"
                />
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
                  { title: "Book PT Session", subtitle: "Consult biomechanics coaches", icon: User, TrendingUp, onClick: () => alert("System is matching you with an available trainer...") },
                  { title: "Reserve Smart Court", subtitle: "Tennis, Basketball & Padel", icon: Search, onClick: () => alert("Loading Smart Court layout...") },
                  { title: "Biometric Telemetry", subtitle: "VO2 Max & recovery index", icon: Activity, onClick: () => alert("Syncing data with your Apple Watch/Garmin...") },
                  { title: "Locker & Facility Access", subtitle: "Manage digital locker keys", icon: Dumbbell, onClick: () => alert("Connecting NFC to unlock locker #42...") },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className="w-full p-3 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-blue-500 hover:bg-[#111d38] flex items-center justify-between text-left group transition-all"
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
              <h3 className="text-lg font-bold text-white">Recent Activity & Check-in Log</h3>
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
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">
                        No recent activities found. Start booking classes to see your logs!
                      </td>
                    </tr>
                  ) : (
                    recentActivities.slice((currentPage - 1) * 3, currentPage * 3).map((log) => {
                      const dateObj = new Date(log.startTime);
                      const isYesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === dateObj.toDateString();
                      const dateStr = isYesterday ? 'Yesterday' : dateObj.toLocaleDateString('en-GB', { month: 'short', day: '2-digit', year: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                      
                      return (
                        <tr key={log.bookingId} className="hover:bg-[#0e172a]/60 transition-colors">
                          <td className="py-4 font-semibold text-white">{dateStr}, {timeStr}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-medium text-white">{log.className}</span>
                            </div>
                          </td>
                          <td className="py-4 text-slate-300">{log.coachName}</td>
                          <td className="py-4 text-slate-300">{log.durationMinutes}m</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {log.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="font-bold text-white">{log.calories} kcal</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Avg HR {log.avgHr} bpm</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
          </div>

          {/* Table Pagination */}
          <div className="pt-4 mt-2 border-t border-[#182645] flex items-center justify-between text-xs text-slate-400">
            <span>Showing {recentActivities.slice((currentPage - 1) * 3, currentPage * 3).length} of {recentActivities.length} recorded sessions</span>
            <div className="flex items-center gap-1.5">
              <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === 1 ? 'bg-[#0e172a] border border-[#1a2947] text-slate-600 cursor-not-allowed' : 'bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300'}`}
                ><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.ceil(recentActivities.length / 3) || 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-colors ${currentPage === idx + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentActivities.length / 3) || 1))}
                  disabled={currentPage === (Math.ceil(recentActivities.length / 3) || 1)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === (Math.ceil(recentActivities.length / 3) || 1) ? 'bg-[#0e172a] border border-[#1a2947] text-slate-600 cursor-not-allowed' : 'bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300'}`}
                ><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      
      <ConfirmModal 
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, classId: null })}
        onConfirm={() => {
          axios.post('http://localhost:8080/api/v1/member/cancel-class/' + cancelModal.classId, {}, {
            headers: { Authorization: "Bearer " + localStorage.getItem('token') }
          }).then(() => {
            window.location.reload();
          }).catch(err => alert(err.response?.data || 'Failed to cancel class'));
        }}
        title="Cancel Class Registration"
        message="Are you sure you want to cancel this class? All future sessions of this class will be dropped from your schedule. This action cannot be undone."
        confirmText="Yes, Cancel Class"
      />
    </div>
  );
};

export default CustomerDashboard;





