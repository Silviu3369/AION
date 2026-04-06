import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, ChevronRight, ChevronLeft, Send, Mic, Shield, Activity, Cpu, Database, Globe, Zap, Battery, BatteryCharging, Wifi, Clock } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { useSystemMonitor } from '../../hooks/useSystemMonitor';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';

interface TerminalProps {
  handleSend: (e?: React.FormEvent) => void;
  connectLiveAPI: () => void;
  disconnectLiveAPI: () => void;
}

export default function Terminal({
  handleSend,
  connectLiveAPI,
  disconnectLiveAPI
}: TerminalProps) {
  const isOpen = useUIStore(state => state.isTerminalOpen);
  const setIsOpen = useUIStore(state => state.setIsTerminalOpen);
  const messages = useAIStore(state => state.messages);
  const isThinking = useAIStore(state => state.isThinking);
  const input = useAIStore(state => state.input);
  const setInput = useAIStore(state => state.setInput);
  const hudData = useAIStore(state => state.hudData);
  const isLiveConnected = useAIStore(state => state.isLiveConnected);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stats = useSystemMonitor();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={false}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="absolute right-0 top-0 bottom-0 w-80 lg:w-96 flex flex-col bg-black/80 backdrop-blur-xl border-l border-jarvis-cyan/30 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] pointer-events-auto"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-black/80 backdrop-blur-xl border border-r-0 border-jarvis-cyan/30 text-jarvis-cyan hover:bg-jarvis-cyan/20 rounded-l-xl flex flex-col items-center gap-2 shadow-[-5px_0_15px_rgba(0,0,0,0.3)] transition-colors"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        <span className="text-[8px] tracking-widest font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>
          TERMINAL
        </span>
      </button>

      {/* Top: Diagnostics / HUD Data */}
      <div className="p-4 border-b border-jarvis-cyan/20 bg-black/60">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-jarvis-orange" />
          <h3 className="text-[10px] font-bold tracking-widest text-jarvis-orange">SYSTEM_MONITOR</h3>
        </div>
        
        {hudData ? (
          <div className="p-3 border border-jarvis-cyan/30 bg-jarvis-cyan/5 rounded-lg text-xs text-jarvis-cyan whitespace-pre-wrap leading-relaxed shadow-[0_0_15px_rgba(0,242,255,0.1)] max-h-48 overflow-y-auto scrollbar-hide">
            {hudData}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                {stats.battery.charging ? <BatteryCharging className="w-4 h-4 text-green-400" /> : <Battery className="w-4 h-4 text-jarvis-cyan/50" />}
                <span className="text-[10px] tracking-widest">PWR_LEVEL</span>
              </div>
              <span className={`font-mono text-xs ${stats.battery.level <= 20 && !stats.battery.charging ? 'text-red-400 animate-pulse' : ''}`}>
                {stats.battery.supported ? `${stats.battery.level}%` : 'AC_POWER'}
              </span>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-jarvis-cyan/50" />
                <span className="text-[10px] tracking-widest">NETWORK</span>
              </div>
              <span className="font-mono text-xs">{stats.network.supported ? `${stats.network.type.toUpperCase()} (${stats.network.downlink}Mbps)` : 'ONLINE'}</span>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-jarvis-cyan/50" />
                <span className="text-[10px] tracking-widest">RAM_ALLOC</span>
              </div>
              <span className="font-mono text-xs">{stats.memory.supported ? `${stats.memory.usedJSHeapSize}MB / ${stats.memory.jsHeapSizeLimit}MB` : 'OPTIMIZED'}</span>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-jarvis-cyan/50" />
                <span className="text-[10px] tracking-widest">SYS_UPTIME</span>
              </div>
              <span className="font-mono text-xs">{formatUptime(stats.uptime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Middle: Chat Interface */}
      <div className="p-2 border-b border-jarvis-cyan/20 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2 px-2">
          <TerminalIcon className="w-4 h-4 text-jarvis-cyan" />
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-jarvis-cyan">COMM_LINK</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-jarvis-cyan/30 space-y-4">
            <Shield className="w-12 h-12 opacity-50" />
            <p className="text-[10px] tracking-widest text-center">SECURE CHANNEL ESTABLISHED<br/>AWAITING INPUT</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] p-3 rounded-lg relative group ${
              msg.role === 'user' 
                ? 'bg-jarvis-cyan/10 border border-jarvis-cyan/30 text-white' 
                : 'bg-black/60 border border-jarvis-orange/30 text-jarvis-cyan'
            }`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />
              
              <div className="text-[8px] tracking-widest opacity-50 mb-1 flex items-center gap-2">
                {msg.role === 'user' ? 'USER_INPUT' : 'AION_RESPONSE'}
              </div>
              <div className="text-xs leading-relaxed font-light markdown-body prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[90%] p-3 rounded-lg relative group bg-black/60 border border-jarvis-orange/30 text-jarvis-cyan">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />
              <div className="text-[8px] tracking-widest opacity-50 mb-1 flex items-center gap-2">
                AION_RESPONSE
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-jarvis-cyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom: Input */}
      <div className="p-4 bg-black/80 border-t border-jarvis-cyan/20">
        <form onSubmit={handleSend} className="relative flex items-center">
          <button
            type="button"
            onClick={() => isLiveConnected ? disconnectLiveAPI() : connectLiveAPI()}
            className={cn(
              "absolute left-2 p-2 rounded-md transition-colors",
              isLiveConnected ? "text-jarvis-orange bg-jarvis-orange/10" : "text-jarvis-cyan/50 hover:text-jarvis-cyan hover:bg-jarvis-cyan/10"
            )}
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENTER COMMAND..."
            className="w-full bg-black/40 border border-jarvis-cyan/30 rounded-lg pl-10 pr-10 py-2.5 text-xs text-jarvis-cyan placeholder:text-jarvis-cyan/30 focus:outline-none focus:border-jarvis-cyan focus:ring-1 focus:ring-jarvis-cyan/50 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2 text-jarvis-cyan/50 hover:text-jarvis-cyan disabled:opacity-50 disabled:hover:text-jarvis-cyan/50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
