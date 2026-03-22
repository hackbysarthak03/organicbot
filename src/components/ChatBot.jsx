import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Send, MessageSquare, RefreshCw, AlertCircle, Sparkles, User, Bot, Leaf, Droplets, ShoppingBag, Mic, MicOff, Trash2, Menu, X, Clock, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useChats } from '../hooks/useChats';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

gsap.registerPlugin(useGSAP);

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { SYSTEM_PROMPT } from '../botPrompt';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'dummy_to_prevent_crash');
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

const SUGGESTIONS = [
  { id: '1', text: 'Get fresh perspectives on organic farming' },
  { id: '2', text: 'Brainstorm creative natural recipes' },
  { id: '3', text: 'Rewrite message for maximum eco-impact' },
  { id: '4', text: 'Summarize key sustainability points' },
];

const INITIAL_MESSAGES = [];

const FLOATING_IMAGES_LEFT = [
  { id: 'l1', src: 'https://res.cloudinary.com/dx0toqzvu/image/upload/v1760011482/react_uploads/m4tqcvehxncumkx67w3t.webp', top: '15%', left: '10%' },
  { id: 'l2', src: 'https://res.cloudinary.com/dx0toqzvu/image/upload/v1760099043/react_uploads/fmha6sp0qn8djzloxo93.jpg', top: '55%', left: '15%' },
];

const FLOATING_IMAGES_RIGHT = [
  { id: 'r1', src: 'https://res.cloudinary.com/dx0toqzvu/image/upload/v1760010005/react_uploads/tuucnjjfonushvpsxxyy.webp', top: '20%', right: '10%' },
  { id: 'r2', src: 'https://res.cloudinary.com/dx0toqzvu/image/upload/v1760702830/react_uploads/eg3jgtnitxsv33j83vlh.jpg', top: '60%', right: '15%' },
];

