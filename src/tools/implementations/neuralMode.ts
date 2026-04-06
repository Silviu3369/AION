import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';

export const setNeuralModeTool: AionTool = {
  name: "setNeuralMode",
  declaration: {
    name: "setNeuralMode",
    description: "Change the behavior and state of the neural network.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING, description: "The mode to set: 'calm', 'brainstorm', or 'alert'" }
      },
      required: ["mode"]
    }
  },
  execute: (args) => {
    useUIStore.getState().setNeuralMode(args.mode);
    return { result: `Neural mode changed to ${args.mode}` };
  }
};
