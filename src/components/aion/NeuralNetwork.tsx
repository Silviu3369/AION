import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/useUIStore';

interface NeuralNetworkProps {
  analyser: AnalyserNode | null;
}

export default function NeuralNetwork({ analyser }: NeuralNetworkProps) {
  const themeColor = useUIStore(state => state.themeColor);
  const neuralMode = useUIStore(state => state.neuralMode);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });
  const speakingLevelRef = useRef(0);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    let animationId: number;
    let time = 0;

    const minDim = Math.min(canvasSize.width, canvasSize.height);
    const scaleFactor = minDim / 800;

    const particles: any[] = [];
    
    // Nucleus
    for(let i=0; i<90; i++) {
        particles.push({
            type: 'nucleus',
            x: (Math.random() - 0.5) * 160 * scaleFactor,
            y: (Math.random() - 0.5) * 160 * scaleFactor,
            z: (Math.random() - 0.5) * 160 * scaleFactor,
            vx: (Math.random() - 0.5) * 1.5 * scaleFactor,
            vy: (Math.random() - 0.5) * 1.5 * scaleFactor,
            vz: (Math.random() - 0.5) * 1.5 * scaleFactor,
            size: (Math.random() * 1.5 + 0.5) * scaleFactor
        });
    }

    // Atom Orbits
    const orbits = [
        { r: 200 * scaleFactor, rx: 1, ry: 0.2, rz: 0.5, speed: 0.005, wobbleFreq: 3, wobbleAmp: 15 * scaleFactor },
        { r: 300 * scaleFactor, rx: 0.3, ry: 1, rz: -0.2, speed: -0.004, wobbleFreq: 5, wobbleAmp: 25 * scaleFactor },
        { r: 400 * scaleFactor, rx: -0.5, ry: 0.4, rz: 1, speed: 0.006, wobbleFreq: 4, wobbleAmp: 20 * scaleFactor }
    ];
    
    orbits.forEach(orbit => {
        for(let i=0; i<120; i++) {
            particles.push({
                type: 'orbit',
                orbit: orbit,
                angle: Math.random() * Math.PI * 2,
                size: Math.random() * 2 + 1
            });
        }
    });

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 242, b: 255 };
    };

    const render = () => {
      // Battery Optimization: Pause heavy calculations when tab is not active
      if (document.hidden) {
        animationId = requestAnimationFrame(render);
        return;
      }

      time += 0.01;
      
      // Real-time audio analysis for perfect sync
      let speaking = false;
      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        speaking = avg > 2;
      }
      
      speakingLevelRef.current += ((speaking ? 1 : 0) - speakingLevelRef.current) * 0.1;
      const speakingLevel = speakingLevelRef.current;
      
      // Standby pulse when not speaking or connected
      const standbyPulse = Math.sin(time * 2) * 0.05 + 0.1;
      const effectiveLevel = Math.max(speakingLevel, standbyPulse);
      
      let speedMult = effectiveLevel > 0.15 ? 2.5 : 1;
      if (neuralMode === 'alert') speedMult = effectiveLevel > 0.15 ? 5 : 4;
      if (neuralMode === 'brainstorm') speedMult = effectiveLevel > 0.15 ? 3.5 : 2;

      let rgb = hexToRgb(themeColor);
      if (neuralMode === 'alert') rgb = { r: 255, g: 0, b: 0 };

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 5, 15, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'lighter';

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      const rotX = time * 0.3;
      const rotY = time * 0.4;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      particles.forEach(p => {
          let px, py, pz;

          if (p.type === 'nucleus') {
              if (speakingLevel > 0.1) {
                  const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
                  if (d > 10) {
                      p.vx += (p.x / d) * 0.02 * speakingLevel;
                      p.vy += (p.y / d) * 0.02 * speakingLevel;
                      p.vz += (p.z / d) * 0.02 * speakingLevel;
                  }
              }

              p.x += p.vx * speedMult;
              p.y += p.vy * speedMult;
              p.z += p.vz * speedMult;
              
              const d = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
              const currentLimit = (90 + 40 * speakingLevel) * scaleFactor;
              
              if (d > currentLimit) {
                  const nx = p.x / d;
                  const ny = p.y / d;
                  const nz = p.z / d;
                  const dot = p.vx * nx + p.vy * ny + p.vz * nz;
                  if (dot > 0) {
                      p.vx -= 2 * dot * nx;
                      p.vy -= 2 * dot * ny;
                      p.vz -= 2 * dot * nz;
                  }
              }
              px = p.x; py = p.y; pz = p.z;
          } else {
              p.angle += p.orbit.speed * speedMult;
              const currentR = p.orbit.r + Math.sin(p.angle * p.orbit.wobbleFreq) * p.orbit.wobbleAmp;
              const bx = Math.cos(p.angle) * currentR;
              const by = Math.sin(p.angle) * currentR;
              px = bx * p.orbit.rx;
              py = by * p.orbit.ry;
              pz = bx * p.orbit.rz + by;
          }

          let y1 = py * cosX - pz * sinX;
          let z1 = py * sinX + pz * cosX;
          let x2 = px * cosY + z1 * sinY;
          let z2 = -px * sinY + z1 * cosY;

          const fov = 800;
          const zOffset = 600;
          const zDepth = z2 + zOffset;

          if (zDepth > 0) {
              p.scale = fov / zDepth;
              p.sx = cx + x2 * p.scale;
              p.sy = cy + y1 * p.scale;
              p.alpha = Math.max(0, Math.min(1, (z2 + 400) / 800));
          } else {
              p.alpha = 0;
          }
      });

      ctx.lineWidth = 0.8; 
      const baseDist = 12000;
      const expandDist = 10000 * speakingLevel;
      let maxDistSq = (baseDist + expandDist) * scaleFactor * scaleFactor;
      
      if (neuralMode === 'brainstorm') maxDistSq *= 1.5;

      for(let i=0; i<particles.length; i++) {
          const p1 = particles[i];
          if (p1.alpha <= 0) continue;
          
          for(let j=i+1; j<particles.length; j++) {
              const p2 = particles[j];
              if (p2.alpha <= 0) continue;
              
              const dx = p1.sx - p2.sx;
              const dy = p1.sy - p2.sy;
              const distSq = dx*dx + dy*dy;
              
              if (distSq < maxDistSq) {
                  const a = (1 - distSq/maxDistSq) * Math.min(p1.alpha, p2.alpha);
                  const currentOpacity = 0.1 + (0.1 * speakingLevel);
                  ctx.strokeStyle = `rgba(255, 140, 0, ${a * currentOpacity})`;
                  ctx.beginPath();
                  ctx.moveTo(p1.sx, p1.sy);
                  ctx.lineTo(p2.sx, p2.sy);
                  ctx.stroke();
              }
          }
      }

      particles.forEach(p => {
          if (p.alpha <= 0) return;
          const size = p.size * p.scale * (1 + 0.2 * speakingLevel);
          
          const r = rgb.r + (255 - rgb.r) * speakingLevel;
          const g = rgb.g + (255 - rgb.g) * speakingLevel;
          const b = rgb.b + (255 - rgb.b) * speakingLevel;
          const a = p.alpha * (1 - 0.4 * speakingLevel);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size, 0, Math.PI*2);
          ctx.fill();
      });

      const glowRadius = (150 + 50 * speakingLevel) * scaleFactor;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      const glowOpacity = 0.01 + (0.01 * speakingLevel);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowOpacity})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI*2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [canvasSize, themeColor, neuralMode, analyser]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full" 
      />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
    </div>
  );
}
