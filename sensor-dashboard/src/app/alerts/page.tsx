'use client';

import { useState, useEffect } from 'react';
import AlertsPanel from '@/components/AlertsPanel';

// Mock sensor data for alerts
const generateMockSensorData = () => {
  const sensors = [
    { id: 'VAV-1', name: 'SNE22-1 VAV Room 201' },
    { id: 'VAV-2', name: 'SNE22-1 VAV Room 203' },
    { id: 'VAV-3', name: 'SNE22-1 VAV Room 205' },
    { id: 'VAV-4', name: 'SNE22-1 VAV Room 207' }
  ];

  return sensors.map(sensor => {
    const baseTemp = 25.0;
    const variation = (Math.random() - 0.5) * 8; // ±4°C variation
    const temperature = baseTemp + variation;
    const confidence = Math.random();
    
    let status: 'normal' | 'warning' | 'anomaly' = 'normal';
    if (Math.abs(variation) > 3) {
      status = confidence > 0.7 ? 'anomaly' : 'warning';
    } else if (Math.abs(variation) > 1.5) {
      status = confidence > 0.5 ? 'warning' : 'normal';
    }

    return {
      id: sensor.id,
      name: sensor.name,
      temperature,
      status,
      lastUpdated: new Date(Date.now() - Math.random() * 60000), // Within last minute
      confidence
    };
  });
};

export default function AlertsPage() {
  const [sensorData, setSensorData] = useState(generateMockSensorData());

  // Update sensor data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(generateMockSensorData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <AlertsPanel sensorData={sensorData} />
    </div>
  );
}
