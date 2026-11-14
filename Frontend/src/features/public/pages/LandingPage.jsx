import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Activity, Shield, Sparkles, ChevronRight, Play, Star, MapPin, 
  CheckCircle2, User, X, Menu, Clock, Phone, Mail, ChevronDown, Waves, 
  Flame, Compass, HelpCircle, Search, Calendar, Repeat, Users, BookOpen, ArrowLeft, ArrowRight,
  Sunrise, Sun, Sunset, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../../services/axiosClient';
import { AuroraBackground } from '../../../components/ui/aurora-background';
import { TypewriterEffectSmooth } from '../../../components/ui/typewriter-effect';
import ShinyText from '../../../components/ui/ShinyText';
import { InfiniteMovingCards } from '../../../components/ui/infinite-moving-cards';
import { splitCode, classLevelFromCode } from '../../manager/components/classSearch';
import { resourceImageUrl } from '../../../components/resource-images/resourceImages';

const GUEST_COURSES_PER_PAGE = 6;

const LandingPage = () => {
  const language = useLanguage();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [packageCategory, setPackageCategory] = useState('ALL');
  
  const [packages, setPackages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classSearch, setClassSearch] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [dayMatchMode, setDayMatchMode] = useState('ANY');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [classPage, setClassPage] = useState(1);

  const toggleDay = (dayId) => {
    setClassPage(1);
    if (dayId === 'ALL') {
      setSelectedDays([]);
      return;
    }
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleTimeSlot = (slotId) => {
    setClassPage(1);
    if (slotId === 'ALL') {
      setSelectedTimeSlots([]);
      return;
    }
    setSelectedTimeSlots((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  };

  const resetClassFilters = () => {
    setClassSearch('');
    setSelectedDays([]);
    setDayMatchMode('ANY');
    setSelectedTimeSlots([]);
    setSelectedDate('ALL');
    setClassPage(1);
  };

  const isClassFiltered = Boolean(
    classSearch.trim() ||
    selectedDays.length > 0 ||
    selectedTimeSlots.length > 0 ||
    selectedDate !== 'ALL'
  );

  const isVi = language === 'vi';
  const tr = (vi, en) => (isVi ? vi : en);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fetch real data from backend via standardized axiosClient
    axiosClient.get('/guest/packages')
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setPackages(list.length > 0 ? list : defaultPackages);
          setLoadingPackages(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load packages from backend, using curated showcase packages', err);
        if (isMounted) {
          setPackages(defaultPackages);
          setLoadingPackages(false);
        }
      });

    axiosClient.get('/guest/classes')
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setClasses(list.length > 0 ? list : getDefaultClasses());
          setLoadingClasses(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load classes from backend, using curated showcase classes', err);
        if (isMounted) {
          setClasses(getDefaultClasses());
          setLoadingClasses(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectSummaries = useMemo(() => {
    const map = new Map();
    classes.forEach((c) => {
      const name = getCourseSubject(c);
      const desc = getCourseDescription(c);
      const price = Number(c.price) || 0;
      const uploadedImg = Boolean(resourceImageUrl(c.imagePath));

      if (!map.has(name)) {
        map.set(name, {
          name,
          description: desc,
          count: 0,
          courses: [],
          coachesSet: new Set(),
          roomsSet: new Set(),
          minPrice: price,
          coverUrl: getCourseCoverUrl(c),
          hasCustomCover: uploadedImg,
        });
      }

      const entry = map.get(name);
      entry.count += 1;
      entry.courses.push(c);
      if (!entry.description && desc) entry.description = desc;
      if (!entry.hasCustomCover && uploadedImg) {
        entry.coverUrl = getCourseCoverUrl(c);
        entry.hasCustomCover = true;
      }
      if (c.coachName) entry.coachesSet.add(c.coachName);
      if (c.roomName) entry.roomsSet.add(c.roomName);
      if (price > 0 && (entry.minPrice === 0 || price < entry.minPrice)) {
        entry.minPrice = price;
      }
    });

    return [...map.values()]
      .map((entry) => ({
        name: entry.name,
        description: entry.description,
        count: entry.count,
        courses: entry.courses,
        coaches: [...entry.coachesSet],
        rooms: [...entry.roomsSet],
        minPrice: entry.minPrice,
        coverUrl: entry.coverUrl,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const filteredSubjectSummaries = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return subjectSummaries;
    return subjectSummaries.filter((subj) => {
      return (
        subj.name.toLowerCase().includes(q) ||
        (subj.description && subj.description.toLowerCase().includes(q)) ||
        subj.coaches.some((coach) => coach.toLowerCase().includes(q)) ||
        subj.rooms.some((room) => room.toLowerCase().includes(q)) ||
        subj.courses.some((c) => (c.className || '').toLowerCase().includes(q))
      );
    });
  }, [subjectSummaries, classSearch]);

  const availableDates = useMemo(() => {
    const relevantCourses = classes.filter((c) => {
      const matchesSubject = selectedSubject === 'ALL' || !selectedSubject || getCourseSubject(c) === selectedSubject;
      const matchesDay = checkCourseMatchesDays(c, selectedDays, dayMatchMode);
      const matchesTime = selectedTimeSlots.length === 0 || selectedTimeSlots.some((slotId) => checkMatchesTimeSlot(c, slotId));
      return matchesSubject && matchesDay && matchesTime;
    });

    return [...new Set(
      relevantCourses
        .filter((s) => Boolean(s.nextSessionTime) && !isNaN(new Date(s.nextSessionTime).getTime()))
        .map((s) => new Date(s.nextSessionTime).toDateString())
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [classes, selectedSubject, selectedDays, dayMatchMode, selectedTimeSlots]);

  const filteredClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    return classes.filter((c) => {
      if (selectedSubject && selectedSubject !== 'ALL' && getCourseSubject(c) !== selectedSubject) {
        return false;
      }
      if (!checkCourseMatchesDays(c, selectedDays, dayMatchMode)) {
        return false;
      }
      if (selectedTimeSlots.length > 0 && !selectedTimeSlots.some((slotId) => checkMatchesTimeSlot(c, slotId))) {
        return false;
      }
      if (selectedDate !== 'ALL') {
        const nextDateStr = c.nextSessionTime ? new Date(c.nextSessionTime).toDateString() : '';
        if (nextDateStr !== selectedDate) return false;
      }
      if (!q) return true;
      const haystack = [c.className, c.subjectName, c.coachName, c.roomName, c.subjectDescription]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [classes, selectedSubject, selectedDays, dayMatchMode, selectedTimeSlots, selectedDate, classSearch]);

  const totalClassPages = Math.max(1, Math.ceil(filteredClasses.length / GUEST_COURSES_PER_PAGE));
  const safeClassPage = Math.min(classPage, totalClassPages);
  const paginatedClasses = useMemo(() => {
    const start = (safeClassPage - 1) * GUEST_COURSES_PER_PAGE;
    return filteredClasses.slice(start, start + GUEST_COURSES_PER_PAGE);
  }, [filteredClasses, safeClassPage]);

  const handleGuestClassPageChange = (nextPage) => {
    const clamped = Math.max(1, Math.min(totalClassPages, nextPage));
    setClassPage(clamped);
    const sectionEl = document.getElementById('classes');
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered packages by tab category
  const filteredPackages = useMemo(() => {
    if (!packages || packages.length === 0) return defaultPackages;
    // Hide 0 price trials and retired AI / Gym+AI packages from public showcase grid
    const valid = packages.filter((p) => {
      const name = (p.packageName || '').toLowerCase();
      return (p.price || 0) > 0 && p.packageType !== 'AI_ACCESS' && !name.includes('gym + ai') && !name.includes('gym+ai');
    });
    if (packageCategory === 'ALL') return valid.slice(0, 6);
    if (packageCategory === 'GYM') {
      return valid.filter(p => p.packageType === 'GYM_ACCESS' && !p.packageName.toLowerCase().includes('bơi') && !p.packageName.toLowerCase().includes('combo')).slice(0, 6);
    }
    if (packageCategory === 'POOL_COMBO') {
      return valid.filter((p) => {
        const type = (p.packageType || '').toUpperCase();
        const name = (p.packageName || '').toLowerCase();
        return type === 'POOL_ACCESS' || type === 'SAUNA_ACCESS' || name.includes('bơi') || name.includes('xông hơi') || name.includes('sauna') || name.includes('combo');
      }).slice(0, 6);
    }
    return valid.slice(0, 6);
  }, [packages, packageCategory]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Helper to provide realistic rich benefits if backend benefits list is empty
  const getPackagePerks = (pkg) => {
    if (Array.isArray(pkg.benefits) && pkg.benefits.length > 0) {
      return pkg.benefits.map((b) => {
        if (typeof b === 'string') return b;
        if (b && typeof b === 'object') {
          const name = b.subjectName || t('Bộ môn');
          const quota = b.sessionLimit ? `${b.sessionLimit} ${t('buổi')}` : t('Không giới hạn');
          return `${name}: ${quota}`;
        }
        return String(b || '');
      });
    }
    const type = (pkg.packageType || '').toUpperCase();
    const name = (pkg.packageName || '').toLowerCase();

    if (type === 'POOL_ACCESS' || name.includes('bơi')) {
      return [
        'Bể bơi 4 mùa nước ấm 25m điện phân muối khoáng',
        'Tự do bơi lội và thư giãn cơ sau giờ làm việc',
        'Miễn phí tủ đồ RFID & khu tắm tráng nước nóng',
        tr(`Thời hạn sử dụng ${pkg.durationDays} ngày`, `Valid for ${pkg.durationDays} days`)
      ];
    }
    if (type === 'SAUNA_ACCESS' || name.includes('xông hơi') || name.includes('sauna')) {
      return [
        'Phòng xông hơi khô đá muối Himalaya & xông hơi ướt',
        'Phục hồi cơ bắp, giảm căng thẳng sau tập luyện',
        'Miễn phí tủ đồ RFID & khu tắm tráng nóng lạnh',
        tr(`Thời hạn sử dụng ${pkg.durationDays} ngày`, `Valid for ${pkg.durationDays} days`)
      ];
    }
    if (name.includes('combo')) {
      return [
        'Full quyền sử dụng sàn Gym Tầng 1 và tiện ích nâng cao',
        'Không giới hạn giờ xông hơi Sauna & Locker thông minh',
        'Đo chỉ số cơ thể InBody định kỳ hàng tuần',
        tr(`Thời hạn sử dụng ${pkg.durationDays} ngày`, `Valid for ${pkg.durationDays} days`)
      ];
    }
    return [
      'Toàn quyền tập luyện sàn Gym Tầng 1 chuẩn Olympic',
      'Miễn phí tủ đồ RFID & phòng tắm nóng lạnh',
      'Được HLV trực sàn hướng dẫn kỹ thuật cơ bản',
      tr(`Thời hạn sử dụng ${pkg.durationDays} ngày`, `Valid for ${pkg.durationDays} days`)
    ];
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Primary Semantic H1 for SEO and Screen Readers */}
      <h1 className="sr-only">
        {t("Nexus Sports Lab - Trung Tâm Thể Thao Cao Cấp & Đào Tạo Thể Lực Đỉnh Cao")}
      </h1>

      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#060b17]/95 backdrop-blur-md border-b border-slate-800 shadow-xl shadow-black/40' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-0.5">
                {t("NEXUS")}<span className="text-blue-500">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                {t("SPORTS LAB")}
              </span>
            </div>
          </a>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#facilities" className="hover:text-blue-400 transition-colors">{t("Facilities")}</a>
            <a href="#classes" className="hover:text-blue-400 transition-colors">{t("Classes")}</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">{t("Pricing")}</a>
            <a 
              href="#classes" 
              className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{t("Courses & Roadmap")}</span>
            </a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">{t("FAQ")}</a>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {t("Log in")}
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              {t("Get Started")}
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700 focus:outline-none"
              aria-label={t("Toggle navigation menu")}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a1122]/98 backdrop-blur-xl border-b border-slate-800 px-6 py-6 space-y-4"
            >
              <div className="flex flex-col space-y-3 text-base font-semibold text-slate-200">
                <a 
                  href="#facilities" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 transition-colors"
                >
                  {t("Facilities")}
                </a>
                <a 
                  href="#classes" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 transition-colors"
                >
                  {t("Classes")}
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 transition-colors"
                >
                  {t("Pricing")}
                </a>
                <a
                  href="#classes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 text-left transition-colors"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>{t("Courses & Roadmap")}</span>
                </a>
                <a 
                  href="#faq" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 transition-colors"
                >
                  {t("FAQ")}
                </a>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-800 text-white font-semibold text-center hover:bg-slate-700 transition-colors"
                >
                  {t("Log in")}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-center hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-colors"
                >
                  {t("Get Started")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <AuroraBackground className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#060b17]">
        <motion.div 
          initial={{ opacity: 0.0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 1.2,
            ease: "easeOut",
          }}
          className="max-w-7xl mx-auto px-6 relative z-10 w-full"
        >
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mx-auto">
              <Sparkles className="w-4 h-4" />
              <ShinyText text={t("Premium Sports & Fitness Laboratory")} speed={7} className="tracking-wider" />
            </div>
            
            <TypewriterEffectSmooth 
              words={[
                { text: t("Elevate") },
                { text: t("Your") },
                { text: t("Physical") },
                { text: t("Potential."), className: "text-blue-500 dark:text-blue-500" },
              ]} 
            />
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {t("Nexus Sports Lab provides world-class coaching, elite facilities, and data-driven training programs to help you achieve your ultimate fitness goals.")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={() => navigate('/register')} 
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
              >
                {t("Join the Elite Now")}
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('facilities').scrollIntoView({ behavior: 'smooth' })} 
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#111d38] hover:bg-[#1a2947] text-white font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Play className="w-5 h-5" />
                {t("Explore Facilities")}
              </button>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-slate-400 font-semibold text-sm">
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t("50+ Expert Coaches")}</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t("Olympic Equipment")}</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t("AI Smart Training")}</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t("3-Floor Campus")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* Facilities & Amenities Section (Also acts as #features target) */}
      <section id="facilities" className="py-24 bg-[#0a1122] border-t border-slate-800/80 scroll-mt-20">
        <span id="features" className="sr-only">Features Anchor</span>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Compass className="w-3.5 h-3.5" />
              {t("World-Class Architecture")}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              {t("Olympic Standard Facilities")}
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              {t("Khám phá hệ sinh thái 3 tầng chuyên biệt cùng hệ tiện ích VIP 5 sao được quy hoạch bài bản cho vận động viên và hội viên cao cấp.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilitiesList.map((item) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={item.id} 
                  className="group bg-[#060b17] border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col"
                >
                  <div className="h-52 relative overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={t(item.name)}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060b17] via-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{t(item.floor)}</span>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-300">
                      {t(item.badge)}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-1">
                        {t(item.category)}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {t(item.name)}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {t(item.description)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>{t("Capacity")}: <strong className="text-white">{t(item.capacity)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured / Public Courses Catalog Section */}
      <motion.section 
        id="classes" 
        className="py-24 bg-[#060b17] scroll-mt-20"
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Flame className="w-3.5 h-3.5" />
                {tr('Danh mục khóa học chuẩn quốc tế', 'Curated Training Courses')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {tr('Khóa Học & Lộ Trình Đào Tạo Chi Tiết', 'Detailed Courses & Training Programs')}
              </h2>
              <p className="text-slate-400 max-w-2xl">
                {tr(
                  'Thông tin minh bạch về bộ môn, huấn luyện viên, số buổi học, khung giờ cố định, sĩ số thực tế và học phí trọn khóa.',
                  'Explore complete course details: curriculum, coach, room, total sessions, weekly schedule, real-time spots, and full tuition.'
                )}
              </p>
            </div>
          </div>

          {loadingClasses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#0a1122] border border-slate-800 rounded-3xl p-6 h-[420px] animate-pulse" />
              ))}
            </div>
          ) : selectedSubject === null ? (
            /* ======================================================== */
            /* MODE 1: MASTER VIEW - SUBJECT CATALOG                    */
            /* ======================================================== */
            <div className="space-y-8">
              {/* Subject Search & "View all classes" Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="relative w-full md:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={tr('Tìm theo bộ môn (Gym, Yoga, Bơi...), HLV hoặc phòng tập...', 'Search by sport (Yoga, Gym, Swim...), coach or room...')}
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#0a1122] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {classSearch && (
                    <button
                      type="button"
                      onClick={() => setClassSearch('')}
                      aria-label={tr('Xóa tìm kiếm', 'Clear search')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    {subjectSummaries.length} {tr('bộ môn đang mở', 'active sports')} · {classes.length} {tr('lớp học', 'classes available')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject('ALL');
                      resetClassFilters();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <span>{tr(`Xem tất cả lớp (${classes.length})`, `View all classes (${classes.length})`)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {filteredSubjectSummaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubjectSummaries.map((subj) => (
                    <div
                      key={subj.name}
                      onClick={() => {
                        setSelectedSubject(subj.name);
                        resetClassFilters();
                      }}
                      className="bg-[#0a1122] border border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer group"
                    >
                      <div>
                        {/* Subject Cover Image */}
                        <div className="relative h-44 overflow-hidden">
                          <img
                            src={subj.coverUrl}
                            alt={subj.name}
                            loading="lazy"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.fallback) {
                                e.currentTarget.dataset.fallback = '1';
                                e.currentTarget.src = getSubjectFallbackImage({ subjectName: subj.name });
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122] via-black/45 to-black/20" />
                          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                            <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-bold text-blue-300">
                              {tr('Bộ môn đào tạo', 'Sport Discipline')}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-[11px] font-bold text-white">
                              {subj.count} {tr('lớp đang mở', 'classes open')}
                            </span>
                          </div>
                        </div>

                        {/* Subject Body */}
                        <div className="p-6 pb-4 space-y-3">
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            {subj.name}
                          </h3>

                          {subj.description && (
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                              {subj.description}
                            </p>
                          )}

                          <div className="space-y-1.5 pt-1 text-xs text-slate-300">
                            {subj.rooms.length > 0 && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate">{subj.rooms.join(' · ')}</span>
                              </div>
                            )}
                            {subj.coaches.length > 0 && (
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">
                                  {t("Coach")}: <strong className="text-white font-semibold">{subj.coaches.join(', ')}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subject Footer */}
                      <div className="px-6 py-4 border-t border-slate-800/90 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            {tr('Học phí từ', 'Tuition from')}
                          </div>
                          <div className="text-base font-black text-white">
                            {subj.minPrice.toLocaleString('vi-VN')} <span className="text-blue-400 text-sm font-bold">₫</span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all">
                          <span>{tr('Xem các lớp đang mở', 'View open classes')}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a1122] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <Dumbbell className="w-10 h-10 mx-auto text-slate-600" />
                  <h3 className="text-lg font-bold text-white">
                    {tr('Không tìm thấy bộ môn phù hợp', 'No matching sports found')}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {tr('Thử xóa từ khóa tìm kiếm để xem toàn bộ các bộ môn đang mở.', 'Try clearing your search keyword to view all open sports disciplines.')}
                  </p>
                  {classSearch && (
                    <button
                      type="button"
                      onClick={() => setClassSearch('')}
                      className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                    >
                      {tr('Xóa tìm kiếm', 'Clear search')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* MODE 2: DRILL-DOWN VIEW - CLASSES OF SELECTED SUBJECT    */
            /* ======================================================== */
            <div className="space-y-8">
              {/* Navigation Header + Subject Switcher + Multi-Criteria Bento Schedule Filter Dock */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0a1122] border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject(null);
                        resetClassFilters();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                      <span>{tr('Quay lại tất cả bộ môn', 'Back to all sports')}</span>
                    </button>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                        {tr('Bộ môn đang chọn', 'Selected Sport')}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {selectedSubject === 'ALL' ? tr('Tất cả các lớp đang mở', 'All Active Classes') : selectedSubject}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-xs font-semibold text-slate-400">
                      <span className="text-blue-400 font-bold text-sm">{filteredClasses.length}</span>{' '}
                      {tr('lớp phù hợp', 'matching classes')}
                    </div>

                    {isClassFiltered && (
                      <button
                        type="button"
                        onClick={resetClassFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>{tr('Đặt lại bộ lọc', 'Reset Filters')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Subject Tabs + Class Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject('ALL');
                        setSelectedDate('ALL');
                        setClassPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSubject === 'ALL'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {tr(`Tất cả (${classes.length})`, `All (${classes.length})`)}
                    </button>
                    {subjectSummaries.map((subj) => (
                      <button
                        key={subj.name}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subj.name);
                          setSelectedDate('ALL');
                          setClassPage(1);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedSubject === subj.name
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {subj.name} ({subj.count})
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={tr('Tìm khóa học, mã lớp, HLV, phòng...', 'Search course, code, coach, room...')}
                      value={classSearch}
                      onChange={(e) => {
                        setClassSearch(e.target.value);
                        setClassPage(1);
                      }}
                      className="w-full pl-10 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {classSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setClassSearch('');
                          setClassPage(1);
                        }}
                        aria-label={tr('Xóa tìm kiếm', 'Clear search')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2-Column Bento Schedule Filter Grid (Day of Week & Time Slot) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-slate-800/80">
                  {/* Left: Day of Week Multi-Select */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{tr('Thứ học trong tuần:', 'Filter by Day of Week:')}</span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setDayMatchMode('ANY');
                              setClassPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              dayMatchMode === 'ANY'
                                ? 'bg-slate-800 text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {tr('Bất kỳ thứ nào đã chọn', 'Any Selected Day')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDayMatchMode('EXACT');
                              setClassPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              dayMatchMode === 'EXACT'
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={tr('Chỉ hiển thị lớp mà toàn bộ lịch học nằm trong các thứ đã chọn', 'Only show classes whose sessions fall strictly within selected days')}
                          >
                            {tr('Chỉ các thứ này', 'Only These Days')}
                          </button>
                        </div>

                        {selectedDays.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDays([]);
                              setClassPage(1);
                            }}
                            className="text-blue-400 hover:underline font-semibold cursor-pointer text-xs shrink-0"
                          >
                            {tr('Tất cả các thứ', 'All Days')}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {GUEST_DAYS_OF_WEEK.map((day) => {
                        const isActive = day.id === 'ALL' ? selectedDays.length === 0 : selectedDays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            className={`px-2 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            {isVi ? day.vi : day.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Time Slot Multi-Select */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{tr('Khung giờ học:', 'Filter by Time Slot:')}</span>
                      </span>
                      {selectedTimeSlots.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTimeSlots([]);
                            setClassPage(1);
                          }}
                          className="text-blue-400 hover:underline font-semibold cursor-pointer text-xs"
                        >
                          {tr('Mọi khung giờ', 'All Times')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {GUEST_TIME_SLOTS.map((slot) => {
                        const isActive = selectedTimeSlots.includes(slot.id);
                        const Icon = slot.icon;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggleTimeSlot(slot.id)}
                            className={`px-3 py-2 rounded-xl text-xs transition-all flex flex-col items-start gap-0.5 cursor-pointer border ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                              <span>{isVi ? slot.vi : slot.en}</span>
                            </div>
                            <span className={`text-[10px] font-mono ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                              {slot.timeRange}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Start Date Horizontal Strip */}
                <div className="space-y-2 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{tr('Ngày khai giảng dự kiến:', 'Select Start Date:')}</span>
                    </span>
                    {selectedDate !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate('ALL');
                          setClassPage(1);
                        }}
                        className="text-blue-400 hover:underline font-semibold cursor-pointer text-xs"
                      >
                        {tr('Tất cả ngày', 'All dates')}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate('ALL');
                        setClassPage(1);
                      }}
                      className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl min-w-[74px] transition-all cursor-pointer border shrink-0 ${
                        selectedDate === 'ALL'
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 border-blue-500'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {tr('Tất cả', 'ALL')}
                      </span>
                      <span className={`text-sm font-black my-0.5 ${selectedDate === 'ALL' ? 'text-white' : 'text-white'}`}>
                        ∞
                      </span>
                      <span className={`text-[10px] font-medium ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                        {tr('Ngày', 'Dates')}
                      </span>
                    </button>

                    {availableDates.map((dateStr) => {
                      const isActive = selectedDate === dateStr;
                      const { dayOfWeek, day, month } = parseGuestDateDetails(dateStr, isVi);

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setClassPage(1);
                          }}
                          className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl min-w-[74px] transition-all cursor-pointer border shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 border-blue-500'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            {dayOfWeek}
                          </span>
                          <span className="text-base font-black leading-none my-0.5 text-white">
                            {day}
                          </span>
                          <span className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            {month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {filteredClasses.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedClasses.map((course, idx) => {
                const { code: classCode, name: classDisplayName } = splitCode(course.className);
                const levelBand = classLevelFromCode(classCode);
                const levelLabel = levelText(levelBand, isVi);
                const subjectLabel = getCourseSubject(course);
                const maxSlots = Number(course.maxSlots) || 0;
                const displayBooked = Math.min(maxSlots || Number(course.bookedSlots || 0), Number(course.bookedSlots || 0));
                const spotsLeft = Math.max(0, maxSlots - displayBooked);
                const isFull = maxSlots > 0 && spotsLeft <= 0;

                const timing = formatCourseTiming(course, isVi);
                const price = Number(course.price) || 0;
                const courseDescription = getCourseDescription(course);

                return (
                  <div
                    key={course.classId || idx}
                    className="bg-[#0a1122] border border-slate-800 hover:border-blue-500/40 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 group"
                  >
                    {/* Cover & Badges */}
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <img
                        src={getCourseCoverUrl(course)}
                        alt={classDisplayName || course.className}
                        loading="lazy"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = '1';
                            e.currentTarget.src = getSubjectFallbackImage(course);
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122] via-black/45 to-black/20" />

                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-bold text-blue-300 truncate max-w-[55%]">
                          {subjectLabel}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {classCode && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-600/85 backdrop-blur-md text-[11px] font-mono font-bold text-white">
                              {classCode}
                            </span>
                          )}
                          {levelLabel && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-[11px] font-bold text-amber-300">
                              {levelLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${
                            isFull
                              ? 'bg-rose-500/20 border-rose-400/30 text-rose-300'
                              : spotsLeft <= 3
                              ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                              : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                          }`}
                        >
                          {isFull
                            ? tr('Đã đủ sĩ số', 'Class Full')
                            : tr(`Còn ${spotsLeft}/${maxSlots} chỗ trống`, `${spotsLeft}/${maxSlots} spots left`)}
                        </span>
                      </div>
                    </div>

                    {/* Course Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                          {classDisplayName || course.className}
                        </h3>

                        {courseDescription && (
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {courseDescription}
                          </p>
                        )}

                        {/* Coach & Room */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 pt-1">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>
                              {t("Coach")} <strong className="text-white">{course.coachName}</strong>
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{course.roomName}</span>
                          </span>
                        </div>

                        {/* 4-cell Course Spec Grid */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                              <Clock className="w-3 h-3 text-blue-400" />
                              {tr('Thời lượng khóa', 'Course Length')}
                            </div>
                            <div className="text-xs font-bold text-white">
                              {course.totalSessions || 0} {tr('buổi', 'sessions')}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {course.durationMinutes || 60} {tr('phút/buổi', 'min/session')}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                              <Repeat className="w-3 h-3 text-purple-400" />
                              {tr('Lịch cố định', 'Weekly Pattern')}
                            </div>
                            <div className="text-xs font-bold text-white truncate" title={timing.patternText}>
                              {timing.patternText}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {tr('Khung giờ:', 'Time:')} {timing.timeStr}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                              <Calendar className="w-3 h-3 text-emerald-400" />
                              {tr('Ngày khai giảng', 'Start Date')}
                            </div>
                            <div className="text-xs font-bold text-white">
                              {timing.nextDateStr}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tr('Đang mở đăng ký', 'Open for enrollment')}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                              <Users className="w-3 h-3 text-cyan-400" />
                              {tr('Sĩ số lớp', 'Class Capacity')}
                            </div>
                            <div className="text-xs font-bold text-white">
                              {displayBooked}/{maxSlots} {tr('học viên', 'enrolled')}
                            </div>
                            <div className={`text-[11px] font-semibold mt-0.5 ${isFull ? 'text-rose-400' : spotsLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isFull ? tr('Đã đủ chỗ', 'Full') : tr(`Còn ${spotsLeft} chỗ trống`, `${spotsLeft} spots left`)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Tuition & Actions */}
                      <div className="pt-4 border-t border-slate-800/90 space-y-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            {tr('Học phí trọn khóa', 'Full Course Tuition')}
                          </div>
                          <div className="text-xl font-black text-white leading-tight">
                            {price.toLocaleString('vi-VN')} <span className="text-blue-400 text-base font-bold">₫</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCourseDetail(course)}
                            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{tr('Chi tiết lộ trình', 'Course Details')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate('/login')}
                            disabled={isFull}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              isFull
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            }`}
                          >
                            <span>{isFull ? tr('Đã đủ chỗ', 'Class Full') : tr('Đăng ký khóa', 'Enroll Course')}</span>
                            {!isFull && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                  </div>

                  {totalClassPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0a1122] border border-slate-800 shadow-lg">
                      <div className="text-xs font-medium text-slate-400">
                        {tr(
                          `Hiển thị ${(safeClassPage - 1) * GUEST_COURSES_PER_PAGE + 1}–${Math.min(safeClassPage * GUEST_COURSES_PER_PAGE, filteredClasses.length)} trong tổng số ${filteredClasses.length} lớp học`,
                          `Showing ${(safeClassPage - 1) * GUEST_COURSES_PER_PAGE + 1}–${Math.min(safeClassPage * GUEST_COURSES_PER_PAGE, filteredClasses.length)} of ${filteredClasses.length} classes`
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => handleGuestClassPageChange(safeClassPage - 1)}
                          disabled={safeClassPage <= 1}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                          <span>{tr('Trước', 'Prev')}</span>
                        </button>
                        {Array.from({ length: totalClassPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleGuestClassPageChange(pageNum)}
                            className={`min-w-[36px] h-[36px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              safeClassPage === pageNum
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-500'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleGuestClassPageChange(safeClassPage + 1)}
                          disabled={safeClassPage >= totalClassPages}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <span>{tr('Sau', 'Next')}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0a1122] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <Dumbbell className="w-10 h-10 mx-auto text-slate-600" />
                  <h3 className="text-lg font-bold text-white">
                    {tr('Không tìm thấy khóa học phù hợp', 'No matching courses found')}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {tr('Không có khóa học nào khớp bộ lọc hiện tại (thứ học, khung giờ hoặc ngày khai giảng). Hãy thử đặt lại bộ lọc.', 'No courses match your current filters (days, time slots, or start date). Try resetting filters.')}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {isClassFiltered && (
                      <button
                        type="button"
                        onClick={resetClassFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{tr('Đặt lại bộ lọc', 'Reset Filters')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubject(null);
                        resetClassFilters();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {tr('Quay lại tất cả bộ môn', 'Back to all sports')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-20 bg-[#0a1122] overflow-hidden flex flex-col items-center justify-center border-y border-slate-800/80" 
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {t("Proven Results")}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center tracking-tight">
          {t("What Our Athletes Say")}
        </h2>
        <InfiniteMovingCards
          key={language}
          items={testimonials.map(item => ({ ...item, quote: t(item.quote), title: t(item.title) }))}
          direction="right"
          speed="slow"
        />
      </motion.section>

      {/* Pricing / Packages CTA */}
      <motion.section 
        id="pricing" 
        className="py-24 bg-[#060b17] scroll-mt-20" 
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t("Transparent Investment")}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              <ShinyText text={t("Membership Packages")} speed={7} />
            </h2>
            <p className="text-slate-400 text-lg">
              {t("Choose the perfect plan to unlock your potential. No hidden fees.")}
            </p>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-8">
              {[
                { id: 'ALL', label: t('Tất cả gói tập') },
                { id: 'GYM', label: t('Gym & Thể Hình') },
                { id: 'POOL_COMBO', label: t('Bể Bơi & Xông Hơi') },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPackageCategory(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    packageCategory === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg, idx) => {
                const isFeatured = idx === 1;
                const perks = getPackagePerks(pkg);

                return (
                  <div 
                    key={pkg.packageId || idx} 
                    className={`bg-[#0a1122] border rounded-3xl p-8 flex flex-col transition-all duration-300 relative ${
                      isFeatured 
                        ? 'border-blue-500 shadow-2xl shadow-blue-500/20 md:-translate-y-2 bg-gradient-to-b from-[#0e1936] to-[#0a1122]' 
                        : 'border-slate-800 hover:border-slate-700 hover:-translate-y-1'
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/40">
                        {t("MOST POPULAR")}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                        {codeLabel(pkg.packageType || 'MEMBERSHIP')}
                      </span>
                      <h3 className="text-2xl font-bold text-white mt-1 line-clamp-1">{t(pkg.packageName)}</h3>
                    </div>

                    <div className="mb-6 pb-6 border-b border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">
                          {(pkg.price || 0).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xl font-bold text-blue-400">₫</span>
                        <span className="text-xs font-normal text-slate-400 ml-1">
                          / {pkg.durationDays} {t("days")}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {perks.slice(0, 4).map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{typeof benefit === 'string' ? t(benefit) : String(benefit?.subjectName || benefit || '')}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => navigate('/register')} 
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                        isFeatured 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02]' 
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {t("Get Started")}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center text-slate-500 py-12">
                {loadingPackages ? t("Loading membership packages...") : t("No packages available.")}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-24 bg-[#0a1122] border-t border-slate-800/80 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              {t("Clear Answers")}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
              {t("Frequently Asked Questions")}
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              {t("Giải đáp những thắc mắc thường gặp của bạn trước khi bắt đầu lộ trình rèn luyện tại Nexus.")}
            </p>
          </div>

          <div className="space-y-4">
            {faqsList.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[#060b17] border border-slate-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base md:text-lg font-bold text-white">
                      {t(faq.q)}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-blue-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50 pt-4"
                      >
                        {t(faq.a)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Detail & Full Session Roadmap Modal */}
      <AnimatePresence>
        {selectedCourseDetail && (() => {
          const course = selectedCourseDetail;
          const { code: classCode, name: classDisplayName } = splitCode(course.className);
          const levelLabel = levelText(classLevelFromCode(classCode), isVi);
          const subjectLabel = getCourseSubject(course);
          const maxSlots = Number(course.maxSlots) || 0;
          const displayBooked = Math.min(maxSlots || Number(course.bookedSlots || 0), Number(course.bookedSlots || 0));
          const spotsLeft = Math.max(0, maxSlots - displayBooked);
          const isFull = maxSlots > 0 && spotsLeft <= 0;
          const timing = formatCourseTiming(course, isVi);
          const price = Number(course.price) || 0;
          const courseDescription = getCourseDescription(course);
          const upcoming = Array.isArray(course.upcomingDates) ? course.upcomingDates : [];

          return (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedCourseDetail(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a1122] border border-slate-700 shadow-2xl shadow-blue-900/30 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative"
              >
                {/* Banner Header */}
                <div className="relative h-48 sm:h-56 shrink-0 overflow-hidden">
                  <img
                    src={getCourseCoverUrl(course)}
                    alt={classDisplayName || course.className}
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = '1';
                        e.currentTarget.src = getSubjectFallbackImage(course);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1122] via-[#0a1122]/65 to-black/30" />

                  <button
                    type="button"
                    onClick={() => setSelectedCourseDetail(null)}
                    aria-label={t("Close")}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-red-500/30 text-slate-200 hover:text-white border border-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-5 left-6 right-6 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-xs font-bold text-blue-300">
                        {subjectLabel}
                      </span>
                      {classCode && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-xs font-mono font-bold text-white">
                          {classCode}
                        </span>
                      )}
                      {levelLabel && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300">
                          {levelLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {classDisplayName || course.className}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>{t("Coach")} <strong className="text-white">{course.coachName}</strong></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{course.roomName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar flex-1">
                  {/* Course Overview */}
                  {courseDescription && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400">
                        {tr('Mô tả môn học', 'Subject Description')}
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {courseDescription}
                      </p>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">{tr('Số buổi & Thời lượng', 'Sessions & Duration')}</div>
                      <div className="text-sm font-bold text-white">{course.totalSessions || 0} {tr('buổi', 'sessions')}</div>
                      <div className="text-xs text-slate-400">{course.durationMinutes || 60} {tr('phút/buổi', 'min/session')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">{tr('Lịch học hàng tuần', 'Weekly Schedule')}</div>
                      <div className="text-sm font-bold text-white">{timing.patternText}</div>
                      <div className="text-xs text-slate-400">{timing.timeStr}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">{tr('Ngày khai giảng', 'Start Date')}</div>
                      <div className="text-sm font-bold text-white">{timing.nextDateStr}</div>
                      <div className="text-xs text-slate-400">{tr('Đang mở đăng ký', 'Open for enrollment')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">{tr('Tình trạng chỗ', 'Availability')}</div>
                      <div className="text-sm font-bold text-white">{displayBooked}/{maxSlots} {tr('đã đăng ký', 'enrolled')}</div>
                      <div className={`text-xs font-semibold ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isFull ? tr('Đã đủ sĩ số', 'Fully booked') : tr(`Còn ${spotsLeft} chỗ trống`, `${spotsLeft} spots left`)}
                      </div>
                    </div>
                  </div>

                  {/* Complete Session Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {tr('Lộ trình chi tiết các buổi học', 'Complete Session Roadmap')}
                      </h4>
                      <span className="text-xs font-semibold text-slate-400">
                        {upcoming.length}/{course.totalSessions || upcoming.length} {tr('buổi sắp tới', 'upcoming sessions')}
                      </span>
                    </div>

                    {upcoming.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {upcoming.map((dateText, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-0.5"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                              {tr(`Buổi #${i + 1}`, `Session #${i + 1}`)}
                            </span>
                            <span className="text-xs font-semibold text-slate-200 font-mono">
                              {dateText}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                        {tr('Lịch chi tiết từng buổi sẽ được cập nhật khi mở lớp.', 'Detailed session dates will appear upon class scheduling.')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-5 sm:p-6 border-t border-slate-800 bg-[#080e1d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                  <div>
                    <div className="text-xs text-slate-400">
                      {tr('Học phí trọn khóa', 'Total Course Tuition')} ({course.totalSessions || upcoming.length} {tr('buổi', 'sessions')})
                    </div>
                    <div className="text-2xl font-black text-white">
                      {price.toLocaleString('vi-VN')} <span className="text-blue-400 text-lg">₫</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseDetail(null)}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      {t("Close")}
                    </button>
                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setSelectedCourseDetail(null);
                        navigate('/login');
                      }}
                      className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        isFull
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      }`}
                    >
                      <span>{isFull ? tr('Lớp đã đủ sĩ số', 'Class is Full') : tr('Đăng ký khóa học này', 'Enroll in This Course')}</span>
                      {!isFull && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Footer & Comprehensive Contact Information */}
      <footer className="border-t border-slate-800 bg-[#040812] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand & Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className="font-black text-xl text-white tracking-tight">
                  {t("NEXUS")}<span className="text-blue-500">.</span> {t("SPORTS LAB")}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t("Hệ thống trung tâm thể thao thông minh chuẩn 5 sao với quy mô 3 tầng, 5 môn thể thao chuyên biệt và công nghệ AI đồng hành cá nhân hóa.")}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t("Giờ mở cửa: 06:00 – 22:00 (Thứ 2 – CN)")}</span>
              </div>
            </div>

            {/* Col 2: Navigation Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                {t("Quick Links")}
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#facilities" className="hover:text-blue-400 transition-colors">{t("Facilities")}</a></li>
                <li><a href="#classes" className="hover:text-blue-400 transition-colors">{t("Classes")}</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">{t("Pricing")}</a></li>
                <li><a href="#classes" className="hover:text-blue-400 transition-colors">{t("Courses & Roadmap")}</a></li>
                <li><a href="#faq" className="hover:text-blue-400 transition-colors">{t("FAQ")}</a></li>
              </ul>
            </div>

            {/* Col 3: Direct Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                {t("Direct Contact")}
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                  <span>{t("Tầng 1-3, Nexus Complex, Khu Công Nghệ Cao, Hà Nội")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white">1900 6868 / 0988 123 456</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>contact@nexussportslab.vn</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Member Portal CTA */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                {t("Member Portal")}
              </h4>
              <p className="text-slate-400 text-sm mb-4">
                {t("Đã là hội viên hoặc huấn luyện viên? Đăng nhập để xem lịch cá nhân và giáo án.")}
              </p>
              <div className="space-y-2.5">
                <button 
                  onClick={() => navigate('/login')} 
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  {t("Log in")}
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
                >
                  {t("Register Membership")}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Nexus Sports Lab. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400 transition-colors">{t("Privacy Policy")}</a>
              <a href="#" className="hover:text-slate-400 transition-colors">{t("Terms of Service")}</a>
              <a href="#" className="hover:text-slate-400 transition-colors">{t("Security Standards")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

// Mock default packages showcase if backend is cold/empty
const defaultPackages = [
  {
    packageId: 101,
    packageName: 'Standard Fitness',
    packageType: 'GYM_ACCESS',
    durationDays: 30,
    price: 650000,
    benefits: [
      'Sử dụng toàn bộ trang thiết bị Gym Tầng 1',
      'Miễn phí tủ đồ RFID & phòng tắm nóng lạnh',
      'Đo chỉ số InBody và tư vấn lộ trình cơ bản',
    ],
  },
  {
    packageId: 102,
    packageName: 'Pro All-Access & Pool',
    packageType: 'COMBO',
    durationDays: 90,
    price: 1800000,
    benefits: [
      'Toàn quyền sử dụng Gym, Bể bơi 4 mùa & Yoga',
      'Không giới hạn giờ xông hơi đá muối Sauna VIP',
      'Đo chỉ số InBody và tư vấn lộ trình định kỳ',
      '02 buổi tập kèm 1-1 với Huấn Luyện Viên',
    ],
  },
  {
    packageId: 103,
    packageName: 'Elite Annual Black',
    packageType: 'PREMIUM',
    durationDays: 365,
    price: 5900000,
    benefits: [
      'Đặc quyền toàn bộ 5 môn thể thao và tiện ích',
      'Hỗ trợ bảo lưu miễn phí lên tới 60 ngày',
      'Khăn tập và nước bù khoáng miễn phí mỗi buổi',
      'Ưu tiên đặt chỗ các lớp Masterclass cuối tuần',
    ],
  },
];

// Facilities matching exact project specs (Rooms 1 to 5 + Sauna)
const facilitiesList = [
  {
    id: 'gym',
    name: 'Phòng Gym & Thể Hình Tầng 1',
    category: 'Thể Hình & Sức Mạnh',
    capacity: '50 hội viên',
    floor: 'Tầng 1',
    description: 'Trang bị đầy đủ tạ khối cao cấp, máy trợ lực đa hướng và tạ đơn lên tới 50kg cho dân thể hình chuyên nghiệp.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    icon: Dumbbell,
    badge: 'Popular Zone',
  },
  {
    id: 'pool',
    name: 'Bể Bơi Bốn Mùa Trong Nhà',
    category: 'Bơi Lội Bán Olympic',
    capacity: '100 người',
    floor: 'Khu Bơi Lội',
    description: 'Hồ bơi 25m nước ấm bốn mùa, lọc điện phân muối khoáng không clo gây cay mắt, kiểm soát nhiệt độ tự động.',
    image: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800&q=80',
    icon: Waves,
    badge: 'Indoor Heated',
  },
  {
    id: 'yoga',
    name: 'Phòng Yoga & Thiền Định Tầng 2',
    category: 'Yoga & Thân Thể',
    capacity: '30 học viên',
    floor: 'Tầng 2',
    description: 'Sàn gỗ tự nhiên chống trơn, hệ thống điều hòa cấp khí tươi và ánh sáng dịu nhẹ giúp thư giãn tâm trí tối đa.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
    icon: Activity,
    badge: 'Zen Studio',
  },
  {
    id: 'zumba',
    name: 'Phòng Zumba & Cardio Dance Tầng 3',
    category: 'Vũ Đạo & Đốt Mỡ',
    capacity: '40 học viên',
    floor: 'Tầng 3',
    description: 'Sàn đàn hồi giảm phản chấn bảo vệ khớp gối, hệ thống âm thanh vòm tràn ngập năng lượng bùng nổ theo từng nhịp điệu.',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    icon: Flame,
    badge: 'High Energy',
  },
  {
    id: 'cycling',
    name: 'Phòng Đạp Xe Spinning Nhịp Điệu',
    category: 'Đạp Xe & Sức Bền',
    capacity: '20 xe đạp',
    floor: 'Tầng 2',
    description: 'Dàn xe đạp từ thông minh thế hệ mới, đo nhịp tim và đồng bộ cadence theo nhạc nền sống động cùng HLV.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
    icon: Compass,
    badge: 'Smart Bikes',
  },
  {
    id: 'sauna',
    name: 'Khu Sauna & Locker VIP',
    category: 'Phục Hồi & Thư Giãn',
    capacity: 'Khu vực riêng biệt',
    floor: 'Tầng 1 & Tầng 2',
    description: 'Tủ khóa thông minh RFID, phòng tắm nước nóng áp lực cao và phòng xông hơi đá muối Himalaya phục hồi cơ.',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80',
    icon: Shield,
    badge: 'VIP Amenity',
  },
];

// Interactive FAQ list
const faqsList = [
  {
    q: 'Tôi có thể đăng ký tập thử miễn phí trước khi mua gói không?',
    a: 'Hoàn toàn có thể! Nexus Sports Lab dành tặng 01 buổi trải nghiệm miễn phí với HLV cá nhân và hướng dẫn sử dụng toàn bộ trang thiết bị. Bạn chỉ cần nhấn "Bắt đầu ngay" hoặc liên hệ Lễ tân.',
  },
  {
    q: 'Chính sách đặt lịch và hủy buổi học như thế nào?',
    a: 'Bạn có thể chủ động đặt lịch học trước tối đa 7 ngày thông qua hệ thống website hoặc app. Để đảm bảo chỗ cho các học viên khác, bạn có thể hủy trước giờ bắt đầu tối thiểu 2 tiếng mà không bị trừ buổi.',
  },
  {
    q: 'Gói tập có hỗ trợ bảo lưu khi tôi đi công tác hoặc có việc bận không?',
    a: 'Có. Tùy thuộc vào thời hạn của gói tập (3 tháng, 6 tháng, 12 tháng), trung tâm hỗ trợ bảo lưu miễn phí từ 15 đến 60 ngày. Mọi thủ tục đều có thể thao tác trực tiếp trên trang cá nhân.',
  },
  {
    q: 'Trung tâm có sẵn tủ khóa đồ và phòng tắm xông hơi không?',
    a: 'Tất cả các gói hội viên đều được cấp tủ đồ cá nhân với khóa từ thông minh RFID, phòng tắm nước nóng áp lực cao và phòng xông hơi đá muối Himalaya phục hồi sau giờ tập.',
  },
  {
    q: 'Tôi là người mới bắt đầu, có ai hướng dẫn tôi tập không?',
    a: 'Tại tất cả các phòng tập luôn có HLV trực sàn sẵn sàng hỗ trợ bạn làm quen máy móc, chỉnh sửa tư thế (form) chuẩn xác để phòng tránh chấn thương và đạt hiệu quả nhanh nhất.',
  },
];

// Testimonials
const testimonials = [
  {
    quote: 'Training at Nexus Sports Lab completely transformed my physique and mindset. The coaches are elite and the facilities are world-class.',
    name: 'Hoang Minh',
    title: 'Elite Member since 2024',
  },
  {
    quote: 'I\'ve tried many gyms, but the AI-driven insights and personalized programs here are on another level. Worth every penny.',
    name: 'Tran Mai Anh',
    title: 'Powerlifting Competitor',
  },
  {
    quote: 'The Combat & Defense class gave me confidence I never knew I had. The community here is incredibly supportive and focused.',
    name: 'Le Van Tuan',
    title: 'Fitness Enthusiast',
  },
  {
    quote: 'From the equipment to the environment, Nexus provides a premium experience that makes you want to push harder every single day.',
    name: 'Nguyen Thuy Linh',
    title: 'Yoga Practitioner',
  },
  {
    quote: 'The coaches don\'t just train you; they educate you on biomechanics and nutrition. It\'s a complete ecosystem for health.',
    name: 'Pham Quoc Huy',
    title: 'Marathon Runner',
  },
];

function getCourseSubject(course) {
  if (course?.subjectName && course.subjectName.trim()) {
    return course.subjectName.trim();
  }
  const name = (course?.className || '').toLowerCase();
  if (name.includes('spin') || name.includes('đạp xe') || name.includes('cycling')) return 'Đạp Xe Spinning';
  if (name.includes('yoga')) return 'Yoga';
  if (name.includes('zumba')) return 'Zumba Dance';
  if (name.includes('swim') || name.includes('bơi')) return 'Bơi Lội';
  if (name.includes('box') || name.includes('kickfit') || name.includes('combat')) return 'Boxing & Kickfit';
  if (name.includes('pilates')) return 'Pilates';
  return 'Thể Hình / Gym';
}

function levelText(band, isVi) {
  if (band === '1') return isVi ? 'Cơ bản' : 'Basic';
  if (band === '2') return isVi ? 'Nâng cao' : 'Advanced';
  if (band === '3') return isVi ? 'Chuyên sâu' : 'Intensive';
  return '';
}

function formatPatternText(pattern, isVi) {
  if (!pattern) return isVi ? 'Theo lịch lớp' : 'Scheduled';
  const dayMap = isVi
    ? { Mon: 'Thứ 2', Tue: 'Thứ 3', Wed: 'Thứ 4', Thu: 'Thứ 5', Fri: 'Thứ 6', Sat: 'Thứ 7', Sun: 'Chủ nhật' }
    : { Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun' };
  return pattern.split(',').map((d) => dayMap[d.trim()] || d.trim()).join(', ');
}

function formatCourseTiming(course, isVi) {
  const dateFmtLocale = isVi ? 'vi-VN' : 'en-GB';
  const nextObj = course?.nextSessionTime ? new Date(course.nextSessionTime) : null;
  const hasValidNext = nextObj && !isNaN(nextObj.getTime());
  const durationMin = Number(course?.durationMinutes) > 0 ? Number(course.durationMinutes) : 60;
  const endObj = hasValidNext ? new Date(nextObj.getTime() + durationMin * 60000) : null;
  const startClock = hasValidNext
    ? nextObj.toLocaleTimeString(dateFmtLocale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';
  const endClock = endObj
    ? endObj.toLocaleTimeString(dateFmtLocale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';

  return {
    timeStr: hasValidNext ? `${startClock} - ${endClock}` : '--:--',
    nextDateStr: hasValidNext
      ? nextObj.toLocaleDateString(dateFmtLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
      : (isVi ? 'Sắp khai giảng' : 'Upcoming'),
    patternText: formatPatternText(course?.schedulePattern, isVi),
  };
}

const GUEST_DAYS_OF_WEEK = [
  { id: 'ALL', vi: 'Tất cả', en: 'All' },
  { id: 'Mon', vi: 'Thứ 2', en: 'Mon' },
  { id: 'Tue', vi: 'Thứ 3', en: 'Tue' },
  { id: 'Wed', vi: 'Thứ 4', en: 'Wed' },
  { id: 'Thu', vi: 'Thứ 5', en: 'Thu' },
  { id: 'Fri', vi: 'Thứ 6', en: 'Fri' },
  { id: 'Sat', vi: 'Thứ 7', en: 'Sat' },
  { id: 'Sun', vi: 'Chủ nhật', en: 'Sun' },
];

const GUEST_TIME_SLOTS = [
  { id: 'MORNING', vi: 'Buổi sáng', en: 'Morning', timeRange: '06:00 - 12:00', icon: Sunrise },
  { id: 'AFTERNOON', vi: 'Buổi chiều', en: 'Afternoon', timeRange: '12:00 - 17:30', icon: Sun },
  { id: 'EVENING', vi: 'Buổi tối', en: 'Evening', timeRange: '17:30 - 22:00', icon: Sunset },
];

function checkMatchesDay(course, dayId) {
  if (!dayId || dayId === 'ALL') return true;
  const pattern = (course?.schedulePattern || '').toLowerCase();
  if (pattern.includes(dayId.toLowerCase())) return true;
  if (course?.nextSessionTime) {
    const d = new Date(course.nextSessionTime);
    if (!isNaN(d.getTime())) {
      const dayEn = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      if (dayEn.startsWith(dayId.toLowerCase().slice(0, 3))) return true;
    }
  }
  return false;
}

function getCourseDays(course) {
  const pattern = (course?.schedulePattern || '').toLowerCase();
  const dayTokens = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = [];
  for (const token of dayTokens) {
    if (pattern.includes(token.toLowerCase())) {
      days.push(token);
    }
  }
  if (days.length === 0 && course?.nextSessionTime) {
    const d = new Date(course.nextSessionTime);
    if (!isNaN(d.getTime())) {
      const en = d.toLocaleDateString('en-US', { weekday: 'short' });
      const matched = dayTokens.find((token) => en.toLowerCase().startsWith(token.toLowerCase()));
      if (matched) days.push(matched);
    }
  }
  return days;
}

function checkCourseMatchesDays(course, days, mode) {
  if (!days || days.length === 0) return true;
  if (mode === 'EXACT') {
    const courseDays = getCourseDays(course);
    if (courseDays.length === 0) {
      return days.some((d) => checkMatchesDay(course, d));
    }
    return courseDays.every((d) => days.includes(d));
  }
  return days.some((d) => checkMatchesDay(course, d));
}

function checkMatchesTimeSlot(course, slotId) {
  if (!slotId || slotId === 'ALL') return true;
  if (!course?.nextSessionTime) return false;
  const d = new Date(course.nextSessionTime);
  if (!isNaN(d.getTime())) {
    const hour = d.getHours() + d.getMinutes() / 60;
    if (slotId === 'MORNING') return hour >= 5 && hour < 12;
    if (slotId === 'AFTERNOON') return hour >= 12 && hour < 17.5;
    if (slotId === 'EVENING') return hour >= 17.5;
  }
  return false;
}

function parseGuestDateDetails(dateString, isVi) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { dayOfWeek: '--', day: '--', month: '--' };
  }
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dateFmtLocale = isVi ? 'vi-VN' : 'en-GB';

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const dayOfWeek = isToday
    ? (isVi ? 'Hôm nay' : 'Today')
    : isTomorrow
    ? (isVi ? 'Ngày mai' : 'Tomorrow')
    : d.toLocaleDateString(dateFmtLocale, { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString(dateFmtLocale, { month: 'short' });
  return { dayOfWeek, day, month };
}

function getSubjectFallbackImage(course) {
  const text = `${course?.subjectName || ''} ${course?.className || ''}`.toLowerCase();
  if (text.includes('bơi') || text.includes('swim')) return '/images/swimming-poster.jpg';
  if (text.includes('box') || text.includes('combat') || text.includes('kick')) return '/images/boxing-poster.jpg';
  if (text.includes('yoga') || text.includes('zumba') || text.includes('pilates')) return '/images/studio-poster.jpg';
  if (text.includes('spin') || text.includes('đạp xe') || text.includes('hiit')) return '/images/crossfit-poster.jpg';
  return '/images/gym-poster.jpg';
}

function getCourseCoverUrl(course) {
  const uploaded = resourceImageUrl(course?.imagePath);
  if (uploaded) return uploaded;
  return getSubjectFallbackImage(course);
}

function getCourseDescription(course) {
  return course?.subjectDescription?.trim() || '';
}

function getDefaultClasses() {
  const mkDate = (daysAhead, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  return [
    {
      classId: 901,
      subjectName: 'Thể Hình (Gym)',
      subjectDescription: 'Tập tạ tự do và máy móc hiện đại',
      className: '[GYM-101] Thể Hình & Sức Mạnh Nền Tảng',
      coachName: 'Nguyễn Văn Tuấn',
      roomName: 'Phòng Gym Tầng 1',
      price: 2400000,
      maxSlots: 20,
      bookedSlots: 14,
      totalSessions: 12,
      durationMinutes: 60,
      nextSessionTime: mkDate(3, 18, 0),
      lastSessionTime: mkDate(28, 19, 0),
      schedulePattern: 'Mon, Wed, Fri',
      upcomingDates: ['Buổi khai giảng — 18:00', 'Buổi 2 — 18:00', 'Buổi 3 — 18:00', 'Buổi 4 — 18:00'],
    },
    {
      classId: 902,
      subjectName: 'Yoga Căn Bản',
      subjectDescription: 'Yoga thư giãn và giãn cơ buổi sáng',
      className: '[YOGA-101] Yoga Phục Hồi & Cân Bằng Cột Sống',
      coachName: 'Trần Mai Anh',
      roomName: 'Phòng Yoga Tầng 2',
      price: 1800000,
      maxSlots: 25,
      bookedSlots: 19,
      totalSessions: 12,
      durationMinutes: 60,
      nextSessionTime: mkDate(2, 19, 0),
      lastSessionTime: mkDate(27, 20, 0),
      schedulePattern: 'Tue, Thu, Sat',
      upcomingDates: ['Buổi khai giảng — 19:00', 'Buổi 2 — 19:00', 'Buổi 3 — 19:00', 'Buổi 4 — 19:00'],
    },
    {
      classId: 903,
      subjectName: 'Bơi Lội',
      subjectDescription: 'Kỹ thuật bơi ếch, bơi sải chuyên nghiệp',
      className: '[SWIM-201] Bơi Lội Kỹ Thuật & Sức Bền Bốn Mùa',
      coachName: 'Phạm Minh Hoàng',
      roomName: 'Bể Bơi Bốn Mùa',
      price: 2800000,
      maxSlots: 15,
      bookedSlots: 13,
      totalSessions: 10,
      durationMinutes: 60,
      nextSessionTime: mkDate(4, 17, 30),
      lastSessionTime: mkDate(32, 18, 30),
      schedulePattern: 'Tue, Thu',
      upcomingDates: ['Buổi khai giảng — 17:30', 'Buổi 2 — 17:30', 'Buổi 3 — 17:30', 'Buổi 4 — 17:30'],
    },
  ];
}
