import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { fetchNews } from '../../services/apiServices';

export const getLatestNewsTool: AionTool = {
  name: "getLatestNews",
  declaration: {
    name: "getLatestNews",
    description: "Get the latest news headlines for a specific category.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: "The news category (e.g., 'technology', 'business', 'science', 'general')" }
      },
      required: ["category"]
    }
  },
  execute: async (args) => {
    const { category } = args;
    const res = await fetchNews(category);
    if (res.success) {
      useUIStore.getState().setLeftPanelContent({ type: 'news', title: res.title, data: res.data });
    } else {
      useUIStore.getState().setLeftPanelContent({ type: 'news', title: `Știri: ${category}`, data: { error: res.error } });
    }
    return { result: `Fetching and displaying latest news for category: ${category}` };
  }
};
