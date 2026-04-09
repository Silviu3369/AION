import React from 'react';
import { useAionController } from '../hooks/useAionController';

// Sub-components
import NeuralNetwork from './aion/NeuralNetwork';
import Terminal from './aion/Terminal';
import LeftPanel from './aion/LeftPanel';
import Header from './aion/Header';
import MicButton from './aion/MicButton';

export default function AionUI() {
  const {
    audioRef,
    isLiveConnected,
    isListening,
    isSpeaking,
    connectLiveAPI,
    disconnectLiveAPI,
    analyser,
    handleSend
  } = useAionController();

  return (
    <div className="flex flex-col h-screen bg-jarvis-bg text-jarvis-cyan overflow-hidden relative selection:bg-jarvis-cyan/30">
      <div className="scanline-overlay" />
      <audio ref={audioRef} loop preload="none" />
      
      <NeuralNetwork 
        analyser={analyser}
      />

      <Header />

      <div className="flex-1 relative z-10 w-full pointer-events-none">
        <LeftPanel />

        <MicButton 
          isLiveConnected={isLiveConnected} 
          connectLiveAPI={connectLiveAPI}
        />

        <Terminal 
          handleSend={handleSend}
          connectLiveAPI={connectLiveAPI}
          disconnectLiveAPI={disconnectLiveAPI}
        />
      </div>
    </div>
  );
}
