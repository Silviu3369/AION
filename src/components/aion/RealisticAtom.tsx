import React from 'react';

interface RealisticAtomProps {
  themeColor?: string;
  size?: number;
}

export default function RealisticAtom({ themeColor = '#00f0ff', size = 48 }: RealisticAtomProps) {
  return (
    <div 
      className="relative flex items-center justify-center" 
      style={{ width: size, height: size, perspective: '200px' }}
    >
      {/* Nucleus (Core) */}
      <div 
        className="absolute rounded-full z-10 animate-pulse"
        style={{ 
          width: size * 0.2, 
          height: size * 0.2, 
          backgroundColor: themeColor,
          boxShadow: `0 0 ${size * 0.4}px ${themeColor}, 0 0 ${size * 0.8}px ${themeColor}`
        }} 
      />
      
      {/* Orbit 1 */}
      <div className="absolute w-full h-full" style={{ transform: 'rotateZ(0deg) rotateX(70deg)', transformStyle: 'preserve-3d' }}>
        <div 
          className="w-full h-full rounded-full animate-[spin_3s_linear_infinite] relative" 
          style={{ border: `1.5px solid ${themeColor}40`, transformStyle: 'preserve-3d' }}
        >
          {/* Electron */}
          <div 
            className="absolute rounded-full"
            style={{ 
              top: -size * 0.05, 
              left: '50%', 
              width: size * 0.1, 
              height: size * 0.1, 
              backgroundColor: '#ff8a00',
              boxShadow: '0 0 10px #ff8a00, 0 0 20px #ff8a00',
              transform: 'translateX(-50%) rotateX(-70deg)' // Counter-rotate to keep it round
            }} 
          />
        </div>
      </div>

      {/* Orbit 2 */}
      <div className="absolute w-full h-full" style={{ transform: 'rotateZ(60deg) rotateX(70deg)', transformStyle: 'preserve-3d' }}>
        <div 
          className="w-full h-full rounded-full animate-[spin_4s_linear_infinite] relative" 
          style={{ border: `1.5px solid ${themeColor}40`, transformStyle: 'preserve-3d' }}
        >
          {/* Electron */}
          <div 
            className="absolute rounded-full"
            style={{ 
              top: -size * 0.05, 
              left: '50%', 
              width: size * 0.1, 
              height: size * 0.1, 
              backgroundColor: '#ff8a00',
              boxShadow: '0 0 10px #ff8a00, 0 0 20px #ff8a00',
              transform: 'translateX(-50%) rotateX(-70deg)'
            }} 
          />
        </div>
      </div>

      {/* Orbit 3 */}
      <div className="absolute w-full h-full" style={{ transform: 'rotateZ(120deg) rotateX(70deg)', transformStyle: 'preserve-3d' }}>
        <div 
          className="w-full h-full rounded-full animate-[spin_5s_linear_infinite] relative" 
          style={{ border: `1.5px solid ${themeColor}40`, transformStyle: 'preserve-3d' }}
        >
          {/* Electron */}
          <div 
            className="absolute rounded-full"
            style={{ 
              top: -size * 0.05, 
              left: '50%', 
              width: size * 0.1, 
              height: size * 0.1, 
              backgroundColor: '#ff8a00',
              boxShadow: '0 0 10px #ff8a00, 0 0 20px #ff8a00',
              transform: 'translateX(-50%) rotateX(-70deg)'
            }} 
          />
        </div>
      </div>
    </div>
  );
}
