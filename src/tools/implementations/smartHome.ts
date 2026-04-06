import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';

export const controlSmartHomeTool: AionTool = {
  name: "controlSmartHome",
  declaration: {
    name: "controlSmartHome",
    description: "Control smart home devices (lights, thermostat, locks, etc.)",
    parameters: {
      type: Type.OBJECT,
      properties: {
        device: { type: Type.STRING, description: "The device to control (e.g., 'living_room_light', 'thermostat', 'front_door')" },
        action: { type: Type.STRING, description: "The action to perform (e.g., 'turn_on', 'turn_off', 'set_temperature', 'lock', 'unlock')" },
        value: { type: Type.STRING, description: "Optional value for the action (e.g., '22' for temperature, '#ff0000' for color)" }
      },
      required: ["device", "action"]
    }
  },
  execute: (args) => {
    const { device, action, value } = args;
    useUIStore.getState().updateSmartHomeDevice(device, action, value);
    useUIStore.getState().setLeftPanelContent({ type: 'smart_home', title: 'Smart Home Control', data: null });
    return { result: `Executed ${action} on ${device}${value ? ` with value ${value}` : ''}.` };
  }
};
