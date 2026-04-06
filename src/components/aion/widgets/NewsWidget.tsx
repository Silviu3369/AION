import React from 'react';

interface NewsWidgetProps {
  data: any;
}

export function NewsWidget({ data }: NewsWidgetProps) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="w-full space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
      {data.map((item: any, idx: number) => (
        <div key={idx} className="border-b border-jarvis-cyan/10 pb-2">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-jarvis-cyan hover:text-jarvis-orange transition-colors block mb-1 pointer-events-auto">
            {item.title}
          </a>
          <div className="text-[9px] text-jarvis-cyan/50">{new Date(item.pubDate).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}
