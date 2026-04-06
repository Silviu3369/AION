import { useState, useEffect } from 'react';

export interface SystemStats {
  battery: { level: number; charging: boolean; supported: boolean };
  network: { type: string; downlink: number; supported: boolean };
  memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number; supported: boolean };
  uptime: number; // in seconds
}

export function useSystemMonitor() {
  const [stats, setStats] = useState<SystemStats>({
    battery: { level: 100, charging: false, supported: false },
    network: { type: 'unknown', downlink: 0, supported: false },
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, supported: false },
    uptime: 0
  });

  useEffect(() => {
    let startTime = Date.now();
    let batteryRef: any = null;

    // 1. Uptime Timer
    const uptimeInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        uptime: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);

    // 2. Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryRef = battery;
        const updateBattery = () => {
          setStats(prev => ({
            ...prev,
            battery: {
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              supported: true
            }
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }

    // 3. Network API
    const updateNetwork = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setStats(prev => ({
          ...prev,
          network: {
            type: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            supported: true
          }
        }));
      }
    };
    updateNetwork();
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetwork);
    }

    // 4. Memory API (Performance)
    const memoryInterval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        setStats(prev => ({
          ...prev,
          memory: {
            usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
            totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
            jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
            supported: true
          }
        }));
      }
    }, 2000);

    return () => {
      clearInterval(uptimeInterval);
      clearInterval(memoryInterval);
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', () => {});
        batteryRef.removeEventListener('chargingchange', () => {});
      }
      if (connection) {
        connection.removeEventListener('change', updateNetwork);
      }
    };
  }, []);

  return stats;
}
