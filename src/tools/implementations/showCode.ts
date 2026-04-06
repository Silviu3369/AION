import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';

export const showCodeTool: AionTool = {
  name: "showCode",
  declaration: {
    name: "showCode",
    description: "Display code in the left panel with syntax highlighting.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, description: "The programming language (e.g., 'javascript', 'python', 'html')" },
        code: { type: Type.STRING, description: "The code to display" },
        title: { type: Type.STRING, description: "Optional title for the code snippet" }
      },
      required: ["language", "code"]
    }
  },
  execute: (args) => {
    const { language, code, title } = args;
    useUIStore.getState().setLeftPanelContent({ type: 'code', title: title || language, data: { language, code } });
    return { result: `Displaying ${language} code snippet.` };
  }
};
