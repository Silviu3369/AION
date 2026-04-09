import { useState, useRef, useEffect, useCallback } from 'react';
import { getAI } from '../services/gemini';
import { Modality } from '@google/genai';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64, pcm16ToFloat32 } from '../lib/audioUtils';
import { AION_SYSTEM_INSTRUCTION } from '../constants';
import { useAIStore } from '../store/useAIStore';
import { getToolDeclarations, executeTool } from '../tools';

const workletCode = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Reduced from 4096 to lower latency
    this.buffer = new Float32Array(this.bufferSize);
    this.offset = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.offset++] = channelData[i];
        if (this.offset >= this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.offset = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('audio-capture-processor', AudioCaptureProcessor);
`;

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
  const isLiveConnected = useAIStore(state => state.isLiveConnected);
  const setIsLiveConnected = useAIStore(state => state.setIsLiveConnected);
  const isListening = useAIStore(state => state.isListening);
  const setIsListening = useAIStore(state => state.setIsListening);
  const isSpeaking = useAIStore(state => state.isSpeaking);
  const setIsSpeaking = useAIStore(state => state.setIsSpeaking);


  const sessionPromiseRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isDisconnectingRef = useRef(false);
  const speakingLevelRef = useRef(0);
  const isInputMutedRef = useRef(isInputMuted);
  const isIntentionalDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isInterruptedRef = useRef(false);

  useEffect(() => {
    isInputMutedRef.current = isInputMuted;
  }, [isInputMuted]);

  const beepContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((type: 'start' | 'stop') => {
    try {
      if (!beepContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        beepContextRef.current = new AudioContextClass();
      }
      const ctx = beepContextRef.current;
      
      // Resume context if it was suspended (browser policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'start') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (playbackContextRef.current) {
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    const playbackCtx = playbackContextRef.current;
    const analyser = analyserRef.current;
    if (!playbackCtx || !analyser) return;

    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const float32Data = pcm16ToFloat32(arrayBuffer);
    const buffer = playbackCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = playbackCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);

    const startTime = Math.max(playbackCtx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
    };
  }, []);

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
    if (playSounds) playBeep('stop');
    setIsLiveConnected(false);
    setIsListening(false);
    onStatusChange?.('OFFLINE');
    stopPlayback();
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session: any) => session.close());
      sessionPromiseRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    analyserRef.current = null;
  }, [onStatusChange, playBeep, stopPlayback, setIsLiveConnected, setIsListening]);

  const connectLiveAPI = useCallback(async (playSounds = true) => {
    if (isLiveConnected) return;
    isIntentionalDisconnectRef.current = false;
    isDisconnectingRef.current = false;
    isInterruptedRef.current = false;
    if (playSounds) playBeep('start');
    onStatusChange?.('CONNECTING...');

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing!");
      onStatusChange?.('API_ERROR');
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      let audioCtx: AudioContext;
      let playbackCtx: AudioContext;
      
      try {
        audioCtx = new AudioContextClass({ sampleRate: 16000 });
        playbackCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (e) {
        console.warn("Failed to create AudioContext with specific sample rate, falling back to default", e);
        audioCtx = new AudioContextClass();
        playbackCtx = new AudioContextClass();
      }

      // Resume contexts if they are suspended (required by iOS Safari)
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (playbackCtx.state === 'suspended') await playbackCtx.resume();

      const analyser = playbackCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(playbackCtx.destination);

      audioContextRef.current = audioCtx;
      playbackContextRef.current = playbackCtx;
      analyserRef.current = analyser;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, 
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      
      // Add a GainNode to boost microphone sensitivity
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 2.5; // Boost volume by 2.5x so you don't have to speak loudly
      source.connect(gainNode);
      
      let processor: AudioWorkletNode | ScriptProcessorNode;
      
      try {
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await audioCtx.audioWorklet.addModule(workletUrl);
        
        processor = new AudioWorkletNode(audioCtx, 'audio-capture-processor');
        (processor as AudioWorkletNode).port.onmessage = (e) => {
          if (!sessionPromiseRef.current || isDisconnectingRef.current || isInputMutedRef.current) return;
          const inputData = e.data;
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcm16);
          sessionPromiseRef.current.then((session: any) => {
            session.sendRealtimeInput({ audio: { data: base64, mimeType: `audio/pcm;rate=${audioCtx.sampleRate}` } });
          });
        };
      } catch (workletError) {
        console.warn("AudioWorklet not supported or failed, falling back to ScriptProcessorNode", workletError);
        processor = audioCtx.createScriptProcessor(2048, 1, 1); // Reduced from 4096
        (processor as ScriptProcessorNode).onaudioprocess = (e) => {
          if (!sessionPromiseRef.current || isDisconnectingRef.current || isInputMutedRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = arrayBufferToBase64(pcm16);
          sessionPromiseRef.current.then((session: any) => {
            session.sendRealtimeInput({ audio: { data: base64, mimeType: `audio/pcm;rate=${audioCtx.sampleRate}` } });
          });
        };
      }

      processorRef.current = processor;
      gainNode.connect(processor); // Connect gain node to processor instead of source directly
      processor.connect(audioCtx.destination);

      const ai = getAI();
      
      // Inject history if this is a reconnect
      let currentSystemInstruction = AION_SYSTEM_INSTRUCTION;
      if (messages && messages.length > 0) {
        const historyText = messages.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
        currentSystemInstruction += `\n\n[SYSTEM NOTE: The connection was reset. Here is the recent conversation history to maintain context:]\n${historyText}`;
      }

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
          },
          systemInstruction: currentSystemInstruction,
            tools: [
              { functionDeclarations: getToolDeclarations() }
            ],
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
              stopPlayback();
            }

            if (message.serverContent?.turnComplete) {
              isInterruptedRef.current = false;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              // If we receive new audio, it means the model is speaking a new turn.
              // We must reset the interrupted flag so it doesn't stay stuck muted.
              isInterruptedRef.current = false;
              if (!isMuted) {
                playAudioChunk(base64Audio);
              }
            }

            if (message.serverContent?.modelTurn?.parts) {
               const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
               if (textPart && textPart.text) {
                 const hudMatch = textPart.text.match(/<HUD>(.*?)<\/HUD>/s);
                 if (hudMatch && hudMatch[1]) {
                   onHudData?.(hudMatch[1].trim());
                 }
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
            const errMsg = err?.message || String(err);
            if (isDisconnectingRef.current || errMsg.toLowerCase().includes('aborted')) return;
            console.error("Live API Error Details:", err);
            onStatusChange?.('API_ERROR');
            
            if (!isIntentionalDisconnectRef.current && reconnectAttemptsRef.current < 3) {
              // Auto-reconnect logic (Exponential Backoff)
              disconnectLiveAPI(false, false); // Silent disconnect
              reconnectAttemptsRef.current++;
              const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
              onStatusChange?.(`RECONNECTING (${reconnectAttemptsRef.current}/3)...`);
              reconnectTimeoutRef.current = window.setTimeout(() => {
                isDisconnectingRef.current = false; // Reset to allow reconnect
                connectLiveAPI(false); // Silent connect
              }, delay);
            } else {
              // Graceful disconnect on fatal error or max attempts
              setTimeout(() => disconnectLiveAPI(true, true), 2000);
            }
          },
          onclose: () => {
            console.log("Live API: Connection closed");
            if (!isIntentionalDisconnectRef.current && reconnectAttemptsRef.current < 3) {
              disconnectLiveAPI(false, false); // Silent disconnect
              reconnectAttemptsRef.current++;
              const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
              onStatusChange?.(`RECONNECTING (${reconnectAttemptsRef.current}/3)...`);
              reconnectTimeoutRef.current = window.setTimeout(() => {
                isDisconnectingRef.current = false;
                connectLiveAPI(false); // Silent connect
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
      if (err.name === 'NotAllowedError') {
        onStatusChange?.("MIC_DENIED");
      } else if (err.name === 'NotFoundError') {
        onStatusChange?.("NO_MIC_FOUND");
      } else {
        onStatusChange?.("MIC_ERROR");
      }
      playBeep('stop');
    }
  }, [isLiveConnected, playBeep, onStatusChange, isMuted, isInputMuted, playAudioChunk, stopPlayback, onHudData, disconnectLiveAPI, setIsLiveConnected, setIsListening]);

  const sendText = useCallback((text: string) => {
    if (sessionPromiseRef.current && !isDisconnectingRef.current) {
      sessionPromiseRef.current.then((session: any) => {
        if (isDisconnectingRef.current) return;
        session.sendRealtimeInput({ text });
      });
      return true;
    }
    return false;
  }, []);

  // Audio analysis loop (Optimized to ~15fps to save CPU)
  useEffect(() => {
    const intervalId = setInterval(() => {
      let speaking = false;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Optimized loop instead of .reduce()
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        speaking = avg > 2;
      }
      setIsSpeaking(speaking);
      
      speakingLevelRef.current += ((speaking ? 1 : 0) - speakingLevelRef.current) * 0.2; // Adjusted smoothing for lower framerate
    }, 66); // ~15 fps
    
    return () => clearInterval(intervalId);
  }, [setIsSpeaking]);

  return {
    isLiveConnected,
    isListening,
    isSpeaking,
    speakingLevel: speakingLevelRef.current,
    connectLiveAPI,
    disconnectLiveAPI,
    sendText,
    analyser: analyserRef.current
  };
}
