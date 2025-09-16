'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { ThermometerSun, AlertTriangle, CheckCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { SensorReading } from '@/lib/sensorDataService';

interface SensorCardProps {
  sensor: {
    id: string;
    name: string;
    temperature: number;
    humidity: number;
    status: 'normal' | 'warning' | 'critical';
    timestamp: string;
    building: string;
    location: string;
  };
  getStatusIcon?: (status: string) => React.ReactNode;
  getStatusColor?: (status: string) => string;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const [isClient, setIsClient] = useState(false);
  const [displayTemp, setDisplayTemp] = useState(sensor.temperature);
  const [previousTemp, setPreviousTemp] = useState(sensor.temperature);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animate temperature changes for smooth transitions
  useEffect(() => {
    if (previousTemp !== sensor.temperature) {
      setPreviousTemp(sensor.temperature);
      
      // Animate to the new temperature value
      const startTemp = displayTemp;
      const endTemp = sensor.temperature;
      const duration = 700; // 700ms animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentTemp = startTemp + (endTemp - startTemp) * easeOut;
        
        setDisplayTemp(Number(currentTemp.toFixed(1)));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [sensor.temperature, previousTemp, displayTemp]);

  const getStatusIcon = useMemo(() => {
    switch (sensor.status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  }, [sensor.status]);

  const getStatusColor = useMemo(() => {
    switch (sensor.status) {
      case 'normal':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
    }
  }, [sensor.status]);

  const temperatureStatus = useMemo(() => {
    const referenceTemp = 25.0;
    const deviation = sensor.temperature - referenceTemp;
    
    if (Math.abs(deviation) < 1) {
      return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Normal' };
    } else if (Math.abs(deviation) < 2) {
      return { 
        icon: deviation > 0 ? <TrendingUp className="h-4 w-4 text-yellow-500" /> : <TrendingDown className="h-4 w-4 text-blue-500" />, 
        text: deviation > 0 ? 'High' : 'Low' 
      };
    } else {
      return { 
        icon: deviation > 0 ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />, 
        text: deviation > 0 ? 'Very High' : 'Very Low' 
      };
    }
  }, [sensor.temperature]);

  return (
    <div className={`rounded-lg border-2 ${getStatusColor} p-6 transition-all duration-500 hover:shadow-md transform hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ThermometerSun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {sensor.name}
          </h3>
        </div>
        <div className="transition-all duration-300">
          {getStatusIcon}
        </div>
      </div>

      <div className="space-y-3">
        {/* Temperature Display */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300 transform">
            {displayTemp.toFixed(1)}°C
          </span>
          <div className="flex items-center space-x-1 text-xs">
            {temperatureStatus.icon}
            <span className="text-gray-600 dark:text-gray-400">{temperatureStatus.text}</span>
          </div>
        </div>

        {/* Deviation from Reference */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span>Ref: 25.0°C</span>
          <span className="ml-2">
            Δ: {(displayTemp - 25.0).toFixed(1)}°C
          </span>
        </div>

        {/* Status and Confidence */}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-1 rounded-full font-medium ${
            sensor.status === 'normal' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : sensor.status === 'warning' 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {sensor.status.toUpperCase()}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {sensor.building}
          </span>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Updated: {isClient ? new Date(sensor.timestamp).toLocaleTimeString() : '--:--:--'}
        </div>

        {/* Progress Bar for Temperature Relative to Reference */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-700 ease-in-out transform ${
              sensor.status === 'normal' 
                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                : sensor.status === 'warning' 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                : 'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ 
              width: `${Math.min(Math.max(((sensor.temperature / 35) * 100), 10), 100)}%`,
              transition: 'width 0.7s ease-in-out, background-color 0.3s ease-in-out'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: SensorCardProps, nextProps: SensorCardProps) => {
  const prev = prevProps.sensor;
  const next = nextProps.sensor;
  
  // Only re-render if these specific values changed
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.temperature === next.temperature &&
    prev.humidity === next.humidity &&
    prev.status === next.status &&
    prev.building === next.building &&
    prev.location === next.location
    // Don't compare timestamp to avoid constant re-renders
  );
};

export default memo(SensorCard, arePropsEqual);
