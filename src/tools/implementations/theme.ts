import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';

export const changeUIThemeTool: AionTool = {
  name: "changeUITheme",
  declaration: {
    name: "changeUITheme",
    description: "Change the primary color theme of the AION interface particles.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        hexCode: { type: Type.STRING, description: "The hex code for the color (e.g., '#FF0000' for red, '#00FF00' for green, '#00f2ff' for cyan)" }
      },
      required: ["hexCode"]
    }
  },
  execute: (args) => {
    useUIStore.getState().setThemeColor(args.hexCode);
    return { result: `Theme changed successfully to ${args.hexCode}` };
  }
};
