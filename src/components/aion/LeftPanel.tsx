import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Video as VideoIcon, Image as ImageIcon, Gauge, VolumeX, Cloud, Bitcoin, Newspaper, Code, Copy, Check, Battery, BatteryCharging, Wifi, Cpu, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSystemMonitor } from '../../hooks/useSystemMonitor';
import { CryptoWidget } from './widgets/CryptoWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { NewsWidget } from './widgets/NewsWidget';
import { SmartHomeWidget } from './widgets/SmartHomeWidget';
import { CodeWidget } from './widgets/CodeWidget';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';

export default function LeftPanel() {
  const neuralMode = useUIStore(state => state.neuralMode);
  const content = useUIStore(state => state.leftPanelContent);
  const setContent = useUIStore(state => state.setLeftPanelContent);
  const themeColor = useUIStore(state => state.themeColor);
  
  const isSpeaking = useAIStore(state => state.isSpeaking);
  const isListening = useAIStore(state => state.isListening);
  const isLiveConnected = useAIStore(state => state.isLiveConnected);

  const [copied, setCopied] = React.useState(false);
  const [codeMode, setCodeMode] = React.useState<'code' | 'preview'>('code');
  const stats = useSystemMonitor();

  const handleCopy = () => {
    if (content.type === 'code' && content.data?.code) {
      navigator.clipboard.writeText(content.data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset code mode when content changes
  React.useEffect(() => {
    if (content.type === 'code') {
      setCodeMode(content.data?.language === 'html' ? 'preview' : 'code');
    }
  }, [content]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCryptoPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '0.00';
    if (price < 0.01) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    }
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="absolute top-6 left-6 space-y-6 text-[8px] tracking-[0.2em] pointer-events-none z-10 w-[400px]">
      <div className="space-y-2">
        <div className="flex gap-2"><span className="text-jarvis-orange">SYS:</span> AION_v2.0_LIVE</div>
        <div className="flex gap-2"><span className="text-jarvis-orange">MODE:</span> {neuralMode.toUpperCase()}</div>
        
        <div className="mt-4 pt-4 border-t border-jarvis-cyan/20 space-y-2">
          <div className="text-jarvis-orange font-bold">AUDIO_MONITOR</div>
          <div className="flex gap-2"><span>SPEAKING:</span> {isSpeaking ? 'TRUE' : 'FALSE'}</div>
          <div className="flex gap-2"><span>LISTENING:</span> {isListening ? 'TRUE' : 'FALSE'}</div>
          <div className="flex gap-2"><span>LIVE_CONN:</span> {isLiveConnected ? 'TRUE' : 'FALSE'}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {content.type !== 'none' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="hud-border bg-black/60 backdrop-blur-md p-4 rounded-xl pointer-events-auto w-full"
          >
            <div className="flex items-center justify-between mb-4 border-b border-jarvis-cyan/20 pb-2">
              <div className="flex items-center gap-2">
                {content.type === 'chart' && <BarChart3 className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'video' && <VideoIcon className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'image' && <ImageIcon className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'sensor' && <Gauge className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'weather' && <Cloud className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'crypto' && <Bitcoin className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'news' && <Newspaper className="w-4 h-4 text-jarvis-cyan" />}
                {content.type === 'code' && <Code className="w-4 h-4 text-jarvis-cyan" />}
                <span className="text-[10px] font-bold text-jarvis-cyan uppercase tracking-widest">{content.title || 'CONTENT_VIEW'}</span>
              </div>
              <button onClick={() => setContent({ type: 'none' })} className="text-jarvis-cyan/40 hover:text-jarvis-orange transition-colors">
                <VolumeX className="w-3 h-3" />
              </button>
            </div>

            <div className="min-h-[150px] flex items-center justify-center">
              {content.data?.error ? (
                <div className="text-jarvis-orange text-xs text-center p-4 border border-jarvis-orange/30 rounded bg-jarvis-orange/10 w-full">
                  {content.data.error}
                </div>
              ) : (
                <>
                  {content.type === 'chart' && content.data && (
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={content.data}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeColor + '20'} />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: `1px solid ${themeColor}`, fontSize: '10px' }}
                        itemStyle={{ color: themeColor }}
                      />
                      <Area type="monotone" dataKey="value" stroke={themeColor} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {content.type === 'video' && (
                <div className="w-full space-y-2">
                  <div className="w-full aspect-video rounded overflow-hidden relative group">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${content.data}?autoplay=1&mute=1&origin=${window.location.origin}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <a 
                    href={`https://www.youtube.com/watch?v=${content.data}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-jarvis-cyan/10 border border-jarvis-cyan/30 rounded text-[10px] text-jarvis-cyan hover:bg-jarvis-cyan/20 transition-colors pointer-events-auto"
                  >
                    <VideoIcon className="w-3 h-3" />
                    OPEN_IN_YOUTUBE_TAB
                  </a>
                </div>
              )}

              {content.type === 'image' && (
                <div className="w-full flex justify-center bg-black/40 rounded p-2 border border-jarvis-cyan/10">
                  <img 
                    src={content.data as string} 
                    alt={content.title} 
                    className="max-w-full max-h-64 object-contain rounded shadow-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/300?blur=2';
                    }}
                  />
                </div>
              )}

              {content.type === 'sensor' && content.data && (
                <div className="w-full space-y-3">
                  {Object.entries(content.data).map(([key, val]: [string, any], idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-jarvis-cyan/10 pb-1">
                      <span className="text-[8px] text-jarvis-cyan/60 uppercase">{key}</span>
                      <span className="text-[10px] font-mono text-jarvis-orange">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {content.type === 'weather' && <WeatherWidget data={content.data} />}

              {content.type === 'crypto' && <CryptoWidget data={content.data} themeColor={themeColor} />}

              {content.type === 'news' && <NewsWidget data={content.data} />}

              {content.type === 'code' && content.data && (
                <CodeWidget 
                  data={content.data} 
                  codeMode={codeMode} 
                  setCodeMode={setCodeMode} 
                  copied={copied} 
                  handleCopy={handleCopy} 
                />
              )}
                </>
              )}
            </div>
            {content.type === 'smart_home' && <SmartHomeWidget data={content.data} title={content.title} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
