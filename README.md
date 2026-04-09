# AION Core

AION is a high-performance, real-time AI assistant powered by the Gemini 3.1 Live API. It features a multimodal neural interface, integrated smart home controls, and a live audio processing pipeline.

## Architecture

- **Live API Pipeline**: Located in `src/hooks/useLiveAPI.ts`. Handles WebSocket connections to Gemini, raw PCM audio capture via AudioWorklets, and low-latency playback.
- **State Management**: Powered by Zustand (`src/store`). Separates AI session state from UI/Environment state.
- **Tool Registry**: Extensible tool system in `src/tools` allowing the AI to interact with the web and local state.
- **Neural UI**: A React-based frontend using Tailwind CSS and Framer Motion for high-fidelity visual feedback.

## Key Features

- **Full-Duplex Voice**: Real-time interruption handling and low-latency response.
- **HUD Interface**: Dynamic data display (Weather, Crypto, News) driven by AI tool calls.
- **Smart Home Integration**: Simulated IoT control panel.
- **Neural Visualization**: Real-time audio frequency analysis mapped to visual nodes.

## Development

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`

## Technical Constraints

- Requires a valid `GEMINI_API_KEY` in the environment.
- Audio capture requires `AudioWorklet` support in the browser.
- Best experienced in Chrome or Safari.
