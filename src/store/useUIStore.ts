import { create } from 'zustand';

interface UIState {
  themeColor: string;
  neuralMode: 'calm' | 'brainstorm' | 'alert';
  isTerminalOpen: boolean;
  leftPanelContent: {
    type: 'chart' | 'video' | 'image' | 'sensor' | 'weather' | 'crypto' | 'news' | 'code' | 'smart_home' | 'none';
    data?: any;
    title?: string;
  };
  smartHomeState: {
    lights: { state: string; color?: string };
    thermostat: { value: string };
    security: { state: string };
    blinds: { state: string };
  };
  
  setThemeColor: (color: string) => void;
  setNeuralMode: (mode: 'calm' | 'brainstorm' | 'alert') => void;
  setIsTerminalOpen: (isOpen: boolean) => void;
  setLeftPanelContent: (content: UIState['leftPanelContent']) => void;
  updateSmartHomeDevice: (device: string, action: string, value?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeColor: '#00f2ff',
  neuralMode: 'calm',
  isTerminalOpen: true,
  leftPanelContent: { type: 'none' },
  smartHomeState: {
    lights: { state: 'off', color: 'cyan' },
    thermostat: { value: '22' },
    security: { state: 'disarmed' },
    blinds: { state: 'closed' }
  },

  setThemeColor: (color) => set({ themeColor: color }),
  setNeuralMode: (mode) => set({ neuralMode: mode }),
  setIsTerminalOpen: (isOpen) => set({ isTerminalOpen: isOpen }),
  setLeftPanelContent: (content) => set({ leftPanelContent: content }),
  
  updateSmartHomeDevice: (device, action, value) => set((state) => {
    const newState = { ...state.smartHomeState } as any;
    if (device === 'lights') {
      if (action === 'on' || action === 'off') newState.lights.state = action;
      if (value) newState.lights.color = value;
    } else if (device === 'thermostat') {
      if (value) newState.thermostat.value = value;
    } else if (device === 'security') {
      if (action === 'arm') newState.security.state = 'armed';
      if (action === 'disarm') newState.security.state = 'disarmed';
    } else if (device === 'blinds') {
      if (action === 'open' || action === 'close') newState.blinds.state = action;
    }
    
    return {
      smartHomeState: newState,
      leftPanelContent: {
        type: 'smart_home',
        title: 'SMART_HOME_DIAGNOSTICS',
        data: newState
      }
    };
  })
}));
