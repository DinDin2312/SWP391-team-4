import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Minus, Mic, MicOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NexusAiChat = ({ isOpen, onClose }) => {
  const lang = useLanguage();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: t('Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")') }
  ]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Khởi tạo và đồng bộ Web Speech API theo ngôn ngữ hiện tại
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInput((prev) => (prev ? prev.trim() + ' ' + transcript : transcript));
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t('Your browser does not support voice recognition. Please use Google Chrome or Edge.'));
      return;
    }

    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const quickChips = [
    { label: t("🏊 Book Swim Class"), prompt: t("Book me the nearest swimming class") },
    { label: t("📅 My Schedule"), prompt: t("View my workout schedule") },
    { label: t("💪 Workout Advice"), prompt: t("Suggest a workout routine for today") },
    { label: t("💳 View Packages"), prompt: t("Recommend suitable membership packages") },
    { label: t("🛒 View Cart"), prompt: t("Open my shopping cart") },
  ];

  const triggerCartGlow = () => {
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new CustomEvent('aiCartHighlight'));
  };

  const executeAction = async (actionStr, suppressNavigate = false) => {
    const parts = actionStr.split(':');
    if (parts.length < 2) return;
    const type = parts[0].trim();
    const target = parts.slice(1).join(':').trim();

    try {
      const token = localStorage.getItem('token');
      if (type === 'NAVIGATE') {
        if (!suppressNavigate) {
          navigate(target);
        }
      } else if (type === 'ADD_CART') {
        const pkgId = Number(String(target).replace(/\D+/g, ''));
        if (!pkgId) return;
        try {
          await axios.post('http://localhost:8080/api/v1/member/add-package-to-cart/' + pkgId, {}, {
            headers: { Authorization: "Bearer " + token }
          });
          triggerCartGlow();
        } catch (apiErr) {
          console.warn('Package may already be in cart:', apiErr);
          const rawErr = apiErr.response?.data?.message || apiErr.response?.data || '';
          let errText = t('Unable to add package to cart.');
          if (typeof rawErr === 'string' && (rawErr.includes('already') || rawErr.includes('in your cart'))) {
            errText = t('This package is already in your cart.');
          } else if (rawErr) {
            errText = String(rawErr);
          }
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: `⚠️ ${errText}` }
          ]);
        }
      } else if (type === 'BOOK_CLASS') {
        const clsId = Number(String(target).replace(/\D+/g, ''));
        if (!clsId) return;
        try {
          await axios.post('http://localhost:8080/api/v1/member/book-class/' + clsId, {}, {
            headers: { Authorization: "Bearer " + token }
          });
          triggerCartGlow();
        } catch (apiErr) {
          console.warn('Class booking action warning:', apiErr);
          const rawErr = apiErr.response?.data?.message || apiErr.response?.data || '';
          let errText = t('Unable to add class to cart.');
          if (typeof rawErr === 'string' && rawErr.includes('already booked')) {
            errText = t('You have already enrolled in this course.');
          } else if (typeof rawErr === 'string' && rawErr.includes('already in your cart')) {
            errText = t('This course is already in your cart.');
          } else if (typeof rawErr === 'string' && rawErr.includes('conflict')) {
            errText = t('Schedule conflict with another enrolled session.');
          } else if (rawErr) {
            errText = String(rawErr);
          }
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: 'bot', text: `⚠️ ${errText}` }
          ]);
        }
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleSend = async (overrideText = null) => {
    const textToSend = (overrideText !== null ? overrideText : input).trim();
    if (!textToSend || isLoading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/v1/member/ai/chat', { message: userMsg.text }, {
        headers: { Authorization: "Bearer " + token }
      });

      let rawText = typeof res.data === 'string' ? res.data : String(res.data || '');
      const actionMatches = [...rawText.matchAll(/\[ACTION:(.*?)\]/g)];

      if (actionMatches.length > 0) {
        rawText = rawText.replace(/\[ACTION:(.*?)\]/g, '').trim();
        const hasCartAction = actionMatches.some(m =>
          /^(ADD_CART|BOOK_CLASS):/i.test(m[1].trim())
        );
        for (const match of actionMatches) {
          await executeAction(match[1], hasCartAction);
        }
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: rawText }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: t('Sorry, the AI system is currently busy. Please try again later.') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed z-[9999]" 
          style={{ top: "80px", right: "24px", transform: `translate(${position.x}px, ${position.y}px)` }}
        >
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex flex-col bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden w-[340px] sm:w-[390px]"
            style={{ height: "540px" }}
          >
            {/* HEADER */}
            <div 
              ref={dragRef}
              onMouseDown={handleMouseDown}
              className="bg-[var(--primary)] p-3.5 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{t("NEXUS AI")}</h3>
                  <p className="text-[10px] text-blue-100 font-medium">{t("Agentic Assistant")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={onClose} className="p-1.5 text-blue-100 hover:text-white transition-colors" title={t("Minimize (Keep history)")} aria-label={t("Minimize (Keep history)")}>
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  setMessages([{ id: 1, sender: "bot", text: t("Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. \"I want to lose 5kg\", \"Which yoga class is good?\")") }]);
                  onClose();
                }} className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors" title={t("Close (Clear history)")} aria-label={t("Close (Clear history)")}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--surface)] custom-scrollbar relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.sender === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border border-blue-100'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[var(--primary)] text-white rounded-2xl rounded-tr-sm'
                        : 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] rounded-2xl rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* TYPING INDICATOR */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <Bot className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="p-4 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK SUGGESTION CHIPS */}
            <div 
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="px-3 py-2 border-t border-[var(--border)] bg-[var(--surface-hover)]/30 overflow-x-auto no-scrollbar flex items-center gap-1.5 whitespace-nowrap [&::-webkit-scrollbar]:hidden select-none"
            >
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] pl-0.5 select-none flex-shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {t("Suggestions")}:
              </span>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSend(chip.prompt)}
                  className="text-[11.5px] px-2.5 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border border-[var(--border)] transition-all flex-shrink-0 shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer font-medium"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* INPUT AREA */}
            <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)]">
              <div className="relative flex items-center shadow-sm rounded-xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? t("Listening... Speak now...") : t("Ask about workouts, packages, gym services...")}
                  disabled={isLoading}
                  className={`w-full bg-[var(--surface)] text-[var(--text)] text-sm rounded-xl pl-4 pr-20 py-3 border ${
                    isListening ? 'border-red-500 ring-2 ring-red-400/40 animate-pulse' : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
                  } outline-none transition-all placeholder-[var(--text-muted)] disabled:opacity-50 disabled:bg-[var(--surface-hover)]`}
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                        : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                    title={isListening ? t("Stop listening") : t("Voice input")}
                    aria-label={isListening ? t("Stop listening") : t("Voice input")}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-1.5 bg-[var(--primary)] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[var(--primary)] transition-colors"
                    title={t("Send message")}
                    aria-label={t("Send message")}
                  >
                    <Send className={isLoading ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
                  </button>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{t("NEXUS AI can make mistakes. Verify before buying.")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NexusAiChat;
