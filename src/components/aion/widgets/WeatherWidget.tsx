import React from 'react';

interface WeatherWidgetProps {
  data: any;
}

export function WeatherWidget({ data }: WeatherWidgetProps) {
  if (!data) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center py-4">
      <div className="text-4xl font-light text-jarvis-cyan mb-2">
        {data.temperature_2m}°C
      </div>
      <div className="flex gap-4 text-xs text-jarvis-cyan/70">
        <span>Wind: {data.wind_speed_10m} km/h</span>
        <span>Code: {data.weather_code}</span>
      </div>
    </div>
  );
}
