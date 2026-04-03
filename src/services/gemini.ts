import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const changeUITheme: FunctionDeclaration = {
  name: "changeUITheme",
  description: "Change the primary color theme of the AION interface particles.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hexCode: { type: Type.STRING, description: "The hex code for the color (e.g., '#FF0000' for red, '#00FF00' for green, '#00f2ff' for cyan)" }
    },
    required: ["hexCode"]
  }
};

export const setVisualTimer: FunctionDeclaration = {
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
};

export const setNeuralMode: FunctionDeclaration = {
  name: "setNeuralMode",
  description: "Change the behavior and state of the neural network.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: { type: Type.STRING, description: "The mode to set: 'calm', 'brainstorm', or 'alert'" }
    },
    required: ["mode"]
  }
};

export const controlMusic: FunctionDeclaration = {
  name: "controlMusic",
  description: "Play or stop background radio music. CRITICAL: Use this tool ONLY if the user explicitly asks for music or radio. NEVER start music automatically.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "'play' or 'stop'" },
      station: { type: Type.STRING, description: "The genre or station to play: 'lofi', 'synthwave', 'ambient', 'jazz', 'electronic', 'indie', 'metal', 'profm' (ProFM RO), 'digifm' (Digi FM RO), 'contact' (Radio Contact BE)" }
    },
    required: ["action"]
  }
};

export const playYouTubeMusic: FunctionDeclaration = {
  name: "playYouTubeMusic",
  description: "Search and play a specific song or artist from YouTube. CRITICAL: Use this tool ONLY if the user explicitly asks for a specific song or artist. NEVER start music automatically.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The song name or artist to search for (e.g., 'Interstellar soundtrack', 'Lofi hip hop')" }
    },
    required: ["query"]
  }
};

export const displayContent: FunctionDeclaration = {
  name: "displayContent",
  description: "Display various types of content in the left panel (charts, videos, images, sensor monitors).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      contentType: { 
        type: Type.STRING, 
        description: "The type of content: 'chart', 'video', 'image', 'sensor', or 'none' to clear" 
      },
      title: { type: Type.STRING, description: "A title for the content display" },
      data: { 
        type: Type.STRING, 
        description: "The data to display. For 'chart', it should be a JSON string of an array of objects. For 'video', it's a YouTube ID. For 'image', it's a RAW URL (e.g., https://example.com/img.jpg). For 'sensor', it's a JSON string of sensor values." 
      }
    },
    required: ["contentType"]
  }
};

