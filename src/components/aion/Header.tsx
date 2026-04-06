import React from 'react';
import { Activity } from 'lucide-react';
import { Volume2, VolumeX } from 'lucide-react';
import RealisticAtom from './RealisticAtom';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';

export default function Header() {
  const themeColor = useUIStore(state => state.themeColor);
  const systemStatus = useAIStore(state => state.systemStatus);
  const isMuted = useAIStore(state => state.isMuted);
  const setIsMuted = useAIStore(state => state.setIsMuted);
  const isLiveConnected = useAIStore(state => state.isLiveConnected);

  return (
    <header className="relative z-20 p-6 flex justify-between items-start pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-jarvis-cyan/30 flex items-center justify-center backdrop-blur-md bg-black/40 overflow-hidden">
            <RealisticAtom themeColor={themeColor} size={40} />
          </div>
          {isLiveConnected && (
            <div className="absolute -inset-2 border-2 border-jarvis-orange rounded-full animate-ping opacity-40" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-[0.4em] hud-text text-jarvis-cyan">A.I.O.N.</h1>
          <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] opacity-60">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-jarvis-orange" />
              <span>STATUS: {systemStatus}</span>
            </div>
            <div className="w-1 h-1 bg-jarvis-cyan rounded-full" />
            <span>NEURAL_CORE_v2.0</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-6 items-center pointer-events-auto">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-lg hud-border hover:bg-jarvis-cyan/10 transition-all backdrop-blur-md bg-black/40"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-jarvis-orange" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
