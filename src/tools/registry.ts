import { FunctionDeclaration } from '@google/genai';
import { useUIStore } from '../store/useUIStore';
import { useAIStore } from '../store/useAIStore';

export interface ToolContext {
  audioRef?: React.RefObject<HTMLAudioElement>;
}

export interface AionTool {
  name: string;
  declaration: FunctionDeclaration;
  execute: (args: any, context: ToolContext) => Promise<any> | any;
}

const tools: Record<string, AionTool> = {};

export function registerTool(tool: AionTool) {
  tools[tool.name] = tool;
}

export function getToolDeclarations(): FunctionDeclaration[] {
  return Object.values(tools).map(t => t.declaration);
}

export async function executeTool(name: string, args: any, context: ToolContext): Promise<any> {
  const tool = tools[name];
  if (!tool) {
    console.warn(`Tool ${name} not found in registry.`);
    return { error: `Tool ${name} not found.` };
  }
  try {
    return await tool.execute(args, context);
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return { error: `Execution failed: ${error}` };
  }
}
