import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { getAI } from '../../services/gemini';

export const generateImageTool: AionTool = {
  name: "generateImage",
  declaration: {
    name: "generateImage",
    description: "Generate an AI image based on a prompt and display it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: "The prompt to generate the image from" }
      },
      required: ["prompt"]
    }
  },
  execute: async (args) => {
    const { prompt } = args;
    try {
      useUIStore.getState().setLeftPanelContent({ type: 'image', title: 'Generating AI Image...', data: 'loading' });
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt
      });
      const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64) {
        useUIStore.getState().setLeftPanelContent({ type: 'image', title: `Generated: ${prompt}`, data: `data:image/jpeg;base64,${base64}` });
      } else {
        useUIStore.getState().setLeftPanelContent({ type: 'image', title: 'Error', data: { error: 'Failed to generate image.' } });
      }
    } catch (e) {
      console.error("Image generation failed:", e);
      useUIStore.getState().setLeftPanelContent({ type: 'image', title: 'Error', data: { error: 'Failed to generate image.' } });
    }
    return { result: `Generating and displaying AI image for prompt: ${prompt}` };
  }
};
