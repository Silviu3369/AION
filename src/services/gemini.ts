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
  description: "Play or stop background music.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: "'play' or 'stop'" },
      station: { type: Type.STRING, description: "The genre to play: 'lofi', 'synthwave', 'ambient', 'jazz', 'electronic', 'indie', or 'metal'" }
    },
    required: ["action"]
  }
};

