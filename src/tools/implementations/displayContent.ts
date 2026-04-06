import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';

export const displayContentTool: AionTool = {
  name: "displayContent",
  declaration: {
    name: "displayContent",
    description: "Display various types of content in the left panel (charts, videos, images, sensor monitors).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        contentType: { 
          type: Type.STRING, 
          description: "The type of content: 'chart', 'video', 'image', 'sensor', 'weather', 'crypto', 'news', 'smart_home', or 'none' to clear" 
        },
        title: { type: Type.STRING, description: "A title for the content display" },
        data: { 
          type: Type.STRING, 
          description: "The data to display. For 'chart', it should be a JSON string of an array of objects. For 'video', it's a YouTube ID. For 'image', it's a RAW URL (e.g., https://example.com/img.jpg). For 'sensor', it's a JSON string of sensor values." 
        }
      },
      required: ["contentType"]
    }
  },
  execute: (args) => {
    const { contentType, title, data } = args;
    let parsedData = data;
    if (contentType === 'chart' || contentType === 'sensor') {
      try { parsedData = JSON.parse(data); } catch (e) { parsedData = data; }
    }
    useUIStore.getState().setLeftPanelContent({ type: contentType, title, data: parsedData });
    return { result: `Displaying ${contentType} content: ${title}` };
  }
};
