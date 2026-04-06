import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAIStore } from '../../store/useAIStore';

interface MicButtonProps {
  isLiveConnected: boolean;
  connectLiveAPI: () => void;
}

export default function MicButton({ isLiveConnected, connectLiveAPI }: MicButtonProps) {
  const isInputMuted = useAIStore(state => state.isInputMuted);
  const setIsInputMuted = useAIStore(state => state.setIsInputMuted);

  const toggleLive = () => {
    if (!isLiveConnected) {
      setIsInputMuted(false);
      connectLiveAPI();
    } else {
      setIsInputMuted(!isInputMuted);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto z-20"
      >
        <button
          onClick={toggleLive}
          className={cn(
            "p-6 rounded-full transition-all hud-border backdrop-blur-md",
            isLiveConnected 
              ? (isInputMuted 
                  ? "bg-jarvis-cyan/10 text-jarvis-cyan/50 border-jarvis-cyan/30" 
                  : "bg-jarvis-orange/20 text-jarvis-orange animate-pulse border-jarvis-orange shadow-[0_0_30px_rgba(255,140,0,0.3)]")
              : "bg-black/40 hover:bg-jarvis-cyan/20 text-jarvis-cyan shadow-[0_0_20px_rgba(0,242,255,0.1)]"
          )}
        >
          <Mic className={cn("w-8 h-8", isInputMuted && "opacity-30")} />
        </button>
        <div className="text-[10px] tracking-[0.3em] text-jarvis-cyan/60 uppercase">
          {isLiveConnected 
            ? (isInputMuted ? "MIC MUTED - PRESS TO RESUME" : "LIVE AUDIO ACTIVE - PRESS TO MUTE") 
            : "PRESS TO START LIVE AUDIO"}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
