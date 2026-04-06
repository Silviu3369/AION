import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useAIStore } from '../../store/useAIStore';

export const setVisualTimerTool: AionTool = {
  name: "setVisualTimer",
  declaration: {
    name: "setVisualTimer",
    description: "Set a visual countdown timer on the screen.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        seconds: { type: Type.NUMBER, description: "Duration of the timer in seconds" },
        label: { type: Type.STRING, description: "What the timer is for (e.g., 'Boil eggs', 'Break')" }
      },
      required: ["seconds", "label"]
    }
  },
  execute: (args) => {
    useAIStore.getState().setTimer({ remaining: args.seconds, label: args.label });
    return { result: `Timer set for ${args.seconds} seconds with label ${args.label}` };
  }
};
