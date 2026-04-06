import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { fetchWeather } from '../../services/apiServices';

export const getWeatherTool: AionTool = {
  name: "getWeather",
  declaration: {
    name: "getWeather",
    description: "Get the current weather for a specific location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: "The city and country (e.g., 'Bucharest, RO')" }
      },
      required: ["location"]
    }
  },
  execute: async (args) => {
    const { location } = args;
    const res = await fetchWeather(location);
    if (res.success) {
      useUIStore.getState().setLeftPanelContent({ type: 'weather', title: res.title, data: res.data });
    } else {
      useUIStore.getState().setLeftPanelContent({ type: 'weather', title: `Vremea: ${location}`, data: { error: res.error } });
    }
    return { result: `Fetching and displaying weather for: ${location}` };
  }
};
