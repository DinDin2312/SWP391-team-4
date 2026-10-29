import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Activity, Shield, Sparkles, ChevronRight, Play, Star, MapPin, 
  CheckCircle2, User, X, Menu, Clock, Phone, Mail, ChevronDown, Waves, 
  Flame, Compass, HelpCircle, Search, Calendar, Check, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../../services/axiosClient';
import { AuroraBackground } from '../../../components/ui/aurora-background';
import { TypewriterEffectSmooth } from '../../../components/ui/typewriter-effect';
import ShinyText from '../../../components/ui/ShinyText';
import { CardBody, CardContainer, CardItem } from '../../../components/ui/3d-card';
import { InfiniteMovingCards } from '../../../components/ui/infinite-moving-cards';

const LandingPage = () => {
  const language = useLanguage();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [packageCategory, setPackageCategory] = useState('ALL');
  
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoadingPackages(true);

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

    axiosClient.get('/guest/schedules')
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setSchedules(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load guest schedules', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered packages by tab category
  const filteredPackages = useMemo(() => {
    if (!packages || packages.length === 0) return defaultPackages;
    // Hide 0 price trials from the primary public showcase grid to keep it premium
    const valid = packages.filter(p => (p.price || 0) > 0);
    if (packageCategory === 'ALL') return valid.slice(0, 6);
    if (packageCategory === 'GYM') {
      return valid.filter(p => p.packageType === 'GYM_ACCESS' && !p.packageName.toLowerCase().includes('bơi') && !p.packageName.toLowerCase().includes('combo')).slice(0, 6);
    }
    if (packageCategory === 'POOL_COMBO') {
      return valid.filter(p => p.packageName.toLowerCase().includes('bơi') || p.packageName.toLowerCase().includes('combo')).slice(0, 6);
    }
    if (packageCategory === 'AI') {
      return valid.filter(p => p.packageType === 'AI_ACCESS').slice(0, 6);
    }
    return valid.slice(0, 6);
  }, [packages, packageCategory]);

  // Filter schedules in modal
  const filteredSchedules = useMemo(() => {
    const source = schedules.slice(0, 45); // Limit initial view to 45 upcoming for peak performance
    if (!scheduleSearch.trim()) return source;
    const query = scheduleSearch.toLowerCase();
    return schedules.filter(
      (s) =>
        (s.className && s.className.toLowerCase().includes(query)) ||
        (s.coachName && s.coachName.toLowerCase().includes(query)) ||
        (s.roomName && s.roomName.toLowerCase().includes(query))
    ).slice(0, 50);
  }, [schedules, scheduleSearch]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Helper to provide realistic rich benefits if backend benefits list is empty
  const getPackagePerks = (pkg) => {
    if (Array.isArray(pkg.benefits) && pkg.benefits.length > 0) {
      return pkg.benefits;
    }
    const name = (pkg.packageName || '').toLowerCase();
    const type = pkg.packageType || '';

    if (type === 'AI_ACCESS' || name.includes('ai')) {
      return [
        'Trợ lý AI xây dựng giáo án tập luyện cá nhân 24/7',
        'Phân tích chỉ số cơ và nhịp tim qua từng buổi',
        'Gợi ý chế độ ăn thâm hụt / tăng cơ theo mục tiêu',
        `Thời hạn sử dụng ${pkg.durationDays} ngày linh hoạt`
      ];
    }
    if (name.includes('bơi')) {
      return [
        'Bể bơi 4 mùa nước ấm 25m điện phân muối khoáng',
        'Tự do bơi lội và thư giãn cơ sau giờ làm việc',
        'Miễn phí phòng xông hơi đá muối Sauna VIP',
        `Thời hạn sử dụng ${pkg.durationDays} ngày`
      ];
    }
    if (name.includes('combo')) {
      return [
        'Full quyền sử dụng sàn Gym Tầng 1 và Trợ lý AI',
        'Không giới hạn giờ xông hơi Sauna & Locker thông minh',
        'Đo chỉ số cơ thể InBody định kỳ hàng tuần',
        `Thời hạn sử dụng ${pkg.durationDays} ngày`
      ];
    }
    return [
      'Toàn quyền tập luyện sàn Gym Tầng 1 chuẩn Olympic',
      'Miễn phí tủ đồ RFID & phòng tắm nóng lạnh',
      'Được HLV trực sàn hướng dẫn kỹ thuật cơ bản',
      `Thời hạn sử dụng ${pkg.durationDays} ngày`
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
            <button 
              onClick={() => setShowSchedule(true)} 
              className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{t("Schedule")}</span>
            </button>
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
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSchedule(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600/10 hover:text-blue-400 text-left transition-colors"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>{t("Schedule")}</span>
                </button>
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
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060b17] via-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{item.floor}</span>
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-300">
                      {item.badge}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-blue-400 mb-1">
                        {item.category}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>{t("Capacity")}: <strong className="text-white">{item.capacity}</strong></span>
                      <button 
                        onClick={() => setShowSchedule(true)} 
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 group/link"
                      >
                        {t("View Schedule")}
                        <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Classes Section */}
      <motion.section 
        id="classes" 
        className="py-24 bg-[#060b17] scroll-mt-20"
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Flame className="w-3.5 h-3.5" />
                {t("Curated Programs")}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t("Premium Training Programs")}</h2>
              <p className="text-slate-400">{t("Discover our signature classes designed for maximum results.")}</p>
            </div>
            <button 
              onClick={() => setShowSchedule(true)} 
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 border border-slate-700 transition-colors shadow-lg"
            >
              <Calendar className="w-4 h-4" />
              <span>{t("View all schedule")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class Card 1 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#0a1122] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
                    alt="HIIT Endurance"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10 text-xs font-bold text-emerald-400">{t("Popular")}</div>
                  <Activity className="absolute bottom-4 left-4 w-10 h-10 text-white/70 group-hover/card:text-blue-400 transition-colors" />
                </CardItem>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardItem translateZ="60" className="text-xl font-bold text-white mb-1">{t("HIIT Endurance")}</CardItem>
                    <CardItem translateZ="40" className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4 text-blue-400" />{t("Coach Nguyen Van Tuan")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">
                  {t("High-intensity interval training designed to push your cardiovascular limits and build explosive power.")}
                </CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-semibold transition-all">
                    {t("Book Session")}
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* Class Card 2 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#0a1122] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
                    alt="Elite Powerlifting"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <Dumbbell className="absolute bottom-4 left-4 w-10 h-10 text-white/70 group-hover/card:text-blue-400 transition-colors" />
                </CardItem>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardItem translateZ="60" className="text-xl font-bold text-white mb-1">{t("Elite Powerlifting")}</CardItem>
                    <CardItem translateZ="40" className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4 text-blue-400" />{t("Coach Tran Mai Anh")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">
                  {t("Master the big three lifts with expert form correction and progressive overload programming.")}
                </CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-semibold transition-all">
                    {t("Book Session")}
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* Class Card 3 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#0a1122] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80"
                    alt="Combat & Defense"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <Shield className="absolute bottom-4 left-4 w-10 h-10 text-white/70 group-hover/card:text-blue-400 transition-colors" />
                </CardItem>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardItem translateZ="60" className="text-xl font-bold text-white mb-1">{t("Combat & Defense")}</CardItem>
                    <CardItem translateZ="40" className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4 text-blue-400" />{t("Coach Pham Minh Hoang")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">
                  {t("Learn practical self-defense mixed with intense conditioning and striking techniques.")}
                </CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-semibold transition-all">
                    {t("Book Session")}
                  </button>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>
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
                { id: 'POOL_COMBO', label: t('Bơi Lội & Combo') },
                { id: 'AI', label: t('Trợ Lý AI') },
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
                      <h3 className="text-2xl font-bold text-white mt-1 line-clamp-1">{pkg.packageName}</h3>
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
                          <span>{t(benefit)}</span>
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

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a1122] border border-slate-700 shadow-2xl shadow-blue-900/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 border-b border-slate-800 bg-[#0a1122] z-10 shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-500" />
                    {t("Weekly Class Schedule")}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t("Lịch học công khai cập nhật thời gian thực theo từng bộ môn và phòng tập.")}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t("Tìm lớp, HLV...")}
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button 
                    onClick={() => setShowSchedule(false)} 
                    aria-label={t("Close")}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="overflow-y-auto px-6 pb-6 custom-scrollbar relative">
                <table className="w-full text-left border-collapse text-slate-300">
                  <thead className="sticky top-0 bg-[#0a1122] z-20 shadow-md">
                    <tr className="border-b border-slate-700 text-blue-400 text-xs uppercase tracking-wider">
                      <th className="p-4 pt-6 font-bold">{t("Time & Day")}</th>
                      <th className="p-4 pt-6 font-bold">{t("Class & Coach")}</th>
                      <th className="p-4 pt-6 font-bold">{t("Room")}</th>
                      <th className="p-4 pt-6 font-bold">{t("Price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules.map((schedule) => {
                        const dateObj = new Date(schedule.startTime);
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dayStr = dateObj.toLocaleDateString(locale(), { weekday: 'long', month: 'numeric', day: 'numeric' });
                        return (
                          <tr key={schedule.scheduleId} className="border-b border-slate-800/50 hover:bg-blue-900/10 transition-colors group">
                            <td className="p-4 font-semibold text-white group-hover:text-blue-300">
                              {timeStr} <br/>
                              <span className="text-xs text-slate-500 font-normal">{dayStr}</span>
                            </td>
                            <td className="p-4 font-medium">
                              <span className="text-white font-bold">{schedule.className}</span><br/>
                              <span className="text-xs text-slate-400 font-normal">
                                {t("Coach")} {schedule.coachName}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 text-sm">
                              {schedule.roomName}
                            </td>
                            <td className="p-4 text-emerald-400 font-bold">
                              {(schedule.price || 0).toLocaleString('vi-VN')} {t("₫")}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl">
                          <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          {schedules.length === 0 
                            ? t("No schedules available right now.") 
                            : t("Không tìm thấy lớp học phù hợp với từ khóa.")
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
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
                <li><button onClick={() => setShowSchedule(true)} className="hover:text-blue-400 transition-colors">{t("Weekly Schedule")}</button></li>
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
      'Trợ lý AI xây dựng giáo án cá nhân hóa 24/7',
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
