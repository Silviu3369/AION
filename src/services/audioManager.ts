import { floatTo16BitPCM, base64ToArrayBuffer, pcm16ToFloat32, arrayBufferToBase64 } from '../lib/audioUtils';

const WORKLET_CODE = `
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
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

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private beepContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private gainNode: GainNode | null = null;

  async initialize(onAudioData: (base64: string) => void) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    this.playbackContext = new AudioContextClass({ sampleRate: 24000 });

    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    if (this.playbackContext.state === 'suspended') await this.playbackContext.resume();

    this.analyser = this.playbackContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.connect(this.playbackContext.destination);

    this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        sampleRate: 16000, 
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 2.5;
    source.connect(this.gainNode);

    try {
      const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(workletUrl);
      
      this.processor = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');
      (this.processor as AudioWorkletNode).port.onmessage = (e) => {
        const pcm16 = floatTo16BitPCM(e.data);
        onAudioData(arrayBufferToBase64(pcm16));
      };
    } catch (e) {
      console.warn("Falling back to ScriptProcessorNode", e);
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      (this.processor as ScriptProcessorNode).onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        onAudioData(arrayBufferToBase64(pcm16));
      };
    }

    this.gainNode.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    this.nextPlayTime = this.playbackContext.currentTime;
  }

  playBeep(type: 'start' | 'stop') {
    try {
      if (!this.beepContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.beepContext = new AudioContextClass();
      }
      const ctx = this.beepContext;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const freq = type === 'start' ? [600, 1200] : [1200, 600];
      osc.frequency.setValueAtTime(freq[0], ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq[1], ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Beep failed", e);
    }
  }

  playAudioChunk(base64Audio: string) {
    if (!this.playbackContext || !this.analyser) return;

    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const float32Data = pcm16ToFloat32(arrayBuffer);
    const buffer = this.playbackContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);

    const startTime = Math.max(this.playbackContext.currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;

    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  stopPlayback() {
    this.activeSources.forEach(s => { try { s.stop(); } catch {} });
    this.activeSources = [];
    if (this.playbackContext) this.nextPlayTime = this.playbackContext.currentTime;
  }

  getAnalyser() {
    return this.analyser;
  }

  close() {
    this.stopPlayback();
    if (this.processor) this.processor.disconnect();
    if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
    if (this.playbackContext) this.playbackContext.close();
    if (this.beepContext) this.beepContext.close();
    
    this.processor = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.playbackContext = null;
    this.beepContext = null;
    this.analyser = null;
  }
}
