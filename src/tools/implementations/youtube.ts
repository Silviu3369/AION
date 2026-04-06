import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';

export const playYouTubeMusicTool: AionTool = {
  name: "playYouTubeMusic",
  declaration: {
    name: "playYouTubeMusic",
    description: "Search and play a specific song or artist from YouTube. CRITICAL: Use this tool ONLY if the user explicitly asks for a specific song or artist. NEVER start music automatically.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The song name or artist to search for (e.g., 'Interstellar soundtrack', 'Lofi hip hop')" }
      },
      required: ["query"]
    }
  },
  execute: (args, context) => {
    const query = args.query;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    useAIStore.getState().addMessage({ 
      role: 'model', 
      text: `Redarea directă de pe YouTube necesită o cheie API care a fost eliminată. Poți asculta piesa aici: ${searchUrl}` 
    });
    
    if (context.audioRef?.current) {
      context.audioRef.current.pause();
      context.audioRef.current.src = '';
      context.audioRef.current.removeAttribute('src');
    }
    useUIStore.getState().setYoutubeVideoId(null);
    
    return { result: `Searching and playing ${query} on YouTube.` };
  }
};
