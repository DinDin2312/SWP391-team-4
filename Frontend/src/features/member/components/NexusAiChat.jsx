import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, Minus, Mic, MicOff, Sparkles, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { renderChatMarkdown } from '../chatMarkdown.jsx';
import { normalizeChatResponse } from '../chatSources.js';
import { parseSseChunk, stripPartialActionTag } from '../chatStream.js';
import { CyberFoxAvatar } from '../../../components/CyberFoxMascot';

const NexusAiChat = ({ isOpen, onMinimize, onClose, openOrigin = 'fox' }) => {
  useLanguage();
  const [exitMode, setExitMode] = useState('fox');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: t('Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")') }
  ]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const DEFAULT_WIDTH = 390;
  const DEFAULT_HEIGHT = 560;
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const preMaximizeState = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, position: { x: 0, y: 0 } });
  const resizeDirection = useRef(null);
  const resizeStart = useRef({ x: 0, y: 0, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isChipsHovered, setIsChipsHovered] = useState(false);
  const [voiceLang, setVoiceLang] = useState(() => {
    try {
      return localStorage.getItem('nexus_voice_lang') || 'vi-VN';
    } catch {
      return 'vi-VN';
    }
  });

  const toggleVoiceLang = () => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
    const nextLang = voiceLang === 'vi-VN' ? 'en-US' : 'vi-VN';
    setVoiceLang(nextLang);
    try {
      localStorage.setItem('nexus_voice_lang', nextLang);
    } catch {}
  };
  
  const baseInputRef = useRef('');
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const recognitionRef = useRef(null);
  const chipsScrollRef = useRef(null);
  const isDraggingChips = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Khởi tạo và đồng bộ Web Speech API theo ngôn ngữ giọng nói đã chọn (mặc định vi-VN)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceLang;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            const prefix = baseInputRef.current ? baseInputRef.current.trim() + ' ' : '';
            setInput(prefix + currentTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: 'bot',
                text: voiceLang === 'vi-VN'
                  ? '⚠️ Bạn chưa cấp quyền Microphone cho trình duyệt. Vui lòng bấm vào biểu tượng trên thanh địa chỉ URL để cho phép truy cập Micro.'
                  : '⚠️ Microphone permission denied. Please allow microphone access in your browser address bar.'
              }
            ]);
          }
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
  }, [voiceLang]);

  // Infinite marquee conveyor loop for suggestion chips
  useEffect(() => {
    if (!isOpen) return;

    let animId;
    let cancelled = false;

    const startAnimation = () => {
      if (cancelled) return;
      const track = chipsScrollRef.current;
      if (!track) {
        animId = requestAnimationFrame(startAnimation);
        return;
      }

      if (track.scrollLeft === 0) {
        track.scrollLeft = 1;
      }

      const step = () => {
        if (cancelled) return;
        if (!isChipsHovered && !isLoading && chipsScrollRef.current && !isDraggingChips.current) {
          chipsScrollRef.current.scrollLeft += 0.55;
          const setWidth = chipsScrollRef.current.scrollWidth / 3;
          if (setWidth > 0 && chipsScrollRef.current.scrollLeft >= setWidth * 2) {
            chipsScrollRef.current.scrollLeft -= setWidth;
          }
        }
        animId = requestAnimationFrame(step);
      };

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(startAnimation);

    return () => {
      cancelled = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, isChipsHovered, isLoading]);

  const handleChipsWheel = (e) => {
    const track = chipsScrollRef.current;
    if (!track || e.deltaY === 0) return;
    track.scrollLeft += e.deltaY * 0.75;
    const setWidth = track.scrollWidth / 3;
    if (setWidth > 0) {
      if (track.scrollLeft >= setWidth * 2) {
        track.scrollLeft -= setWidth;
      } else if (track.scrollLeft <= 0) {
        track.scrollLeft += setWidth;
      }
    }
  };

  const handleChipsMouseDown = (e) => {
    isDraggingChips.current = true;
    dragStartX.current = e.pageX - (chipsScrollRef.current?.offsetLeft || 0);
    scrollStartX.current = chipsScrollRef.current?.scrollLeft || 0;
  };

  const handleChipsMouseMove = (e) => {
    if (!isDraggingChips.current || !chipsScrollRef.current) return;
    const x = e.pageX - chipsScrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.2;
    chipsScrollRef.current.scrollLeft = scrollStartX.current - walk;
    const setWidth = chipsScrollRef.current.scrollWidth / 3;
    if (setWidth > 0) {
      if (chipsScrollRef.current.scrollLeft >= setWidth * 2) {
        chipsScrollRef.current.scrollLeft -= setWidth;
      } else if (chipsScrollRef.current.scrollLeft <= 0) {
        chipsScrollRef.current.scrollLeft += setWidth;
      }
    }
  };

  const handleChipsMouseUp = () => {
    isDraggingChips.current = false;
  };

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
        baseInputRef.current = input;
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const nextX = e.clientX - offset.current.x;
    const nextY = e.clientY - offset.current.y;
    const maxLeft = -(window.innerWidth - 160);
    const maxRight = 16;
    const maxUp = -68;
    const maxDown = Math.max(0, window.innerHeight - 160);
    setPosition({
      x: Math.min(maxRight, Math.max(maxLeft, nextX)),
      y: Math.min(maxDown, Math.max(maxUp, nextY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMinimizeClick = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    setExitMode('fox');
    if (onMinimize) {
      onMinimize();
    } else if (onClose) {
      onClose();
    }
  };

  const handleCloseSessionClick = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    setExitMode('topbar');
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
    setMessages([
      { id: 1, sender: "bot", text: t("Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. \"I want to lose 5kg\", \"Which yoga class is good?\")") }
    ]);
    setPosition({ x: 0, y: 0 });
    if (onClose) {
      onClose();
    }
  };

  const handleToggleMaximize = (e) => {
    e.stopPropagation();
    setIsDragging(false);
    if (isMaximized) {
      setSize({ width: preMaximizeState.current.width, height: preMaximizeState.current.height });
      setPosition(preMaximizeState.current.position);
      setIsMaximized(false);
    } else {
      preMaximizeState.current = { width: size.width, height: size.height, position: { ...position } };
      const maxWidth = Math.min(840, window.innerWidth - 48);
      const maxHeight = Math.min(850, window.innerHeight - 100);
      setSize({ width: maxWidth, height: maxHeight });
      setIsMaximized(true);
    }
  };

  const handleResizeStart = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsResizing(true);
    resizeDirection.current = direction;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
    if (isMaximized) setIsMaximized(false);
  };

  const handleResizeMove = (e) => {
    if (!resizeDirection.current) return;
    const dir = resizeDirection.current;
    const { x: startX, y: startY, width: startWidth, height: startHeight } = resizeStart.current;

    const minWidth = 320;
    const maxWidth = Math.min(window.innerWidth - 32, 920);
    const minHeight = 420;
    const maxHeight = Math.min(window.innerHeight - 90, 900);

    let nextWidth = startWidth;
    let nextHeight = startHeight;

    if (dir.includes('left')) {
      const deltaX = startX - e.clientX;
      nextWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
    }
    if (dir.includes('bottom')) {
      const deltaY = e.clientY - startY;
      nextHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
    }

    setSize({ width: nextWidth, height: nextHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    resizeDirection.current = null;
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    } else {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

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
          } else if (typeof rawErr === 'string' && (rawErr.toLowerCase().includes('conflict') || rawErr.toLowerCase().includes('overlaps') || rawErr.toLowerCase().includes('trùng'))) {
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

    const botMsgId = Date.now() + 1;
    const token = localStorage.getItem('token');
    const history = messages
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    let streamedAnyChunk = false;
    let accumulatedText = '';

    try {
      const response = await fetch('http://localhost:8080/api/v1/member/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ message: userMsg.text, history })
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream request not ok: ' + response.status);
      }

      setMessages((prev) => [...prev, { id: botMsgId, sender: 'bot', text: '', isStreaming: true }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let donePayload = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(streamBuffer);
        streamBuffer = parsed.rest;

        for (const evt of parsed.events) {
          if (evt.event === 'delta') {
            streamedAnyChunk = true;
            accumulatedText += evt.data;
            const visibleText = stripPartialActionTag(accumulatedText);
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: visibleText } : m))
            );
          } else if (evt.event === 'done') {
            try {
              donePayload = JSON.parse(evt.data);
            } catch {}
          }
        }
      }

      const fullText = (donePayload && donePayload.fullText) || accumulatedText;
      const sources = (donePayload && donePayload.sources) || [];

      let cleanedText = fullText;
      const actionMatches = [...fullText.matchAll(/\[ACTION:(.*?)\]/g)];
      if (actionMatches.length > 0) {
        cleanedText = fullText.replace(/\[ACTION:(.*?)\]/g, '').trim();
        const hasCartAction = actionMatches.some((m) =>
          /^(ADD_CART|BOOK_CLASS):/i.test(m[1].trim())
        );
        for (const match of actionMatches) {
          await executeAction(match[1], hasCartAction);
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, text: cleanedText, sources, isStreaming: false } : m
        )
      );
    } catch (streamErr) {
      console.warn('Streaming failed, falling back to REST endpoint:', streamErr);

      if (!streamedAnyChunk) {
        try {
          const res = await axios.post(
            'http://localhost:8080/api/v1/member/ai/chat',
            { message: userMsg.text, history },
            { headers: { Authorization: 'Bearer ' + token } }
          );

          const normalized = normalizeChatResponse(res.data);
          let rawText = normalized.text;
          const sources = normalized.sources;
          const actionMatches = [...rawText.matchAll(/\[ACTION:(.*?)\]/g)];

          if (actionMatches.length > 0) {
            rawText = rawText.replace(/\[ACTION:(.*?)\]/g, '').trim();
            const hasCartAction = actionMatches.some((m) =>
              /^(ADD_CART|BOOK_CLASS):/i.test(m[1].trim())
            );
            for (const match of actionMatches) {
              await executeAction(match[1], hasCartAction);
            }
          }

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === botMsgId);
            if (exists) {
              return prev.map((m) =>
                m.id === botMsgId ? { ...m, text: rawText, sources, isStreaming: false } : m
              );
            }
            return [...prev, { id: botMsgId, sender: 'bot', text: rawText, sources }];
          });
        } catch {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== botMsgId),
            {
              id: botMsgId,
              sender: 'bot',
              text: t('Sorry, the AI system is currently busy. Please try again later.')
            }
          ]);
        }
      } else {
        const cleanedText = stripPartialActionTag(accumulatedText);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, text: cleanedText, isStreaming: false } : m
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed z-[9999] pointer-events-none" 
          style={{ top: "80px", right: "24px", transform: `translate(${position.x}px, ${position.y}px)` }}
        >
          <motion.div 
            initial={
              openOrigin === 'topbar'
                ? { opacity: 0, x: -60 - position.x, y: -45 - position.y, scale: 0.35 }
                : { opacity: 0, x: 110 - position.x, y: 360 - position.y, scale: 0.2 }
            }
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={
              exitMode === 'topbar'
                ? { opacity: 0, x: -85 - position.x, y: -60 - position.y, scale: 0.14 }
                : { opacity: 0, x: 110 - position.x, y: 360 - position.y, scale: 0.18 }
            }
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className={`pointer-events-auto flex flex-col bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden relative ${
              isResizing ? 'select-none' : ''
            }`}
            style={{
              width: `${size.width}px`,
              height: `${size.height}px`,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 90px)'
            }}
          >
            {/* HEADER */}
            <div 
              ref={dragRef}
              onMouseDown={handleMouseDown}
              className="bg-gradient-to-r from-[#0071E3] via-blue-700 to-indigo-800 p-3.5 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-cyan-400/50 flex items-center justify-center backdrop-blur-md shadow-inner">
                  <CyberFoxAvatar direction="DIRECT_HOVER" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{t("NEXUS AI")}</h3>
                  <p className="text-[10px] text-cyan-200 font-medium">{t("Agentic Assistant")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleMinimizeClick}
                  className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors cursor-pointer"
                  title={t("Minimize (Keep history)")}
                  aria-label={t("Minimize (Keep history)")}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleToggleMaximize}
                  className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors cursor-pointer"
                  title={isMaximized ? t("Restore size") : t("Maximize")}
                  aria-label={isMaximized ? t("Restore size") : t("Maximize")}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleCloseSessionClick}
                  className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors cursor-pointer"
                  title={t("Close (Clear history)")}
                  aria-label={t("Close (Clear history)")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--surface)] custom-scrollbar relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.sender === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-slate-900 border border-cyan-400/50'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <CyberFoxAvatar direction="DIRECT_HOVER" className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <div className={`p-3 text-[13.5px] leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-[var(--primary)] text-white rounded-2xl rounded-tr-sm whitespace-pre-wrap'
                          : 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.sender === 'user' ? msg.text : renderChatMarkdown(msg.text)}
                        {msg.isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-500 animate-pulse align-middle" />}
                      </div>

                      {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pl-1">
                          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-500" />
                            {t("Nguồn tham khảo")}:
                          </span>
                          {msg.sources.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            >
                              [{s.index}] {s.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* TYPING INDICATOR */}
              {isLoading && !messages.some((m) => m.isStreaming) && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-slate-900 border border-cyan-400/50 shadow-sm">
                      <CyberFoxAvatar direction="DIRECT_HOVER" className="w-6 h-6 animate-pulse" />
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

            {/* QUICK SUGGESTION CHIPS (INFINITE CONVEYOR) */}
            <div className="px-2.5 py-1.5 border-t border-[var(--border)] bg-[var(--surface-hover)]/30 flex items-center gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] pl-1 select-none shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                <span className="hidden sm:inline">{t("Suggestions")}:</span>
              </div>

              <div 
                ref={chipsScrollRef}
                onMouseEnter={() => setIsChipsHovered(true)}
                onMouseLeave={() => {
                  setIsChipsHovered(false);
                  handleChipsMouseUp();
                }}
                onWheel={handleChipsWheel}
                onMouseDown={handleChipsMouseDown}
                onMouseMove={handleChipsMouseMove}
                onMouseUp={handleChipsMouseUp}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
                }}
                className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 whitespace-nowrap [&::-webkit-scrollbar]:hidden select-none cursor-grab active:cursor-grabbing py-0.5"
              >
                {[0, 1, 2].map((copyIdx) => (
                  <div key={copyIdx} className="flex items-center gap-1.5 shrink-0">
                    {quickChips.map((chip, idx) => (
                      <button
                        key={`${copyIdx}-${idx}`}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSend(chip.prompt)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border border-[var(--border)] hover:border-transparent transition-all shrink-0 shadow-2xs disabled:opacity-50 active:scale-95 cursor-pointer font-medium hover:shadow-xs"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* INPUT AREA */}
            <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)]">
              <div className="relative flex items-center shadow-sm rounded-xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    isListening
                      ? (voiceLang === 'vi-VN' ? "🎙️ Đang nghe tiếng Việt... Hãy nói..." : "🎙️ Listening (English)... Speak now...")
                      : t("Ask about workouts, packages, gym services...")
                  }
                  disabled={isLoading}
                  className={`w-full bg-[var(--surface)] text-[var(--text)] text-sm rounded-xl pl-4 pr-24 py-3 border ${
                    isListening ? 'border-red-500 ring-2 ring-red-400/40 animate-pulse' : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
                  } outline-none transition-all placeholder-[var(--text-muted)] disabled:opacity-50 disabled:bg-[var(--surface-hover)]`}
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleVoiceLang}
                    className="px-1.5 py-1 text-[10px] font-bold rounded-md bg-[var(--surface-hover)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] transition-colors border border-[var(--border)] cursor-pointer select-none"
                    title={voiceLang === 'vi-VN' ? "Giọng nói: Tiếng Việt (Bấm để đổi sang Tiếng Anh)" : "Voice: English (Click to switch to Vietnamese)"}
                    aria-label="Toggle voice language"
                  >
                    {voiceLang === 'vi-VN' ? 'VI' : 'EN'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                        : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-hover)]'
                    }`}
                    title={isListening ? t("Stop listening") : (voiceLang === 'vi-VN' ? "Nói tiếng Việt" : t("Voice input"))}
                    aria-label={isListening ? t("Stop listening") : t("Voice input")}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-1.5 bg-[var(--primary)] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[var(--primary)] transition-colors cursor-pointer"
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

            {/* RESIZE HANDLERS */}
            <div
              onMouseDown={(e) => handleResizeStart('left', e)}
              className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-cyan-500/25 active:bg-cyan-500/40 z-30 transition-colors"
              title={t("Drag left border to resize width")}
            />
            <div
              onMouseDown={(e) => handleResizeStart('bottom', e)}
              className="absolute left-0 right-0 bottom-0 h-2.5 cursor-ns-resize hover:bg-cyan-500/25 active:bg-cyan-500/40 z-30 transition-colors"
              title={t("Drag bottom border to resize height")}
            />
            <div
              onMouseDown={(e) => handleResizeStart('bottom-left', e)}
              className="absolute left-0 bottom-0 w-6 h-6 cursor-nesw-resize z-40 flex items-end justify-start p-1.5 group select-none"
              title={t("Drag corner to resize")}
            >
              <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-slate-400 dark:border-slate-500 group-hover:border-cyan-400 group-hover:scale-110 rounded-bl-xs transition-all" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NexusAiChat;
