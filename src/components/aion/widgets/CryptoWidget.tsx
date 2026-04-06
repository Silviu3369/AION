import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CryptoWidgetProps {
  data: any;
  themeColor: string;
}

export function CryptoWidget({ data, themeColor }: CryptoWidgetProps) {
  if (!data) return null;

  const formatCryptoPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-2">
      <div className="text-3xl font-bold text-jarvis-cyan mb-1">
        ${formatCryptoPrice(data.usd)}
      </div>
      <div className={`text-sm mb-2 ${data.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {data.usd_24h_change >= 0 ? '+' : ''}{data.usd_24h_change?.toFixed(2)}% (24h)
      </div>
      
      {data.chart && (
        <div className="w-full h-32 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart}>
              <defs>
                <linearGradient id="cryptoColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColor + '20'} vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: `1px solid ${themeColor}`, fontSize: '10px', borderRadius: '4px' }}
                itemStyle={{ color: themeColor }}
                formatter={(value: number) => [`$${formatCryptoPrice(value)}`, 'Price']}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="value" stroke={themeColor} strokeWidth={2} fillOpacity={1} fill="url(#cryptoColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
