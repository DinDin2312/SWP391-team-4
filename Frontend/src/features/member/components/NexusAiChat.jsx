import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, X, Bot, User, Minus } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-[9999] flex flex-col bg-[#0f1b33] border border-[#1a2b50] rounded-2xl shadow-2xl overflow-hidden w-[340px] sm:w-[380px]"
      style={{ bottom: "24px", right: "24px", transform: "translate(" + position.x + "px, " + position.y + "px)", height: "500px" }}
    >
      <div 
        ref={dragRef}
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-blue-700 to-indigo-800 p-3 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">NEXUS AI</h3>
            <p className="text-[10px] text-blue-200">Agentic Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white transition-colors" title="Minimize (Keep history)">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => { 
            setMessages([{ id: 1, sender: "bot", text: "Hello! I am NEXUS AI. How can I assist you with your fitness journey today? (e.g. \"I want to lose 5kg\", \"Which yoga class is good?\")" }]); 
            onClose(); 
          }} className="p-1.5 text-blue-200 hover:text-rose-400 transition-colors" title="Close (Clear history)">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#091124] custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1a2b50] text-blue-400'}`}>
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-[#1a2b50] text-slate-200 rounded-tl-sm border border-[#233560]'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%] flex-row">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-[#1a2b50] text-blue-400">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl text-sm bg-[#1a2b50] text-slate-200 rounded-tl-sm border border-[#233560] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[#0f1b33] border-t border-[#1a2b50]">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="w-full bg-[#091124] text-white text-sm rounded-xl pl-4 pr-12 py-3 border border-[#1a2b50] focus:border-blue-500 focus:outline-none transition-colors placeholder-slate-500 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className={isLoading ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[9px] text-slate-500">NEXUS AI can make mistakes. Verify before buying.</span>
        </div>
      </div>
    </div>
  );
};

export default NexusAiChat;