import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NexusAiChat = ({ isOpen, onClose }) => {
  useLanguage();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: t('Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")') }
  ]);
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();

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

  const executeAction = async (actionStr) => {
    const parts = actionStr.split(':');
    if (parts.length < 2) return;
    const type = parts[0];
    const target = parts[1];

    try {
      const token = localStorage.getItem('token');
      if (type === 'NAVIGATE') {
        navigate(target);
      } else if (type === 'ADD_CART') {
        await axios.post('http://localhost:8080/api/v1/member/add-package-to-cart/' + target, {}, {
          headers: { Authorization: "Bearer " + token }
        });
        // dispatch custom event to update cart in layout
        window.dispatchEvent(new Event('cartUpdated'));
      } else if (type === 'BOOK_CLASS') {
        await axios.post('http://localhost:8080/api/v1/member/book-class/' + target, {}, {
          headers: { Authorization: "Bearer " + token }
        });
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/v1/member/ai/chat', { message: userMsg.text }, {
        headers: { Authorization: "Bearer " + token }
      });

      let rawText = res.data;
      const actionMatch = rawText.match(/\[ACTION:(.*?)\]/);

      if (actionMatch) {
        rawText = rawText.replace(actionMatch[0], '').trim();
        executeAction(actionMatch[1]);
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: rawText }]);
    } catch (err) {
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
            className="flex flex-col bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden w-[340px] sm:w-[380px]"
            style={{ height: "500px" }}
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
          <button onClick={onClose} className="p-1.5 text-blue-100 hover:text-white transition-colors" title={t("Minimize (Keep history)")}>
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => {
            setMessages([{ id: 1, sender: "bot", text: t("Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. \"I want to lose 5kg\", \"Which yoga class is good?\")") }]);
            onClose();
          }} className="p-1.5 text-blue-100 hover:bg-white/10 rounded-lg hover:text-white transition-colors" title={t("Close (Clear history)")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)] custom-scrollbar">
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

      {/* INPUT AREA */}
      <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="relative flex items-center shadow-sm rounded-xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t("Ask anything...")}
            disabled={isLoading}
            className="w-full bg-[var(--surface)] text-[var(--text)] text-sm rounded-xl pl-4 pr-12 py-3.5 border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all placeholder-[var(--text-muted)] disabled:opacity-50 disabled:bg-[var(--surface-hover)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-[var(--primary)] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[var(--primary)] transition-colors"
          >
            <Send className={isLoading ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
          </button>
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
