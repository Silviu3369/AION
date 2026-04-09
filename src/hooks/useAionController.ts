import { useRef, useEffect } from 'react';
import { useLiveAPI } from './useLiveAPI';
import { getAI } from '../services/gemini';
import { AION_SYSTEM_INSTRUCTION } from '../constants';
import { useUIStore } from '../store/useUIStore';
import { useAIStore } from '../store/useAIStore';
import { getToolDeclarations, executeTool } from '../tools';

export function useAionController() {
  // UI State
  const themeColor = useUIStore(state => state.themeColor);
  const setThemeColor = useUIStore(state => state.setThemeColor);
  const neuralMode = useUIStore(state => state.neuralMode);
  const setNeuralMode = useUIStore(state => state.setNeuralMode);
  const isTerminalOpen = useUIStore(state => state.isTerminalOpen);
  const setIsTerminalOpen = useUIStore(state => state.setIsTerminalOpen);
  const leftPanelContent = useUIStore(state => state.leftPanelContent);
  const setLeftPanelContent = useUIStore(state => state.setLeftPanelContent);
  const youtubeVideoId = useUIStore(state => state.youtubeVideoId);
  const setYoutubeVideoId = useUIStore(state => state.setYoutubeVideoId);
  const updateSmartHomeDevice = useUIStore(state => state.updateSmartHomeDevice);

  // AI State
  const input = useAIStore(state => state.input);
  const setInput = useAIStore(state => state.setInput);
  const messages = useAIStore(state => state.messages);
  const setMessages = useAIStore(state => state.setMessages);
  const isThinking = useAIStore(state => state.isThinking);
  const setIsThinking = useAIStore(state => state.setIsThinking);
  const isMuted = useAIStore(state => state.isMuted);
  const setIsMuted = useAIStore(state => state.setIsMuted);
  const isInputMuted = useAIStore(state => state.isInputMuted);
  const setIsInputMuted = useAIStore(state => state.setIsInputMuted);
  const systemStatus = useAIStore(state => state.systemStatus);
  const setSystemStatus = useAIStore(state => state.setSystemStatus);
  const hudData = useAIStore(state => state.hudData);
  const setHudData = useAIStore(state => state.setHudData);
  const timer = useAIStore(state => state.timer);
  const setTimer = useAIStore(state => state.setTimer);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Live API Hook
  const {
    isLiveConnected,
    isListening,
    isSpeaking,
    connectLiveAPI,
    disconnectLiveAPI,
    sendText,
    analyser
  } = useLiveAPI({
    isMuted,
    isInputMuted,
    audioRef,
    messages,
    onStatusChange: (status) => {
      if (status === 'LIVE_AUDIO_ACTIVE' && isInputMuted) {
        setSystemStatus('MIC_MUTED');
      } else {
        setSystemStatus(status);
        if (status === 'MIC_DENIED') {
          setMessages(prev => [...prev, { role: 'model', text: "Accesul la microfon a fost refuzat. Te rog să acorzi permisiunea din setările browserului tău." }]);
        } else if (status === 'NO_MIC_FOUND') {
          setMessages(prev => [...prev, { role: 'model', text: "Nu am putut detecta niciun microfon. Verifică dacă dispozitivul tău are un microfon funcțional." }]);
        } else if (status === 'MIC_ERROR') {
          setMessages(prev => [...prev, { role: 'model', text: "Eroare la inițializarea microfonului. Dacă ești pe telefon, asigură-te că folosești un browser compatibil (ex: Chrome, Safari) și nu un browser in-app (ex: Facebook, Instagram)." }]);
        }
      }
    },
    onHudData: setHudData
  });

  // Timer logic
  useEffect(() => {
    if (!timer || timer.remaining <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Spacebar Hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!isLiveConnected) connectLiveAPI();
        else disconnectLiveAPI();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveConnected, connectLiveAPI, disconnectLiveAPI]);

  // Handle Send (Unified)
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const textToSend = input;
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');

    const wasSentViaLive = sendText(textToSend);
    
    if (!wasSentViaLive) {
      // Offline mode
      setIsThinking(true);
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: textToSend,
          config: {
            systemInstruction: AION_SYSTEM_INSTRUCTION,
            tools: [
              { googleSearch: {} }, 
              { functionDeclarations: getToolDeclarations() }
            ],
            toolConfig: { includeServerSideToolInvocations: true }
          }
        });
        
        // Handle function calls manually for text mode
        if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
            await executeTool(call.name, call.args, { audioRef });
          }
        }
        
        setMessages(prev => [...prev, { role: 'model', text: response.text || "No response." }]);
        
        const hudMatch = response.text?.match(/<HUD>(.*?)<\/HUD>/s);
        if (hudMatch && hudMatch[1]) setHudData(hudMatch[1].trim());
      } catch (err) {
        console.error("Text API Error:", err);
        setMessages(prev => [...prev, { role: 'model', text: "Eroare de conexiune la rețeaua text." }]);
      } finally {
        setIsThinking(false);
      }
    }
  };

  return {
    audioRef,
    isLiveConnected,
    isListening,
    isSpeaking,
    connectLiveAPI,
    disconnectLiveAPI,
    analyser,
    handleSend
  };
}
