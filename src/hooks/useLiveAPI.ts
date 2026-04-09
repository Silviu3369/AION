import { useState, useRef, useEffect, useCallback } from 'react';
import { getAI } from '../services/gemini';
import { Modality } from '@google/genai';
import { AION_SYSTEM_INSTRUCTION } from '../constants';
import { useAIStore } from '../store/useAIStore';
import { getToolDeclarations, executeTool } from '../tools';
import { AudioManager } from '../services/audioManager';

interface UseLiveAPIOptions {
  onMessage?: (message: any) => void;
  onStatusChange?: (status: string) => void;
  onHudData?: (data: string) => void;
  isMuted?: boolean;
  isInputMuted?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  messages?: { role: string, text: string }[];
}

export function useLiveAPI({
  onStatusChange,
  onHudData,
  isMuted = false,
  isInputMuted = false,
  audioRef,
  messages = []
}: UseLiveAPIOptions = {}) {
  const setIsLiveConnected = useAIStore(state => state.setIsLiveConnected);
  const setIsListening = useAIStore(state => state.setIsListening);
  const setIsSpeaking = useAIStore(state => state.setIsSpeaking);

  const audioManagerRef = useRef<AudioManager>(new AudioManager());
  const sessionPromiseRef = useRef<any>(null);
  const isDisconnectingRef = useRef(false);
  const isInputMutedRef = useRef(isInputMuted);
  const isIntentionalDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isInterruptedRef = useRef(false);
  const speakingLevelRef = useRef(0);

  useEffect(() => {
    isInputMutedRef.current = isInputMuted;
  }, [isInputMuted]);

  const disconnectLiveAPI = useCallback((intentional = true, playSounds = true) => {
    isIntentionalDisconnectRef.current = intentional;
    if (intentional) {
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    if (isDisconnectingRef.current) return;
    isDisconnectingRef.current = true;
    
    if (playSounds) audioManagerRef.current.playBeep('stop');
    
    setIsLiveConnected(false);
    setIsListening(false);
    onStatusChange?.('OFFLINE');
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session: any) => session.close());
      sessionPromiseRef.current = null;
    }

    audioManagerRef.current.close();
  }, [onStatusChange, setIsLiveConnected, setIsListening]);

  const connectLiveAPI = useCallback(async (playSounds = true) => {
    isIntentionalDisconnectRef.current = false;
    isDisconnectingRef.current = false;
    isInterruptedRef.current = false;
    
    if (playSounds) audioManagerRef.current.playBeep('start');
    onStatusChange?.('CONNECTING...');

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing!");
      onStatusChange?.('API_ERROR');
      return;
    }

    try {
      await audioManagerRef.current.initialize((base64) => {
        if (!sessionPromiseRef.current || isDisconnectingRef.current || isInputMutedRef.current) return;
        sessionPromiseRef.current.then((session: any) => {
          session.sendRealtimeInput({ 
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
          });
        });
      });

      const ai = getAI();
      let currentSystemInstruction = AION_SYSTEM_INSTRUCTION;
      if (messages && messages.length > 0) {
        const historyText = messages.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        currentSystemInstruction += `\n\n[SYSTEM NOTE: The connection was reset. Recent history:]\n${historyText}`;
      }

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
          },
          systemInstruction: currentSystemInstruction,
          tools: [{ functionDeclarations: getToolDeclarations() }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            reconnectAttemptsRef.current = 0;
            setIsLiveConnected(true);
            setIsListening(true);
            onStatusChange?.('LIVE_AUDIO_ACTIVE');
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.interrupted) {
              isInterruptedRef.current = true;
              audioManagerRef.current.stopPlayback();
            }

            if (message.serverContent?.turnComplete) {
              isInterruptedRef.current = false;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              isInterruptedRef.current = false;
              if (!isMuted) {
                audioManagerRef.current.playAudioChunk(base64Audio);
              }
            }

            if (message.serverContent?.modelTurn?.parts) {
               const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
               if (textPart?.text) {
                 const hudMatch = textPart.text.match(/<HUD>(.*?)<\/HUD>/s);
                 if (hudMatch?.[1]) onHudData?.(hudMatch[1].trim());
               }
            }
            
            if (message.toolCall) {
              const functionResponses = [];
              for (const call of message.toolCall.functionCalls) {
                const response = await executeTool(call.name, call.args, { audioRef });
                functionResponses.push({ id: call.id, name: call.name, response });
              }
              sessionPromiseRef.current?.then((session: any) => {
                session.sendToolResponse({ functionResponses });
              });
            }
          },
          onerror: (err: any) => {
            if (isDisconnectingRef.current) return;
            console.error("Live API Error:", err);
            onStatusChange?.('API_ERROR');
            
            if (!isIntentionalDisconnectRef.current && reconnectAttemptsRef.current < 3) {
              disconnectLiveAPI(false, false);
              reconnectAttemptsRef.current++;
              const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
              onStatusChange?.(`RECONNECTING (${reconnectAttemptsRef.current}/3)...`);
              reconnectTimeoutRef.current = window.setTimeout(() => {
                isDisconnectingRef.current = false;
                connectLiveAPI(false);
              }, delay);
            } else {
              setTimeout(() => disconnectLiveAPI(true, true), 2000);
            }
          },
          onclose: () => {
            if (!isIntentionalDisconnectRef.current && reconnectAttemptsRef.current < 3) {
              disconnectLiveAPI(false, false);
              reconnectAttemptsRef.current++;
              const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
              onStatusChange?.(`RECONNECTING (${reconnectAttemptsRef.current}/3)...`);
              reconnectTimeoutRef.current = window.setTimeout(() => {
                isDisconnectingRef.current = false;
                connectLiveAPI(false);
              }, delay);
            } else {
              disconnectLiveAPI(true, true);
            }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect to Live API", err);
      onStatusChange?.(err.name === 'NotAllowedError' ? "MIC_DENIED" : "MIC_ERROR");
      audioManagerRef.current.playBeep('stop');
    }
  }, [setIsLiveConnected, setIsListening, onStatusChange, isMuted, messages, onHudData, disconnectLiveAPI, audioRef]);

  const sendText = useCallback((text: string) => {
    if (sessionPromiseRef.current && !isDisconnectingRef.current) {
      sessionPromiseRef.current.then((session: any) => {
        if (!isDisconnectingRef.current) session.sendRealtimeInput({ text });
      });
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      let speaking = false;
      const analyser = audioManagerRef.current.getAnalyser();
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        speaking = (sum / dataArray.length) > 2;
      }
      setIsSpeaking(speaking);
      speakingLevelRef.current += ((speaking ? 1 : 0) - speakingLevelRef.current) * 0.2;
    }, 66);
    return () => clearInterval(intervalId);
  }, [setIsSpeaking]);

  return {
    isLiveConnected: useAIStore(state => state.isLiveConnected),
    isListening: useAIStore(state => state.isListening),
    isSpeaking: useAIStore(state => state.isSpeaking),
    speakingLevel: speakingLevelRef.current,
    connectLiveAPI,
    disconnectLiveAPI,
    sendText,
    analyser: audioManagerRef.current.getAnalyser()
  };
}
