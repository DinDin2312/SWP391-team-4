import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Activity, Shield, Sparkles, ChevronRight, Play, Star, MapPin, CheckCircle2, User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraBackground } from '../../../components/ui/aurora-background';
import { TypewriterEffectSmooth } from '../../../components/ui/typewriter-effect';
import ShinyText from '../../../components/ui/ShinyText';
import { CardBody, CardContainer, CardItem } from '../../../components/ui/3d-card';
import { InfiniteMovingCards } from '../../../components/ui/infinite-moving-cards';

const LandingPage = () => {
  const language = useLanguage();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch real data from backend
    fetch('http://localhost:8080/api/guest/packages')
      .then(res => res.json())
      .then(data => setPackages(data))
      .catch(err => console.error('Failed to load packages', err));

    fetch('http://localhost:8080/api/guest/schedules')
      .then(res => res.json())
      .then(data => setSchedules(data))
      .catch(err => console.error('Failed to load schedules', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-200 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#060b17]/90 backdrop-blur-md border-b border-slate-800 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
              <Dumbbell className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">{t("NEXUS")}<span className="text-blue-500">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">{t("Features")}</a>
            <a href="#classes" className="hover:text-white transition-colors">{t("Classes")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("Pricing")}</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">{t("Log in")}</button>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">{t("Get Started")}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AuroraBackground className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-[#060b17]">
        <motion.div 
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="max-w-7xl mx-auto px-6 relative z-10 w-full"
        >
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mx-auto">
              <Sparkles className="w-4 h-4" />
              <ShinyText text={t("Premium Sports & Fitness Laboratory")} speed={3} className="tracking-wider" />
            </div>
            
            <TypewriterEffectSmooth 
              words={[
                { text: t("Elevate") },
                { text: t("Your") },
                { text: t("Physical") },
                { text: t("Potential."), className: "text-blue-500 dark:text-blue-500" },
              ]} 
            />
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">{t("Nexus Sports Lab provides world-class coaching, elite facilities, and data-driven training programs to help you achieve your ultimate fitness goals.")}</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105">{t("Join the Elite Now")}<ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => document.getElementById('classes').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#111d38] hover:bg-[#1a2947] text-white font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all">
                <Play className="w-5 h-5" />{t("Explore Classes")}</button>
            </div>
            
            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-slate-500 font-semibold text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{t("50+ Expert Coaches")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{t("Modern Equipment")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>{t("AI-Powered Insights")}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0a1122] border border-slate-700 shadow-2xl shadow-blue-900/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
          >
            {/* Modal Header (Sticky) */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0a1122] z-10 shrink-0">
              <h3 className="text-2xl font-black text-white tracking-tight">{t("Weekly Class Schedule")}</h3>
              <button onClick={() => setShowSchedule(false)} className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto px-6 pb-6 custom-scrollbar relative">
              <table className="w-full text-left border-collapse text-slate-300">
                <thead className="sticky top-0 bg-[#0a1122] z-20 shadow-md">
                  <tr className="border-b border-slate-700 text-blue-400">
                    <th className="p-4 pt-6 font-bold">{t("Time & Day")}</th>
                    <th className="p-4 pt-6 font-bold">{t("Class & Coach")}</th>
                    <th className="p-4 pt-6 font-bold">{t("Room")}</th>
                    <th className="p-4 pt-6 font-bold">{t("Price")}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length > 0 ? (
                    schedules.map((schedule) => {
                      const dateObj = new Date(schedule.startTime);
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dayStr = dateObj.toLocaleDateString(locale(), { weekday: 'long' });
                      return (
                        <tr key={schedule.scheduleId} className="border-b border-slate-800/50 hover:bg-blue-900/10 transition-colors group">
                          <td className="p-4 font-semibold text-white group-hover:text-blue-300">{timeStr} <br/><span className="text-xs text-slate-500 font-normal">{dayStr}</span></td>
                          <td className="p-4 font-medium">{schedule.className}<br/><span className="text-xs text-slate-400 font-normal">{t("Coach")}{' '}{schedule.coachName}</span></td>
                          <td className="p-4 text-slate-400">{schedule.roomName}</td>
                          <td className="p-4 text-emerald-400 font-bold">{schedule.price.toLocaleString('vi-VN')}{' '}{t("₫")}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl">
                        <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-20" />{t("No schedules available right now.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Featured Classes */}
      <motion.section id="classes" className="py-24 bg-[#0a1122]" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">{t("Premium Training Programs")}</h2>
              <p className="text-slate-400">{t("Discover our signature classes designed for maximum results.")}</p>
            </div>
            <button onClick={() => setShowSchedule(true)} className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group">{t("View all schedule")}<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class Card 1 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#060b17] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
                    alt="HIIT Endurance"
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
                      <User className="w-4 h-4" />{t("Coach Tun")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">{t("High-intensity interval training designed to push your cardiovascular limits and build explosive power.")}</CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-[#111d38] hover:bg-blue-600 text-white font-semibold transition-colors">{t("Book Session")}</button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* Class Card 2 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#060b17] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
                    alt="Elite Powerlifting"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <Dumbbell className="absolute bottom-4 left-4 w-10 h-10 text-white/70 group-hover/card:text-blue-400 transition-colors" />
                </CardItem>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardItem translateZ="60" className="text-xl font-bold text-white mb-1">{t("Elite Powerlifting")}</CardItem>
                    <CardItem translateZ="40" className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4" />{t("Coach Mai Anh")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">{t("Master the big three lifts with expert form correction and progressive overload programming.")}</CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-[#111d38] hover:bg-blue-600 text-white font-semibold transition-colors">{t("Book Session")}</button>
                </CardItem>
              </CardBody>
            </CardContainer>

            {/* Class Card 3 */}
            <CardContainer className="inter-var w-full">
              <CardBody className="bg-[#060b17] relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-800 border w-full h-auto rounded-3xl p-6 transition-colors">
                <CardItem translateZ="50" className="w-full h-48 relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80"
                    alt="Combat & Defense"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <Shield className="absolute bottom-4 left-4 w-10 h-10 text-white/70 group-hover/card:text-blue-400 transition-colors" />
                </CardItem>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardItem translateZ="60" className="text-xl font-bold text-white mb-1">{t("Combat & Defense")}</CardItem>
                    <CardItem translateZ="40" className="flex items-center gap-2 text-sm text-slate-400">
                      <User className="w-4 h-4" />{t("Coach Hong")}</CardItem>
                  </div>
                </div>
                <CardItem translateZ="30" as="p" className="text-sm text-slate-400 mb-6 line-clamp-2">{t("Learn practical self-defense mixed with intense conditioning and striking techniques.")}</CardItem>
                <CardItem translateZ="20" className="w-full">
                  <button onClick={() => navigate('/login')} className="w-full py-3 rounded-xl bg-[#111d38] hover:bg-blue-600 text-white font-semibold transition-colors">{t("Book Session")}</button>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section className="py-20 bg-[#060b17] overflow-hidden flex flex-col items-center justify-center" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
        <h2 className="text-3xl font-bold text-white mb-10 text-center">{t("What Our Athletes Say")}</h2>
        <InfiniteMovingCards
          key={language}
          items={testimonials.map(item => ({ ...item, quote: t(item.quote), title: t(item.title) }))}
          direction="right"
          speed="slow"
        />
      </motion.section>

      {/* Pricing / Packages CTA */}
      <motion.section id="pricing" className="py-24 bg-[#0a1122]" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6"><ShinyText text={t("Membership Packages")} speed={3} /></h2>
            <p className="text-slate-400 text-lg">{t("Choose the perfect plan to unlock your potential. No hidden fees.")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.length > 0 ? (
              packages.map((pkg, idx) => (
                <div key={pkg.packageId} className={`bg-[#060b17] border border-slate-800 rounded-3xl p-8 flex flex-col hover:-translate-y-6 hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-105 hover:border-blue-500/50 transition-all duration-500 cursor-pointer ${idx === 1 ? t('bg-gradient-to-b from-blue-900/40 to-[#060b17] border-blue-500 shadow-2xl shadow-blue-500/20 relative transform md:-translate-y-4 hover:-translate-y-10 hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)]') : t('')}`}>
                  {idx === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">{t("MOST POPULAR")}</div>}
                  <h3 className="text-xl font-bold text-white mb-2">{pkg.packageName}</h3>
                  <div className="text-3xl font-black text-blue-400 mb-6">{pkg.price.toLocaleString('vi-VN')}{' '}{t("₫")}<span className="text-sm font-normal text-slate-500">/ {pkg.durationDays}{' '}{t("days")}</span></div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> {t(pkg.description || 'Access to premium gym facilities')}</li>
                    <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/>{t("Valid for")}{' '}{pkg.durationDays}{' '}{t("days")}</li>
                    <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/>{t("Type:")}{' '}{codeLabel(pkg.packageType)}</li>
                  </ul>
                  <button onClick={() => navigate('/register')} className={`w-full py-3 rounded-xl font-semibold transition-colors ${idx === 1 ? t('bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/30') : t('bg-[#111d38] hover:bg-blue-600 text-white')}`}>{t("Get")}{' '}{pkg.packageName}</button>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-slate-500 py-12">{t("Loading membership packages...")}</div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#040812] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white tracking-tight">{t("NEXUS SPORTS LAB")}</span>
          </div>
          <p className="text-slate-500 text-sm">{t("2026 Nexus Sports Lab. All rights reserved.")}</p>
          <div className="flex gap-4 text-slate-400">
            <MapPin className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <Star className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};

// Need to import User from lucide-react, redefining at top level is not ideal, but we'll add it.
// React and User are imported.
export default LandingPage;

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

