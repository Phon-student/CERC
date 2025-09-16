'use client';

import React, { useState, useEffect } from 'react';
import { ThermometerSun, AlertTriangle, CheckCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { SensorReading } from '@/lib/sensorDataService';

interface SensorCardProps {
  sensor: SensorReading;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatusIcon = () => {
    switch (sensor.status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'anomaly':
        return <Zap className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (sensor.status) {
      case 'normal':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'anomaly':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getTemperatureStatus = () => {
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
  };

  const temperatureStatus = getTemperatureStatus();

  return (
    <div className={`rounded-lg border-2 ${getStatusColor()} p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ThermometerSun className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {sensor.name}
          </h3>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-3">
        {/* Temperature Display */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {sensor.temperature.toFixed(1)}°C
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
            Δ: {(sensor.temperature - 25.0).toFixed(1)}°C
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
            {(sensor.confidence * 100).toFixed(0)}% conf.
          </span>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Updated: {isClient && sensor.lastUpdated ? sensor.lastUpdated.toLocaleTimeString() : '--:--:--'}
        </div>

        {/* Progress Bar for Temperature Relative to Reference */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              sensor.status === 'normal' 
                ? 'bg-green-500' 
                : sensor.status === 'warning' 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}
            style={{ 
              width: `${Math.min(Math.max((sensor.confidence * 100), 10), 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