export default function ChatBot({ user }) {
  const { sessions, currentSessionId, setCurrentSessionId, saveSession, deleteSession, loading: chatsLoading } = useChats(user);
  
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  const scrollRef = useRef(null);
  const orbRef = useRef(null);
  const titleContainerRef = useRef(null);
  const floatingContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sync messages with current session
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const active = sessions.find(s => s.id === currentSessionId);
      if (active) {
        setMessages(active.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId, sessions]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        if (currentTranscript) {
          setInput((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + currentTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
         setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch(e) { console.error(e); }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  useGSAP(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        y: -10, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(orbRef.current, {
        rotation: 360, duration: 20, repeat: -1, ease: "linear"
      });
    }

    if (floatingContainerRef.current) {
      const elements = floatingContainerRef.current.querySelectorAll('.floating-element');
      elements.forEach((el, index) => {
        gsap.to(el, {
          y: `random(-20, 20)`, x: `random(-15, 15)`, rotation: `random(-10, 10)`,
          duration: `random(4, 7)`, repeat: -1, yoyo: true, ease: "sine.inOut",
          delay: index * 0.2
        });
      });
    }

    gsap.from(".suggestion-btn", {
      y: 20, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out", delay: 0.4
    });
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 150);
    }
  }, [messages, isLoading, error]);

  const handleSend = async (e, textOverride = null) => {
    e?.preventDefault();
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    if (isListening) toggleListening();

    setError(null);
    const userMsg = { id: Date.now().toString(), role: 'user', content: messageText };
    const newMessages = [...messages, userMsg];
    
    // Optimistic UI
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = 'sess_' + Date.now().toString();
      setCurrentSessionId(activeSessionId);
    }

    // Save initial user message
    await saveSession({
      id: activeSessionId,
      messages: newMessages,
    });

    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error("API Key configuration required. Please add your Gemini API Key to the .env file to enable processing.");
      }

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(messageText);
      const responseText = result.response.text();

      const botMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText };
      const finalizedMessages = [...newMessages, botMsg];
      
      setMessages(finalizedMessages);
      
      // Save finalized session with bot response
      await saveSession({
        id: activeSessionId,
        messages: finalizedMessages,
      });

    } catch (err) {
      console.error("Gemini Error:", err);
      setError(err.message || "An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setIsSidebarOpen(false);
  };

  const isChatActive = messages.length > 0;
  const greetingName = user ? (user.displayName || "Guest") : "Guest";

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden organic-gradient text-[#202123] font-sans selection:bg-emerald-200 relative transition-colors duration-500">
      
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
            <motion.div 
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSidebarOpen && (
            <motion.div 
              key="sidebar"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col border-r border-gray-100"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <span className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Recent Chats
                </span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 border-b border-gray-100">
                <button onClick={startNewChat} className="w-full flex justify-center items-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {chatsLoading ? (
                  <p className="text-sm text-gray-400 text-center mt-4">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center mt-4">No recent chats.</p>
                ) : (
                  sessions.map(s => (
                    <div 
                      key={s.id} 
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer",
                        currentSessionId === s.id ? "bg-emerald-50 border border-emerald-100" : "hover:bg-gray-50 border border-transparent"
                      )}
                      onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }}
                    >
                      <div className="flex flex-col overflow-hidden max-w-[80%]">
                        <span className="text-base font-medium text-gray-800 truncate">{s.title || 'New Chat'}</span>
                        <span className="text-sm text-gray-400 truncate">{new Date(s.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-medium shadow-md">
                    {greetingName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-gray-800">{greetingName}</span>
                    <span className="text-sm text-gray-500 font-medium">{user?.isGuest ? 'Guest User' : 'Google Account'}</span>
                  </div>
                </div>
                {!user?.isGuest && (
                  <button onClick={() => { signOut(auth); window.location.reload(); }} className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline">Logout</button>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isChatActive && (
          <motion.div
            ref={floatingContainerRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden md:block"
          >
            {FLOATING_IMAGES_LEFT.map((img) => (
              <div key={img.id} className="floating-element absolute rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 border-4 border-white/50 w-36 h-36" style={{ top: img.top, left: img.left }}>
                <img src={img.src} alt="Organic Product" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent mix-blend-overlay"></div>
              </div>
            ))}
            {FLOATING_IMAGES_RIGHT.map((img) => (
              <div key={img.id} className="floating-element absolute rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/10 border-4 border-white/50 w-44 h-44" style={{ top: img.top, right: img.right }}>
                <img src={img.src} alt="Organic Product" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-lime-500/20 to-transparent mix-blend-overlay"></div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Navbar */}
      <header className="fixed top-0 w-full p-6 flex items-center justify-between z-30 pointer-events-none bg-gradient-to-b from-white to-transparent transition-all duration-300">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-white/60 hover:bg-white flex items-center justify-center border border-gray-200/50 backdrop-blur-md shadow-sm transition-all hover:scale-105"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={startNewChat}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 backdrop-blur-md group-hover:bg-emerald-500/30 transition-colors">
              <Leaf className="w-4 h-4 text-emerald-600 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-base font-medium tracking-tight text-gray-800">Organic Bot</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {isChatActive && (
             <motion.button
               initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
               onClick={startNewChat}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 hover:bg-emerald-50 text-emerald-600 text-base font-medium rounded-full border border-gray-200/50 shadow-sm transition-colors"
             >
               <Plus className="w-4 h-4" />
               New Chat
             </motion.button>
          )}
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base font-medium shadow-md hover:scale-105 transition-transform">
             {greetingName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto w-full pt-20 z-10 relative">
        <div className={cn(
          "mx-auto w-full px-4 sm:px-6 md:px-8 transition-all duration-700 ease-in-out",
          isChatActive ? "max-w-3xl mt-4" : "max-w-4xl mt-[8vh]"
        )}>
          <AnimatePresence mode="wait">
            {!isChatActive ? (
              <motion.div 
                key="welcome-screen"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center text-center w-full relative z-10"
              >
                <div className="relative mb-12">
                  <div ref={orbRef} className="w-20 h-20 rounded-full orb-glow"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/40 rounded-full mix-blend-overlay"></div>
                </div>
                
                <div ref={titleContainerRef} className="space-y-3 mb-10">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                    Good evening, {greetingName}
                  </h1>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                    Can I help you with anything?
                  </h2>
                </div>

                <p className="text-base text-gray-500 mb-8 font-medium">
                  Choose a prompt below or write your own to start<br/>chatting with Organic Bot
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSend(null, s.text)}
                      className="suggestion-btn text-center p-4 rounded-2xl bg-white/60 hover:bg-white border border-gray-200/60 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md text-base text-gray-700 font-medium"
                    >
                      {s.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
            <motion.div 
              key="active-chat"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 bg-white/40 backdrop-blur-3xl p-6 md:p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-gray-200/50 min-h-[60vh] pb-8"
            >
              {messages.map((m) => (
                <MessageItem key={m.id} message={m} />
              ))}
              {isLoading && <LoadingMessage />}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-base"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-40 shrink-0 w-full" />
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Section - Fixed Bottom */}
      <footer className="fixed bottom-0 w-full p-4 md:p-8 pointer-events-none z-20 bg-gradient-to-t from-[#fcfdfc] via-[#fcfdfc]/90 to-transparent">
        <div className={cn(
          "mx-auto w-full pointer-events-auto transition-all duration-700 ease-in-out",
          isChatActive ? "max-w-3xl" : "max-w-4xl"
        )}>
          <div className="glass-input rounded-3xl p-3 flex flex-col relative group transition-shadow duration-300 hover:shadow-lg border-none">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={isListening ? "Listening, speak now..." : "How can Organic Bot help you today?"}
              className="w-full max-h-48 min-h-[64px] px-4 pt-4 pb-2 bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-800 placeholder:text-gray-400 font-medium scrollbar-hide outline-none focus:outline-none"
            />
            
            <AnimatePresence>
              {isListening && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-3xl border-2 border-emerald-400 pointer-events-none"
                  style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3) inset' }}
                />
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-2 pt-2 relative z-10">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100/80 transition-colors text-gray-600 text-base font-medium">
                  <span className="font-medium text-gray-800">Organic Bot</span> 
                  <span className="text-emerald-500 flex items-center gap-1"><Sparkles className="w-4 h-4"/> Pure AI</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 relative",
                    isListening ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse" : "hover:bg-gray-100/80 text-gray-400 hover:text-emerald-600"
                  )}
                  title="Voice Typing"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {input.trim() ? (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleSend(e)}
                    className="p-2 ml-1 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MessageItem({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("flex w-full gap-4", isUser && "flex-row-reverse")}
    >
      <div className={cn(
        "w-10 h-10 rounded-full shrink-0 flex items-center justify-center border transition-all mt-1",
        isUser ? "bg-gray-100 border-gray-200 text-gray-600 font-medium text-base" : "bg-gradient-to-tr from-emerald-500 to-emerald-400 border-emerald-500 text-white shadow-md shadow-emerald-200"
      )}>
        {isUser ? "U" : <Leaf className="w-5 h-5" />}
      </div>
      <div className={cn("flex flex-col gap-1.5 max-w-[85%]", isUser && "items-end")}>
        <span className="text-sm font-medium text-gray-900 tracking-tight">
          {isUser ? "You" : "Organic Bot"}
        </span>
        <div className={cn(
          "leading-relaxed text-sm whitespace-pre-wrap font-medium p-4 rounded-2xl",
          isUser ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 rounded-tr-sm" : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm"
        )}>
           {message.content}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingMessage() {
  const dotsRef = useRef(null);
  useGSAP(() => {
    if (dotsRef.current) gsap.to(dotsRef.current.children, { y: -4, duration: 0.4, stagger: 0.15, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }, []);

  return (
    <div className="flex w-full gap-4 items-start">
      <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border bg-gradient-to-tr from-emerald-500 to-emerald-400 border-emerald-500 text-white shadow-md shadow-emerald-200 mt-1">
        <Leaf className="w-5 h-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-900 tracking-tight">Organic Bot</span>
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 w-16">
          <div ref={dotsRef} className="flex gap-1.5 items-center justify-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" /><div className="w-2 h-2 bg-emerald-400 rounded-full" /><div className="w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
