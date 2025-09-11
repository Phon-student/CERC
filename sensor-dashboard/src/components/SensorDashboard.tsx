'use client';

import React, { useState, useEffect } from 'react';
import { 
  ThermometerSun, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Settings,
  RefreshCw,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SensorCard from './SensorCard';
import { sensorDataService, SensorReading, HistoricalData } from '@/lib/sensorDataService';

const SensorDashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize sensor data
  useEffect(() => {
    if (!isClient) return;
    
    const now = new Date();
    const initialSensors: SensorReading[] = [
      {
        id: 'SNE22-1_VAV1-2-1_Temp',
        name: 'SNE22-1 VAV Room 201',
        temperature: 25.2,
        status: 'normal',
        lastUpdated: now,
        timestamp: now,
        confidence: 0.95
      },
      {
        id: 'SNE22-1_VAV1-2-3_Temp',
        name: 'SNE22-1 VAV Room 203',
        temperature: 23.8,
        status: 'warning',
        lastUpdated: now,
        timestamp: now,
        confidence: 0.78
      },
      {
        id: 'SNE22-1_VAV1-2-5_Temp',
        name: 'SNE22-1 VAV Room 205',
        temperature: 29.1,
        status: 'anomaly',
        lastUpdated: now,
        timestamp: now,
        confidence: 0.89
      },
      {
        id: 'SNE22-1_VAV1-2-7_Temp',
        name: 'SNE22-1 VAV Room 207',
        temperature: 24.9,
        status: 'normal',
        lastUpdated: now,
        timestamp: now,
        confidence: 0.92
      }
    ];

    setSensorData(initialSensors);
    setLastUpdate(now);
    generateHistoricalData();
  }, [isClient]);

  // Auto-update sensor data when live mode is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive && sensorData.length > 0) {
      interval = setInterval(() => {
        generateSensorData();
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, sensorData.length]);

  const generateSensorData = () => {
    if (sensorData.length === 0) return;
    
    setSensorData(prevSensorData => {
      const updatedSensors = prevSensorData.map(sensor => {
        const baseTemp = 25.0;
        const variation = (Math.random() - 0.5) * 6; // ±3°C variation
        const newTemp = baseTemp + variation;
        const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0

        let status: 'normal' | 'warning' | 'anomaly' = 'normal';
        if (Math.abs(variation) > 2) {
          status = confidence > 0.8 ? 'anomaly' : 'warning';
        } else if (Math.abs(variation) > 1) {
          status = confidence > 0.7 ? 'warning' : 'normal';
        }

        return {
          ...sensor,
          temperature: newTemp,
          status,
          confidence,
          lastUpdated: new Date()
        };
      });

      setLastUpdate(new Date());

      // Update historical data
      const newHistoricalEntry: HistoricalData = {
        timestamp: new Date().toLocaleTimeString(),
        sensor1: updatedSensors[0]?.temperature || 25,
        sensor2: updatedSensors[1]?.temperature || 25,
        sensor3: updatedSensors[2]?.temperature || 25,
        sensor4: updatedSensors[3]?.temperature || 25,
        anomalyCount: updatedSensors.filter(s => s.status === 'anomaly').length
      };

      setHistoricalData(prev => [...prev.slice(-19), newHistoricalEntry]);
      
      return updatedSensors;
    });
  };

  const generateHistoricalData = () => {
    if (!isClient) return;
    
    const data: HistoricalData[] = [];
    for (let i = 19; i >= 0; i--) {
      const time = new Date();
      time.setMinutes(time.getMinutes() - i * 5);
      
      data.push({
        timestamp: time.toLocaleTimeString(),
        sensor1: 25 + (Math.random() - 0.5) * 4,
        sensor2: 25 + (Math.random() - 0.5) * 4,
        sensor3: 25 + (Math.random() - 0.5) * 4,
        sensor4: 25 + (Math.random() - 0.5) * 4,
        anomalyCount: Math.floor(Math.random() * 3)
      });
    }
    setHistoricalData(data);
  };

  // Calculate statistics
  const stats = {
    normalCount: sensorData.filter(s => s.status === 'normal').length,
    warningCount: sensorData.filter(s => s.status === 'warning').length,
    anomalyCount: sensorData.filter(s => s.status === 'anomaly').length,
    avgConfidence: sensorData.length > 0 ? sensorData.reduce((sum, s) => sum + s.confidence, 0) / sensorData.length : 0
  };

  // Prevent hydration mismatch by not rendering during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <ThermometerSun className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sensor Monitoring Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Loading dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <ThermometerSun className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sensor Monitoring Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Real-time temperature monitoring and anomaly detection
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                isLive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <Activity className={`h-4 w-4 ${isLive ? 'animate-pulse' : ''}`} />
              <span>{isLive ? 'Live' : 'Paused'}</span>
            </button>
            
            <button
              onClick={() => generateSensorData()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdate ? lastUpdate.toLocaleString() : 'Loading...'}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Normal Sensors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.normalCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Warning Sensors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.warningCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Anomaly Sensors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.anomalyCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg Confidence
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {(stats.avgConfidence * 100).toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {sensorData.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Temperature Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Temperature Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sensor1" stroke="#3B82F6" name="VAV-1" />
              <Line type="monotone" dataKey="sensor2" stroke="#10B981" name="VAV-2" />
              <Line type="monotone" dataKey="sensor3" stroke="#F59E0B" name="VAV-3" />
              <Line type="monotone" dataKey="sensor4" stroke="#EF4444" name="VAV-4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Anomaly Detection
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="anomalyCount" fill="#EF4444" name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {sensorData.map((sensor, index) => (
              <div key={sensor.id} className="flex items-center space-x-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{sensor.name}</span> reported{' '}
                    <span className={`font-medium ${
                      sensor.status === 'anomaly' ? 'text-red-600' :
                      sensor.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {sensor.status}
                    </span>{' '}
                    status at {sensor.temperature.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sensor.lastUpdated ? sensor.lastUpdated.toLocaleString() : 'Unknown time'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sensor.status === 'anomaly' ? 'bg-red-100 text-red-800' :
                  sensor.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {(sensor.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDashboard;
