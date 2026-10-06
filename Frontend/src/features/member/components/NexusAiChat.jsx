import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, X, Bot, User, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';

const NexusAiChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. "I want to lose 5kg", "Which yoga class is good?")' }
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
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Sorry, the AI system is currently busy. Please try again later.' }]);
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
            className="flex flex-col bg-[var(--surface)]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.15)] overflow-hidden w-[340px] sm:w-[380px]"
            style={{ height: "500px" }}
          >
      <div 
        ref={dragRef}
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary-hover)] p-3 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center border border-[var(--border)] backdrop-blur-sm shadow-inner">
            <Bot className="w-4 h-4 text-[var(--text)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] leading-tight">NEXUS AI</h3>
            <p className="text-[10px] text-[var(--primary)]">Agentic Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-1.5 text-[var(--primary)] hover:text-[var(--text)] transition-colors" title="Minimize (Keep history)">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => {
            setMessages([{ id: 1, sender: "bot", text: "Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. \"I want to lose 5kg\", \"Which yoga class is good?\")" }]);
            onClose();
          }} className="p-1.5 text-[var(--primary)] hover:text-[var(--rose)] transition-colors" title="Close (Clear history)">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)] custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.sender === 'user' ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface)] text-[var(--primary)]'}`}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-[var(--primary)] text-[color:var(--on-primary)] rounded-tr-sm'
                  : 'bg-[var(--surface)] text-[var(--text)] rounded-tl-sm border border-[var(--border)]'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%] flex-row">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-[var(--surface)] text-[var(--primary)]">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl text-sm bg-[var(--surface)] text-[var(--text)] rounded-tl-sm border border-[var(--border)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="w-full bg-[var(--surface)] text-[var(--text)] text-sm rounded-xl pl-4 pr-12 py-3 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors placeholder-[var(--text-muted)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-[var(--primary)] text-[color:var(--on-primary)] rounded-lg hover:bg-[var(--primary)] disabled:opacity-50 disabled:hover:bg-[var(--primary)] transition-colors"
          >
            <Send className={isLoading ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[9px] text-[var(--text-muted)]">NEXUS AI can make mistakes. Verify before buying.</span>
        </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default NexusAiChat;