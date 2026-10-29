import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Minus, Sparkles, Dumbbell, Calendar, CheckCircle2, ArrowRight, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const SUGGESTIONS = [
  "Lên 1 buổi tập ngực & tay sau hôm nay",
  "Lập giáo án 4 tuần tăng cơ bắp",
  "Gợi ý bài tập cho học viên đau lưng dưới",
  "Phân tích thể trạng và nhận xét học viên"
];

const CoachNexusAiChat = ({ isOpen, onClose }) => {
  const lang = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: t('Xin chào Coach! Mình là NEXUS COACH AI - trợ lý chuyên môn của bạn. Hãy nói cho mình biết bạn muốn giao bài tập gì, cho học viên nào, hoặc cần tư vấn kế hoạch huấn luyện theo thể trạng nhé! 💪')
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
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

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const recognitionRef = useRef(null);
  const baseInputRef = useRef('');
  const navigate = useNavigate();
  const location = useLocation();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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


  // Web Speech API: Voice Recognition (Mic) & Speech Synthesis (Loa đọc)
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
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceLang]);

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

  const toggleSpeak = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      alert(t('Your browser does not support text-to-speech.'));
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[ACTION:[\s\S]*?\]/g, '').replace(/[#*`_~]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
    onClose();
  };

  const dispatchCoachAction = (payload) => {
    sessionStorage.setItem('coach_ai_workout_prefill', JSON.stringify({
      ...payload,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new CustomEvent('coachAiPrefillWorkout', { detail: payload }));
  };

  const extractActionPayload = (text) => {
    if (!text) return null;
    const startIdx = text.indexOf('[ACTION:');
    if (startIdx === -1) return null;

    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === '[') {
        depth++;
      } else if (text[i] === ']') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx === -1) {
      endIdx = text.lastIndexOf(']');
    }

    if (endIdx > startIdx + 8) {
      const fullAction = text.substring(startIdx + 8, endIdx).trim();
      const colonIdx = fullAction.indexOf(':');
      if (colonIdx !== -1) {
        const type = fullAction.substring(0, colonIdx).trim();
        const rawJson = fullAction.substring(colonIdx + 1).trim();
        return {
          type,
          rawJson,
          cleanText: (text.substring(0, startIdx) + text.substring(endIdx + 1)).trim()
        };
      }
    }
    return null;
  };

  const handleGoToWorkoutForm = (actionType, actionData) => {
    if (actionType && actionData) {
      dispatchCoachAction({
        actionType,
        data: actionData
      });
    }
    if (location.pathname !== '/coach/workouts') {
      navigate('/coach/workouts');
    }
    setTimeout(() => {
      const targetId = actionType === 'PREFILL_TRAINING_PLAN' ? 'training-plan-form' : 'single-workout-form';
      const formEl = document.getElementById(targetId);
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        formEl.classList.add('ring-4', 'ring-amber-500/50', 'transition-all', 'duration-700');
        setTimeout(() => {
          formEl.classList.remove('ring-4', 'ring-amber-500/50');
        }, 2500);
      }
    }, 350);
  };

  const executeAction = async (actionStr) => {
    const colonIdx = actionStr.indexOf(':');
    if (colonIdx === -1) return;
    const type = actionStr.substring(0, colonIdx).trim();
    const rawTarget = actionStr.substring(colonIdx + 1).trim();

    try {
      if (type === 'NAVIGATE') {
        navigate(rawTarget);
      } else if (type === 'PREFILL_SINGLE_WORKOUT' || type === 'PREFILL_TRAINING_PLAN') {
        let parsedData = null;
        try {
          parsedData = JSON.parse(rawTarget);
        } catch (jsonErr) {
          console.warn('Could not parse AI JSON action payload:', rawTarget, jsonErr);
        }

        if (parsedData) {
          const payload = {
            actionType: type,
            data: parsedData
          };

          dispatchCoachAction(payload);

          // Nếu Coach chưa ở trang giáo án, tự động điều hướng sang trang giáo án
          if (location.pathname !== '/coach/workouts') {
            navigate('/coach/workouts');
          }

          setTimeout(() => {
            const targetId = type === 'PREFILL_TRAINING_PLAN' ? 'training-plan-form' : 'single-workout-form';
            const formEl = document.getElementById(targetId);
            if (formEl) {
              formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              formEl.classList.add('ring-4', 'ring-amber-500/50', 'transition-all', 'duration-700');
              setTimeout(() => {
                formEl.classList.remove('ring-4', 'ring-amber-500/50');
              }, 2500);
            }
          }, 350);
        }
      }
    } catch (err) {
      console.error('Coach Action execution failed:', err);
    }
  };

  const sendMessageWithText = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/v1/coach/ai/chat', { message: userMsg.text }, {
        headers: { Authorization: "Bearer " + token }
      });

      let rawText = typeof res.data === 'string' ? res.data : String(res.data || '');
      const actionResult = extractActionPayload(rawText);

      let hadPrefill = false;
      let prefillType = null;
      let prefillData = null;
      if (actionResult) {
        rawText = actionResult.cleanText;
        if (actionResult.type.includes('PREFILL_')) {
          hadPrefill = true;
          prefillType = actionResult.type;
          try {
            prefillData = JSON.parse(actionResult.rawJson);
          } catch (jsonErr) {
            console.warn('Could not parse AI JSON action payload:', jsonErr, actionResult.rawJson);
          }
        }
        await executeAction(`${actionResult.type}:${actionResult.rawJson}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: rawText,
          hasActionBadge: hadPrefill,
          actionType: prefillType,
          actionData: prefillData
        }
      ]);
    } catch (error) {
      console.error('Coach AI chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: t('Xin lỗi Coach, hệ thống AI hiện đang bận hoặc quá tải. Vui lòng thử lại sau giây lát!')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessageWithText(input);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed z-[9999]" 
          style={{ top: "80px", right: "24px", transform: `translate(${position.x}px, ${position.y}px)` }}
        >
          <motion.div 
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex flex-col bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden w-[360px] sm:w-[420px]"
            style={{ height: "560px" }}
          >
            {/* HEADER */}
            <div 
              ref={dragRef}
              onMouseDown={handleMouseDown}
              className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-3.5 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white leading-tight">{t("NEXUS COACH AI")}</h3>
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  </div>
                  <p className="text-[10px] text-blue-100 font-medium">{t("Training Co-Pilot & Exercise Specialist")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleClose} className="p-1.5 text-blue-100 hover:text-white transition-colors" title={t("Minimize (Keep history)")}>
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  setMessages([{
                    id: 1,
                    sender: "bot",
                    text: t("Xin chào Coach! Mình là NEXUS COACH AI - trợ lý chuyên môn của bạn. Hãy nói cho mình biết bạn muốn giao bài tập gì, cho học viên nào, hoặc cần tư vấn kế hoạch huấn luyện theo thể trạng nhé! 💪")
                  }]);
                  handleClose();
                }} className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors" title={t("Close (Clear history)")}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)] custom-scrollbar relative z-10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 border border-indigo-100'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-1.5">
                      <div className={`p-3 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Loa phát giọng nói AI đọc câu trả lời */}
                      {msg.sender === 'bot' && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleSpeak(msg.id, msg.text)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 cursor-pointer ${
                              speakingMsgId === msg.id
                                ? 'text-blue-500 bg-blue-500/15 font-bold shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)]'
                            }`}
                            title={speakingMsgId === msg.id ? t("Dừng đọc") : t("Nghe AI đọc câu trả lời")}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                <span>{t("Dừng đọc")}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>{t("Nghe AI đọc")}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {msg.hasActionBadge && (
                        <div className="pt-2 space-y-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {msg.actionType === 'PREFILL_TRAINING_PLAN'
                                ? t("Đã tự động soạn kế hoạch tập luyện vào Form")
                                : t("Đã tự động điền bài tập vào Form")}
                            </span>
                          </div>

                          <div>
                            <button
                              onClick={() => handleGoToWorkoutForm(msg.actionType, msg.actionData)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 flex items-center justify-between group transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                {msg.actionType === 'PREFILL_TRAINING_PLAN' ? (
                                  <Calendar className="w-4 h-4 text-amber-300" />
                                ) : (
                                  <Dumbbell className="w-4 h-4 text-amber-300" />
                                )}
                                <span>
                                  {msg.actionType === 'PREFILL_TRAINING_PLAN'
                                    ? t("Xem giáo án vừa soạn")
                                    : t("Xem bài tập vừa điền")}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-blue-200 group-hover:text-white font-medium">
                                <span>{t("Đi tới Form")}</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* TYPING INDICATOR */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 border border-indigo-100 shadow-sm">
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

            {/* QUICK SUGGESTIONS CHIPS */}
            <div className="px-3 py-2 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessageWithText(chip)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-hover)] hover:bg-[var(--primary-soft)] text-[var(--text-muted)] hover:text-[var(--primary)] border border-[var(--border)] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {chip}
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
                  placeholder={
                    isListening
                      ? (voiceLang === 'vi-VN' ? "🎙️ Đang nghe tiếng Việt... Hãy nói..." : "🎙️ Listening (English)... Speak now...")
                      : t("Hỏi AI: lên bài tập, kế hoạch tuần, phân tích học viên...")
                  }
                  disabled={isLoading}
                  className={`w-full bg-[var(--surface)] text-[var(--text)] text-xs rounded-xl pl-4 pr-24 py-3 border ${
                    isListening ? 'border-red-500 ring-2 ring-red-400/40 animate-pulse' : 'border-[var(--border)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  } outline-none transition-all placeholder-[var(--text-muted)] disabled:opacity-50 disabled:bg-[var(--surface-hover)]`}
                />
                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleVoiceLang}
                    className="px-1.5 py-1 text-[10px] font-bold rounded-md bg-[var(--surface-hover)] hover:bg-blue-600 hover:text-white text-[var(--text)] transition-colors border border-[var(--border)] cursor-pointer select-none"
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
                        : 'text-[var(--text-muted)] hover:text-blue-500 hover:bg-[var(--surface-hover)]'
                    }`}
                    title={isListening ? t("Dừng nghe") : (voiceLang === 'vi-VN' ? "Nói tiếng Việt" : t("Nhập bằng giọng nói"))}
                    aria-label={isListening ? t("Dừng nghe") : t("Nhập bằng giọng nói")}
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    title={t("Gửi tin nhắn")}
                  >
                    <Send className={isLoading ? "w-3.5 h-3.5 animate-pulse" : "w-3.5 h-3.5"} />
                  </button>
                </div>
              </div>
              <div className="text-center mt-1.5">
                <span className="text-[10px] text-[var(--text-muted)]">{t("Coach AI tự động gợi ý & điền form, Coach toàn quyền kiểm tra trước khi giao.")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CoachNexusAiChat;
