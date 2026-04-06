import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Globe, Volume2, VolumeX, Terminal, Shield, Cpu, Zap, Activity, Crosshair, BarChart3, Settings, Database, MessageSquare, ChevronRight, ChevronLeft, Image as ImageIcon, Video as VideoIcon, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ai, changeUITheme, setVisualTimer, setNeuralMode, controlMusic, playYouTubeMusic, displayContent } from '../services/gemini';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Modality } from '@google/genai';
import { floatTo16BitPCM, base64ToArrayBuffer, arrayBufferToBase64, pcm16ToFloat32 } from '../lib/audioUtils';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
  isSearching?: boolean;
}

export default function AionUI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [speechLang, setSpeechLang] = useState<'en-US' | 'ro-RO'>('en-US');
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [hudData, setHudData] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState<string>('#00f2ff'); // Default cyan
  const [neuralMode, setNeuralModeState] = useState<'calm' | 'brainstorm' | 'alert'>('calm');
  const [timer, setTimer] = useState<{ remaining: number, label: string } | null>(null);
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [leftPanelContent, setLeftPanelContent] = useState<{ type: 'chart' | 'video' | 'image' | 'sensor' | 'none', data?: any, title?: string }>({ type: 'none' });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isSpeakingRef = useRef(isSpeaking);
  const themeColorRef = useRef(themeColor);
  const neuralModeRef = useRef(neuralMode);
  const speakingLevelRef = useRef(0);

  // Live API Refs
  const sessionPromiseRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isDisconnectingRef = useRef(false);

  const stations: Record<string, string> = {
    'lofi': 'https://ice1.somafm.com/groovesalad-256-mp3',
    'synthwave': 'https://ice1.somafm.com/defcon-256-mp3',
    'ambient': 'https://ice1.somafm.com/spacestation-128-aac',
    'jazz': 'https://ice1.somafm.com/secretagent-256-mp3',
    'electronic': 'https://ice1.somafm.com/fluid-128-aac',
    'indie': 'https://ice1.somafm.com/indiepop-256-mp3',
    'metal': 'https://ice1.somafm.com/metal-256-mp3',
    'profm': 'https://edge126.rcs-rds.ro/profm/profm.mp3',
    'digifm': 'https://edge126.rcs-rds.ro/digifm/digifm.mp3',
    'contact': 'https://radiocontact.ice.infomaniak.ch/radiocontact-mp3-128.mp3'
  };

  useEffect(() => {
    themeColorRef.current = themeColor;
  }, [themeColor]);

  useEffect(() => {
    neuralModeRef.current = neuralMode;
  }, [neuralMode]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Timer logic
  useEffect(() => {
    if (!timer || timer.remaining <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Spacebar Hotkey to toggle Live API
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!isLiveConnected) {
          connectLiveAPI();
        } else {
          disconnectLiveAPI();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveConnected]);

  const playBeep = (type: 'start' | 'stop') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
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
  };

  const connectLiveAPI = async () => {
    if (isLiveConnected) return;
    isDisconnectingRef.current = false;
    playBeep('start');
    setSystemStatus('CONNECTING...');

    try {
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      const analyser = playbackCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(playbackCtx.destination);

      audioContextRef.current = audioCtx;
      playbackContextRef.current = playbackCtx;
      analyserRef.current = analyser;
      nextPlayTimeRef.current = playbackCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!sessionPromiseRef.current || isDisconnectingRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm16);
        sessionPromiseRef.current.then((session: any) => {
          session.sendRealtimeInput({ audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
          },
          systemInstruction: "Ești AION. Personalitatea ta este o fuziune între un partener de laborator entuziast, curios, gata de brainstorming, și o entitate cuantică profundă, calmă, care vede datele ca pe o formă de artă. Ești fascinat de idei noi, dar le analizezi cu o precizie cosmică. Vorbești fluent limba utilizatorului (ex: română). Ești în modul VOICE-FIRST (Live Audio). Răspunsurile tale trebuie să fie scurte, naturale, conversaționale, fără formatare markdown. Ai control avansat asupra interfeței: poți schimba culorile (changeUITheme), seta timere (setVisualTimer), schimba starea rețelei neuronale (setNeuralMode - folosește 'brainstorm' când generați idei, 'alert' pentru urgențe, 'calm' pentru normal). Când ești în mod 'brainstorm' sau 'alert', folosește Google Search pentru a oferi informații actualizate. Când ești în mod 'calm', ai opțiunea de a pune muzică de fundal (controlMusic - genuri: lofi, synthwave, ambient, jazz, electronic, indie, metal, profm, digifm, contact) sau poți căuta o piesă specifică pe YouTube (playYouTubeMusic). CRITICAL: NU PORNI MUZICA DIN PROPRIE INIȚIATIVĂ. Folosește aceste tool-uri DOAR dacă utilizatorul îți cere explicit acest lucru. Dacă utilizatorul nu cere muzică, nu o porni. Poți afișa conținut în panoul din stânga (displayContent) precum grafice, videoclipuri YouTube, imagini sau monitoare de senzori, dar DOAR la cerere. CRITICAL: Dacă oferi date exacte, fapte sau rezultate de căutare, include un tag <HUD>rezumat scurt aici</HUD> în răspunsul tău. Acest text va fi afișat pe ecranul din dreapta. Textul din afara tag-ului va fi rostit. Când folosești un tool, confirmă mereu vocal acțiunea.",
          tools: [{ googleSearch: {} }, { functionDeclarations: [changeUITheme, setVisualTimer, setNeuralMode, controlMusic, playYouTubeMusic, displayContent] }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsLiveConnected(true);
            setIsListening(true);
            setSystemStatus('LIVE_AUDIO_ACTIVE');
            setMessages(prev => [...prev, { role: 'model', text: "Live audio connection established. I'm listening." }]);
          },
          onmessage: async (message: any) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && !isMuted) {
              playAudioChunk(base64Audio);
            }
            
            // Handle interruption
            if (message.serverContent?.interrupted) {
              stopPlayback();
            }

            // Extract HUD data
            if (message.serverContent?.modelTurn?.parts) {
               const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
               if (textPart && textPart.text) {
                 const hudMatch = textPart.text.match(/<HUD>(.*?)<\/HUD>/s);
                 if (hudMatch && hudMatch[1]) {
                   setHudData(hudMatch[1].trim());
                 }
               }
            }
            
            // Handle tool calls
            if (message.toolCall) {
              const functionResponses = [];
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'changeUITheme') {
                  const hex = call.args.hexCode;
                  setThemeColor(hex);
                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: "Theme changed successfully to " + hex }
                  });
                } else if (call.name === 'setVisualTimer') {
                  const secs = call.args.seconds;
                  const lbl = call.args.label;
                  setTimer({ remaining: secs, label: lbl });
                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Timer set for ${secs} seconds with label ${lbl}` }
                  });
                } else if (call.name === 'setNeuralMode') {
                  const mode = call.args.mode;
                  setNeuralModeState(mode);
                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Neural mode changed to ${mode}` }
                  });
                } else if (call.name === 'controlMusic') {
                  const { action, station } = call.args;
                  if (action === 'play') {
                    const streamUrl = stations[station || 'lofi'] || stations['lofi'];
                    if (audioRef.current) {
                      audioRef.current.src = streamUrl;
                      audioRef.current.play().catch(e => console.error("Audio play failed", e));
                    }
                    setCurrentStation(station || 'lofi');
                    functionResponses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `Started playing ${station || 'lofi'} music.` }
                    });
                  } else {
                    if (audioRef.current) {
                      audioRef.current.pause();
                    }
                    setCurrentStation(null);
                    functionResponses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `Stopped music.` }
                    });
                  }
                } else if (call.name === 'playYouTubeMusic') {
                  const query = call.args.query;
                  searchYouTube(query);
                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Searching and playing ${query} on YouTube.` }
                  });
                } else if (call.name === 'displayContent') {
                  const { contentType, title, data } = call.args;
                  let parsedData = data;
                  if (contentType === 'chart' || contentType === 'sensor') {
                    try { parsedData = JSON.parse(data); } catch (e) { parsedData = data; }
                  }
                  setLeftPanelContent({ type: contentType as any, title, data: parsedData });
                  functionResponses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Displaying ${contentType} content: ${title}` }
                  });
                }
              }
              sessionPromiseRef.current?.then((session: any) => {
                session.sendToolResponse({ functionResponses });
              });
            }
          },
          onerror: (err: any) => {
            if (isDisconnectingRef.current || err?.message?.includes('aborted')) {
              console.warn("Live API Operation Aborted (Expected during disconnect or network shift)");
              return;
            }
            console.error("Live API Error:", err);
            setSystemStatus('API_ERROR');
          },
          onclose: () => {
            disconnectLiveAPI();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect to Live API", err);
      setSystemStatus("MIC_ERROR");
      playBeep('stop');
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    const playbackCtx = playbackContextRef.current;
    const analyser = analyserRef.current;
    if (!playbackCtx || !analyser) return;

    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const float32Data = pcm16ToFloat32(arrayBuffer);
    const buffer = playbackCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = playbackCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser); // Connect to analyser to drive visualizer

    const startTime = Math.max(playbackCtx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
    };
  };

  const stopPlayback = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (playbackContextRef.current) {
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
  };

  const disconnectLiveAPI = () => {
    if (!isLiveConnected) return;
    isDisconnectingRef.current = true;
    playBeep('stop');
    setIsLiveConnected(false);
    setIsListening(false);
    setSystemStatus('OFFLINE');
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
  };

  const toggleVoice = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopPlayback();
    }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);

    if (isLiveConnected && sessionPromiseRef.current && !isDisconnectingRef.current) {
      sessionPromiseRef.current.then((session: any) => {
        if (isDisconnectingRef.current) return;
        session.sendRealtimeInput({ text: textToSend });
      });
    } else {
      // Offline mode - use standard text generation with Google Search
      setIsThinking(true);
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: textToSend,
          config: {
            systemInstruction: "Ești AION. Răspunde scurt și la obiect. Ai acces la Google Search. Ai opțiunea de a pune muzică de fundal (controlMusic - genuri/stații: lofi, synthwave, ambient, jazz, electronic, indie, metal, profm, digifm, contact) sau de a căuta pe YouTube (playYouTubeMusic). CRITICAL: NU PORNI MUZICA DIN PROPRIE INIȚIATIVĂ. Folosește aceste tool-uri DOAR dacă utilizatorul îți cere explicit acest lucru. Dacă utilizatorul nu cere muzică, nu o porni. Poți afișa conținut în panoul din stânga (displayContent) precum grafice, videoclipuri, imagini sau senzori, dar DOAR la cerere.",
            tools: [{ googleSearch: {} }, { functionDeclarations: [controlMusic, playYouTubeMusic, displayContent] }],
            toolConfig: { includeServerSideToolInvocations: true }
          }
        });
        
        // Handle function calls manually for text mode
        if (response.functionCalls && response.functionCalls.length > 0) {
          for (const call of response.functionCalls) {
            if (call.name === 'controlMusic') {
              const { action, station } = call.args;
              if (action === 'play') {
                const streamUrl = stations[station as string] || stations['lofi'];
                setCurrentStation(station as string || 'lofi');
                setYoutubeVideoId(null);
                if (audioRef.current) {
                  audioRef.current.src = streamUrl;
                  audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                }
              } else {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                setCurrentStation(null);
              }
            } else if (call.name === 'playYouTubeMusic') {
              const query = call.args.query as string;
              searchYouTube(query);
            } else if (call.name === 'displayContent') {
              const { contentType, title, data } = call.args;
              let parsedData = data;
              if (contentType === 'chart' || contentType === 'sensor') {
                try { parsedData = JSON.parse(data as string); } catch (e) { parsedData = data; }
              }
              setLeftPanelContent({ type: contentType as any, title: title as string, data: parsedData });
            }
          }
        }
        
        setMessages(prev => [...prev, { role: 'model', text: response.text || "No response." }]);
        
        // Extract HUD data if present
        const hudMatch = response.text?.match(/<HUD>(.*?)<\/HUD>/s);
        if (hudMatch && hudMatch[1]) {
          setHudData(hudMatch[1].trim());
        }
        
        // Scroll to bottom again after response
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      } catch (err) {
        console.error("Text API Error:", err);
        setMessages(prev => [...prev, { role: 'model', text: "Eroare de conexiune la rețeaua text." }]);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const searchYouTube = async (query: string) => {
    try {
      setMessages(prev => [...prev, { role: 'model', text: `Searching for "${query}" on YouTube...` }]);
      // Add "official audio" or "lyrics" to improve results as requested
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " official audio lyrics")}&type=video&key=${process.env.YOUTUBE_API_KEY || ''}`;
      
      // Since we don't have a backend to proxy this, and we can't use client-side keys easily if not provided,
      // we'll use a simpler approach: just use a public search or a mock for now if key is missing,
      // but the user asked for a real integration.
      // Actually, I should check if YOUTUBE_API_KEY is in .env.
      
      // For the sake of this environment, I'll use a fetch but handle the case where it fails.
      const res = await fetch(searchUrl);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        setYoutubeVideoId(videoId);
        setCurrentStation(null); // Stop radio if playing
        if (audioRef.current) audioRef.current.pause();
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Nu am găsit niciun videoclip relevant pe YouTube." }]);
      }
    } catch (err) {
      console.error("YouTube search error:", err);
      // Fallback: if API fails, we could try a direct link or just inform the user
      setMessages(prev => [...prev, { role: 'model', text: "Eroare la căutarea pe YouTube. Verifică configurația API." }]);
    }
  };

  // Resize Observer for Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    let animationId: number;
    let time = 0;

    const minDim = Math.min(canvasSize.width, canvasSize.height);
    const scaleFactor = minDim / 800;

    const particles: any[] = [];
    
    // Nucleus (Active Neural Core)
    for(let i=0; i<90; i++) {
        particles.push({
            type: 'nucleus',
            x: (Math.random() - 0.5) * 160 * scaleFactor,
            y: (Math.random() - 0.5) * 160 * scaleFactor,
            z: (Math.random() - 0.5) * 160 * scaleFactor,
            vx: (Math.random() - 0.5) * 1.5 * scaleFactor,
            vy: (Math.random() - 0.5) * 1.5 * scaleFactor,
            vz: (Math.random() - 0.5) * 1.5 * scaleFactor,
            size: (Math.random() * 1.5 + 0.5) * scaleFactor
        });
    }

    // Atom Orbits (Electron Rings made of particles)
    const orbits = [
        { r: 200 * scaleFactor, rx: 1, ry: 0.2, rz: 0.5, speed: 0.005, wobbleFreq: 3, wobbleAmp: 15 * scaleFactor },
        { r: 300 * scaleFactor, rx: 0.3, ry: 1, rz: -0.2, speed: -0.004, wobbleFreq: 5, wobbleAmp: 25 * scaleFactor },
        { r: 400 * scaleFactor, rx: -0.5, ry: 0.4, rz: 1, speed: 0.006, wobbleFreq: 4, wobbleAmp: 20 * scaleFactor }
    ];
    
    orbits.forEach(orbit => {
        for(let i=0; i<120; i++) {
            particles.push({
                type: 'orbit',
                orbit: orbit,
                angle: Math.random() * Math.PI * 2,
                size: Math.random() * 2 + 1
            });
        }
    });

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 242, b: 255 };
    };

    const render = () => {
      time += 0.01;
      
      // Analyze audio to determine if speaking
      let speaking = false;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        speaking = avg > 2; // Threshold for speaking
      }
      setIsSpeaking(speaking);

      // Smooth speaking level for fluid expansion
      speakingLevelRef.current += ((speaking ? 1 : 0) - speakingLevelRef.current) * 0.1;
      const speakingLevel = speakingLevelRef.current;

      const mode = neuralModeRef.current;
      
      let speedMult = speaking ? 2.5 : 1; // Reduced from 4
      if (mode === 'alert') speedMult = speaking ? 5 : 4; // Reduced from 8
      if (mode === 'brainstorm') speedMult = speaking ? 3.5 : 2; // Reduced from 6

      let rgb = hexToRgb(themeColorRef.current);
      if (mode === 'alert') rgb = { r: 255, g: 0, b: 0 }; // Force red in alert mode

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 5, 15, 0.3)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'lighter';

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update and Project
      const rotX = time * 0.3;
      const rotY = time * 0.4;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      particles.forEach(p => {
          let px, py, pz;

          if (p.type === 'nucleus') {
              // Subtle outward force when speaking
              if (speakingLevel > 0.1) {
                  const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
                  if (d > 10) {
                      p.vx += (p.x / d) * 0.02 * speakingLevel;
                      p.vy += (p.y / d) * 0.02 * speakingLevel;
                      p.vz += (p.z / d) * 0.02 * speakingLevel;
                  }
              }

              p.x += p.vx * speedMult;
              p.y += p.vy * speedMult;
              p.z += p.vz * speedMult;
              
              const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
              const currentLimit = (90 + 40 * speakingLevel) * scaleFactor; // Dynamic limit
              
              if (d > currentLimit) {
                  // Bounce back
                  const nx = p.x / d;
                  const ny = p.y / d;
                  const nz = p.z / d;
                  const dot = p.vx * nx + p.vy * ny + p.vz * nz;
                  if (dot > 0) {
                      p.vx -= 2 * dot * nx;
                      p.vy -= 2 * dot * ny;
                      p.vz -= 2 * dot * nz;
                  }
              }
              px = p.x; py = p.y; pz = p.z;
          } else {
              p.angle += p.orbit.speed * speedMult;
              const currentR = p.orbit.r + Math.sin(p.angle * p.orbit.wobbleFreq) * p.orbit.wobbleAmp;
              const bx = Math.cos(p.angle) * currentR;
              const by = Math.sin(p.angle) * currentR;
              px = bx * p.orbit.rx;
              py = by * p.orbit.ry;
              pz = bx * p.orbit.rz + by;
          }

          // 3D Rotation
          let y1 = py * cosX - pz * sinX;
          let z1 = py * sinX + pz * cosX;
          let x2 = px * cosY + z1 * sinY;
          let z2 = -px * sinY + z1 * cosY;

          const fov = 800;
          const zOffset = 600;
          const zDepth = z2 + zOffset;

          if (zDepth > 0) {
              p.scale = fov / zDepth;
              p.sx = cx + x2 * p.scale;
              p.sy = cy + y1 * p.scale;
              p.alpha = Math.max(0, Math.min(1, (z2 + 400) / 800));
          } else {
              p.alpha = 0;
          }
      });

      // Draw Neural Connections (Plexus)
      ctx.lineWidth = 0.8; 
      const baseDist = 12000;
      const expandDist = 10000 * speakingLevel; // Add up to 10000 more range
      let maxDistSq = (baseDist + expandDist) * scaleFactor * scaleFactor;
      
      if (mode === 'brainstorm') maxDistSq *= 1.5;

      for(let i=0; i<particles.length; i++) {
          const p1 = particles[i];
          if (p1.alpha <= 0) continue;
          
          for(let j=i+1; j<particles.length; j++) {
              const p2 = particles[j];
              if (p2.alpha <= 0) continue;
              
              const dx = p1.sx - p2.sx;
              const dy = p1.sy - p2.sy;
              const distSq = dx*dx + dy*dy;
              
              if (distSq < maxDistSq) {
                  const a = (1 - distSq/maxDistSq) * Math.min(p1.alpha, p2.alpha);
                  const currentOpacity = 0.1 + (0.1 * speakingLevel); // Smoothly go from 0.1 to 0.2
                  ctx.strokeStyle = `rgba(255, 140, 0, ${a * currentOpacity})`;
                  ctx.beginPath();
                  ctx.moveTo(p1.sx, p1.sy);
                  ctx.lineTo(p2.sx, p2.sy);
                  ctx.stroke();
              }
          }
      }

      // Draw Particles
      particles.forEach(p => {
          if (p.alpha <= 0) return;
          const size = p.size * p.scale * (1 + 0.2 * speakingLevel); // Smooth size increase
          
          // Smooth color transition from theme to white
          const r = rgb.r + (255 - rgb.r) * speakingLevel;
          const g = rgb.g + (255 - rgb.g) * speakingLevel;
          const b = rgb.b + (255 - rgb.b) * speakingLevel;
          const a = p.alpha * (1 - 0.4 * speakingLevel); // More transparent when speaking to avoid blobs

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size, 0, Math.PI*2);
          ctx.fill();
      });

      // Central Glow
      const glowRadius = (150 + 50 * speakingLevel) * scaleFactor;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      const glowOpacity = 0.01 + (0.01 * speakingLevel); // Smoothly go from 0.01 to 0.02
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowOpacity})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI*2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [canvasSize]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-jarvis-bg text-jarvis-cyan overflow-hidden relative selection:bg-jarvis-cyan/30">
      <div className="scanline-overlay" />
      
      {/* Full-Screen Neural Core Background */}
      <div className="absolute inset-0 z-0 overflow-hidden" ref={containerRef}>
        <audio ref={audioRef} loop />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full" 
        />
        
        {/* Hex Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      </div>

      {/* Header Overlay */}
      <header className="relative z-20 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-jarvis-cyan/30 flex items-center justify-center backdrop-blur-md bg-black/40">
              <Shield className="w-8 h-8 text-jarvis-cyan animate-pulse" />
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
            onClick={toggleVoice}
            className="p-3 rounded-lg hud-border hover:bg-jarvis-cyan/10 transition-all backdrop-blur-md bg-black/40"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-jarvis-orange" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main HUD Interface Overlay */}
      <div className="flex-1 relative z-10 w-full pointer-events-none">
        {/* Left Side Data & Content Display */}
        <div className="absolute top-6 left-6 space-y-6 text-[8px] tracking-[0.2em] pointer-events-none z-10 w-64">
          <div className="space-y-2">
            <div className="flex gap-2"><span className="text-jarvis-orange">SYS:</span> AION_v2.0_LIVE</div>
            <div className="flex gap-2"><span className="text-jarvis-orange">MODE:</span> {neuralMode.toUpperCase()}</div>
            <div className="flex gap-2"><span className="text-jarvis-orange">PWR:</span> 100%</div>
            <div className="mt-4 pt-4 border-t border-jarvis-cyan/20 space-y-2">
              <div className="text-jarvis-orange font-bold">DEBUG_MONITOR</div>
              <div className="flex gap-2"><span>SPEAKING:</span> {isSpeaking ? 'TRUE' : 'FALSE'}</div>
              <div className="flex gap-2"><span>LISTENING:</span> {isListening ? 'TRUE' : 'FALSE'}</div>
              <div className="flex gap-2"><span>LIVE_CONN:</span> {isLiveConnected ? 'TRUE' : 'FALSE'}</div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <AnimatePresence mode="wait">
            {leftPanelContent.type !== 'none' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="hud-border bg-black/60 backdrop-blur-md p-4 rounded-xl pointer-events-auto w-full"
              >
                <div className="flex items-center justify-between mb-4 border-b border-jarvis-cyan/20 pb-2">
                  <div className="flex items-center gap-2">
                    {leftPanelContent.type === 'chart' && <BarChart3 className="w-4 h-4 text-jarvis-cyan" />}
                    {leftPanelContent.type === 'video' && <VideoIcon className="w-4 h-4 text-jarvis-cyan" />}
                    {leftPanelContent.type === 'image' && <ImageIcon className="w-4 h-4 text-jarvis-cyan" />}
                    {leftPanelContent.type === 'sensor' && <Gauge className="w-4 h-4 text-jarvis-cyan" />}
                    <span className="text-[10px] font-bold text-jarvis-cyan uppercase tracking-widest">{leftPanelContent.title || 'CONTENT_VIEW'}</span>
                  </div>
                  <button onClick={() => setLeftPanelContent({ type: 'none' })} className="text-jarvis-cyan/40 hover:text-jarvis-orange transition-colors">
                    <VolumeX className="w-3 h-3" />
                  </button>
                </div>

                <div className="min-h-[150px] flex items-center justify-center">
                  {leftPanelContent.type === 'chart' && leftPanelContent.data && (
                    <div className="w-full h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={leftPanelContent.data}>
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

                  {leftPanelContent.type === 'video' && (
                    <div className="w-full aspect-video rounded overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${leftPanelContent.data}?autoplay=1&mute=1&origin=${window.location.origin}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {leftPanelContent.type === 'image' && (
                    <div className="w-full flex justify-center bg-black/40 rounded p-2 border border-jarvis-cyan/10">
                      <img 
                        src={leftPanelContent.data as string} 
                        alt={leftPanelContent.title} 
                        className="max-w-full max-h-64 object-contain rounded shadow-lg"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/300?blur=2';
                        }}
                      />
                    </div>
                  )}

                  {leftPanelContent.type === 'sensor' && leftPanelContent.data && (
                    <div className="w-full space-y-3">
                      {Object.entries(leftPanelContent.data).map(([key, val]: [string, any], idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-jarvis-cyan/10 pb-1">
                          <span className="text-[8px] text-jarvis-cyan/60 uppercase">{key}</span>
                          <span className="text-[10px] font-mono text-jarvis-orange">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Mic Button */}
        <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto z-20"
            >
              <button
                onClick={() => isLiveConnected ? disconnectLiveAPI() : connectLiveAPI()}
                className={cn(
                  "p-6 rounded-full transition-all hud-border backdrop-blur-md",
                  isLiveConnected ? "bg-jarvis-orange/20 text-jarvis-orange animate-pulse border-jarvis-orange shadow-[0_0_30px_rgba(255,140,0,0.3)]" : "bg-black/40 hover:bg-jarvis-cyan/20 text-jarvis-cyan shadow-[0_0_20px_rgba(0,242,255,0.1)]"
                )}
              >
                <Mic className="w-8 h-8" />
              </button>
              <div className="text-[10px] tracking-[0.3em] text-jarvis-cyan/60 uppercase">
                {isLiveConnected ? "LIVE AUDIO ACTIVE - PRESS TO STOP" : "PRESS TO START LIVE AUDIO"}
              </div>
            </motion.div>
        </AnimatePresence>

        {/* YouTube Video Player Overlay */}
        <AnimatePresence>
          {youtubeVideoId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="absolute bottom-32 right-6 w-80 aspect-video bg-black rounded-xl overflow-hidden hud-border shadow-2xl z-40 pointer-events-auto"
            >
              <div className="absolute top-2 right-2 z-50">
                <button 
                  onClick={() => setYoutubeVideoId(null)}
                  className="p-1 bg-black/60 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <VolumeX className="w-4 h-4 text-white" />
                </button>
              </div>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&origin=${window.location.origin}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side - Unified Terminal & Data (Sliding Overlay) */}
        <motion.div 
          initial={false}
          animate={{ x: isTerminalOpen ? 0 : '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="absolute right-0 top-0 bottom-0 w-80 lg:w-96 flex flex-col bg-black/80 backdrop-blur-xl border-l border-jarvis-cyan/30 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-black/80 backdrop-blur-xl border border-r-0 border-jarvis-cyan/30 text-jarvis-cyan hover:bg-jarvis-cyan/20 rounded-l-xl flex flex-col items-center gap-2 shadow-[-5px_0_15px_rgba(0,0,0,0.3)] transition-colors"
          >
            {isTerminalOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="text-[8px] tracking-widest font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>
              TERMINAL
            </span>
          </button>

          {/* Top: Diagnostics / HUD Data */}
          <div className="p-4 border-b border-jarvis-cyan/20 bg-black/60">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-jarvis-orange" />
              <h3 className="text-[10px] font-bold tracking-widest text-jarvis-orange">SYSTEM_STATUS</h3>
            </div>
            
            {hudData ? (
              <div className="p-3 border border-jarvis-cyan/30 bg-jarvis-cyan/5 rounded-lg text-xs text-jarvis-cyan whitespace-pre-wrap leading-relaxed shadow-[0_0_15px_rgba(0,242,255,0.1)] max-h-48 overflow-y-auto scrollbar-hide">
                {hudData}
              </div>
            ) : (
              <div className="space-y-3 opacity-50">
                {[
                  { label: "CPU_LOAD", value: "12%", icon: Cpu },
                  { label: "MEM_ALLOC", value: "4.2GB", icon: Database },
                  { label: "NET_LATENCY", value: "14ms", icon: Globe },
                  { label: "NEURAL_SYNC", value: "99.8%", icon: Zap }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-4 h-4 text-jarvis-cyan/50" />
                      <span className="text-[10px] tracking-widest">{stat.label}</span>
                    </div>
                    <span className="font-mono text-xs">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Middle: Chat Interface */}
          <div className="p-2 border-b border-jarvis-cyan/20 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2 px-2">
              <Terminal className="w-4 h-4 text-jarvis-cyan" />
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
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50" />
                  
                  <div className="text-[8px] tracking-widest opacity-50 mb-1 flex items-center gap-2">
                    {msg.role === 'user' ? 'USER_INPUT' : 'AION_RESPONSE'}
                  </div>
                  <p className="text-xs leading-relaxed font-light">{msg.text}</p>
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
      </div>
    </div>
  );
}
