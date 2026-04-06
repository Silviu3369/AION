import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { STATIONS } from '../../constants';
import { useUIStore } from '../../store/useUIStore';

export const controlMusicTool: AionTool = {
  name: "controlMusic",
  declaration: {
    name: "controlMusic",
    description: "Play or stop background radio music. CRITICAL: Use this tool ONLY if the user explicitly asks for music or radio. NEVER start music automatically.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: "'play' or 'stop'" },
        station: { type: Type.STRING, description: "The genre or station to play: 'lofi', 'synthwave', 'ambient', 'jazz', 'electronic', 'indie', 'metal', 'profm' (ProFM RO), 'digifm' (Digi FM RO), 'dancefm' (Dance FM RO), 'chillfm' (Chill FM RO), 'kissfm' (Kiss FM RO), 'magicfm' (Magic FM RO), 'rockfm' (Rock FM RO), 'virgin' (Virgin Radio RO), 'europa' (Europa FM RO), 'guerrilla' (Radio Guerrilla RO), 'contact' (Radio Contact BE)" }
      },
      required: ["action"]
    }
  },
  execute: (args, context) => {
    const { action, station } = args;
    if (action === 'play') {
      const normalizedStation = (station as string)?.toLowerCase().trim() || 'lofi';
      const streamUrl = STATIONS[normalizedStation] || STATIONS['lofi'];
      if (context.audioRef?.current && streamUrl) {
        const currentSrc = context.audioRef.current.src;
        if (currentSrc !== streamUrl) {
          context.audioRef.current.src = streamUrl;
          context.audioRef.current.load();
        }
        const playPromise = context.audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') console.error("Audio play failed:", e);
          });
        }
      }
      useUIStore.getState().setYoutubeVideoId(null);
      return { result: `Started playing ${normalizedStation} radio.` };
    } else {
      if (context.audioRef?.current) {
        context.audioRef.current.pause();
        context.audioRef.current.removeAttribute('src');
        context.audioRef.current.src = '';
      }
      return { result: `Stopped music.` };
    }
  }
};
