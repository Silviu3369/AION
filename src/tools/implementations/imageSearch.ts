import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { fetchImageSearch } from '../../services/apiServices';

export const searchImageTool: AionTool = {
  name: "searchImage",
  declaration: {
    name: "searchImage",
    description: "Search for a real image online based on a query and display it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The subject of the image to search for (e.g., 'nebula', 'cyberpunk city', 'bitcoin chart')" },
        title: { type: Type.STRING, description: "A title for the image display" }
      },
      required: ["query"]
    }
  },
  execute: async (args) => {
    const { query, title } = args;
    const res = await fetchImageSearch(query, title);
    if (res.success) {
      useUIStore.getState().setLeftPanelContent({ type: 'image', title: res.title, data: res.data });
    } else {
      useUIStore.getState().setLeftPanelContent({ type: 'image', title: 'Eroare', data: { error: res.error } });
    }
    return { result: `Searching and displaying image for: ${query}` };
  }
};
