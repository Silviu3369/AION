import React from 'react';
import { Home, Lightbulb, Thermometer, ShieldCheck, ShieldAlert, Lock, Unlock, Sun, Moon } from 'lucide-react';

interface SmartHomeWidgetProps {
  data: any;
  title?: string;
}

export function SmartHomeWidget({ data, title }: SmartHomeWidgetProps) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Home className="w-4 h-4 text-jarvis-cyan" />
        <span className="text-[10px] font-bold tracking-widest uppercase">{title || 'SMART_HOME_SYSTEM'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(data).map(([key, device]: [string, any]) => (
          <div key={key} className="p-3 border border-jarvis-cyan/20 bg-jarvis-cyan/5 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] opacity-50 uppercase">{key}</span>
              {key === 'lights' && <Lightbulb className={`w-3 h-3 ${device.state === 'on' ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`} />}
              {key === 'thermostat' && <Thermometer className="w-3 h-3 text-orange-400" />}
              {key === 'security' && (device.state === 'armed' ? <ShieldCheck className="w-3 h-3 text-green-400" /> : <ShieldAlert className="w-3 h-3 text-red-400" />)}
              {key === 'blinds' && (device.state === 'open' ? <Sun className="w-3 h-3 text-yellow-200" /> : <Moon className="w-3 h-3 text-blue-400" />)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold uppercase">
                {device.state || device.value || 'N/A'}
                {key === 'thermostat' && '°C'}
              </span>
              {device.color && <span className="text-[8px] opacity-70" style={{ color: device.color }}>COLOR: {device.color}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
