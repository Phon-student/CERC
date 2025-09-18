'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ThermometerSun, 
  Triangle, 
  CheckCircle, 
  Activity,
  Settings,
  RefreshCw,
  TrendingUp,
  Clock,
  Zap,
  Building2,
  Brain // Add Brain icon for ML predictions
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SensorCard from './SensorCard';
import BuildingSelector from './BuildingSelector';

interface SensorReading {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  building: string;
  location: string;
}

interface HistoricalDataPoint {
  time: string;
  [key: string]: string | number; // For dynamic sensor data
}

interface BuildingStats {
  building: string;
  sensorCount: number;
  averageTemp: number;
  statusCounts: {
    normal: number;
    warning: number;
    critical: number;
  };
}

export default function SensorDashboard() {
  const searchParams = useSearchParams();
  const initialBuildings = searchParams.get('buildings')?.split(',') || [];
  const isMountedRef = useRef(true);
  
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(initialBuildings);
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingStats[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isClient, setIsClient] = useState(false);
  const previousDataRef = useRef<SensorReading[]>([]);

  // Fallback sensor data generator for offline mode
  const generateFallbackSensorData = useCallback(() => {
    const buildings = selectedBuildings.length > 0 ? selectedBuildings : ['Blk 1', 'Blk 2', 'Blk 3'];
    const fallbackData: SensorReading[] = [];
    let sensorIdCounter = 1;
    
    buildings.forEach((building) => {
      const sensorCount = Math.floor(Math.random() * 2) + 2; // 2-3 sensors per building
      
      for (let i = 0; i < sensorCount; i++) {
        const level = [2, 5, 6, 7, 8][i % 5];
        const baseTemp = 24.5 + (Math.random() * 3 - 1.5);
        const deviation = Math.abs(baseTemp - 25.0);
        
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (deviation > 2.5) status = 'critical';
        else if (deviation > 1.5) status = 'warning';
        
        fallbackData.push({
          id: `OFFLINE-${building.replace('Blk ', '')}-L${level}-${i + 1}-${sensorIdCounter++}`,
          name: `${building} Level ${level} VAV-${i + 1}`,
          building,
          temperature: baseTemp,
          humidity: 45 + Math.random() * 20,
          status,
          timestamp: new Date().toISOString(),
          location: `Level ${level}`
        });
      }
    });
    
    return fallbackData;
  }, [selectedBuildings]);

  // Helper function to compare sensor data for significant changes (excluding timestamp)
  const hasDataChanged = useCallback((newData: SensorReading[], oldData: SensorReading[]) => {
    if (newData.length !== oldData.length) return true;
    
    // Create a map for faster lookup
    const oldSensorMap = new Map(oldData.map(sensor => [sensor.id, sensor]));
    
    for (const newSensor of newData) {
      const oldSensor = oldSensorMap.get(newSensor.id);
      
      if (!oldSensor) return true; // New sensor
      
      // Check for significant changes (ignore minor fluctuations)
      const tempDiff = Math.abs(newSensor.temperature - oldSensor.temperature);
      const humidityDiff = Math.abs(newSensor.humidity - oldSensor.humidity);
      
      if (newSensor.building !== oldSensor.building ||
          newSensor.status !== oldSensor.status ||
          tempDiff >= 0.1 || // Only update for temp changes >= 0.1°C
          humidityDiff >= 1) { // Only update for humidity changes >= 1%
        return true;
      }
    }
    
    return false;
  }, []);

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load available buildings
  useEffect(() => {
    if (!isClient) return; // Only run on client
    
    const loadBuildings = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/sensors/buildings', {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          // Extract buildings array from API response
          const buildings = result.data || result;
          // Ensure buildings is an array
          if (Array.isArray(buildings)) {
            setAvailableBuildings(buildings);
            
            // If no buildings selected, select first 4 by default
            if (selectedBuildings.length === 0) {
              setSelectedBuildings(buildings.slice(0, 4));
            }
          } else {
            console.error('Buildings API did not return an array:', result);
            // Use fallback buildings list
            const fallbackBuildings = ['Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7'];
            setAvailableBuildings(fallbackBuildings);
            if (selectedBuildings.length === 0) {
              setSelectedBuildings(fallbackBuildings.slice(0, 4));
            }
          }
        }
      } catch (err) {
        console.error('Error loading buildings:', err);
        // Use fallback buildings on error
        const fallbackBuildings = ['Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7'];
        setAvailableBuildings(fallbackBuildings);
        if (selectedBuildings.length === 0) {
          setSelectedBuildings(fallbackBuildings.slice(0, 4));
        }
        setAvailableBuildings([]); // Set empty array on error
      }
    };

    loadBuildings();
  }, [isClient]);

  // Load building statistics
  useEffect(() => {
    if (!isClient) return; // Only run on client
    
    const loadBuildingStats = async () => {
      try {
        const response = await fetch('/api/sensors/statistics');
        if (response.ok) {
          const result = await response.json();
          // Extract stats array from API response
          const stats = result.data || result;
          // Ensure stats is an array
          if (Array.isArray(stats)) {
            setBuildingStats(stats);
          } else {
            console.error('Statistics API did not return an array:', result);
            setBuildingStats([]);
          }
        }
      } catch (err) {
        console.error('Error loading building statistics:', err);
        setBuildingStats([]); // Set empty array on error
      }
    };

    loadBuildingStats();
  }, [isClient]);

  // Generate historical data with actual sensor readings
  const generateHistoricalData = (sensors: SensorReading[]): HistoricalDataPoint[] => {
    if (!isClient) return []; // Prevent server-side generation
    
    const data: HistoricalDataPoint[] = [];
    const now = new Date();
    
    // Generate 24 hours of data (every hour)
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const timeStr = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const point: HistoricalDataPoint = { time: timeStr };
      
      // Add temperature data for each sensor
      sensors.forEach((sensor, sensorIndex) => {
        // Use deterministic variation based on time and sensor index to avoid hydration issues
        const seed = (time.getHours() + sensorIndex) * 0.1;
        const variation = (Math.sin(seed) * 2); // ±2°C variation, deterministic
        point[`${sensor.building} - ${sensor.name}`] = Math.round((sensor.temperature + variation) * 10) / 10;
      });
      
      data.push(point);
    }
    
    return data;
  };

  // Update historical data with current readings
  const updateHistoricalDataWithCurrentReadings = (sensors: SensorReading[]) => {
    if (!isClient) return; // Prevent server-side execution
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Create new data point with current readings
    const newPoint: HistoricalDataPoint = { time: timeStr };
    sensors.forEach(sensor => {
      newPoint[`${sensor.building} - ${sensor.name}`] = sensor.temperature;
    });
    
    setHistoricalData(prevData => {
      const updatedData = [...prevData];
      
      // Remove oldest point and add new one
      if (updatedData.length >= 24) {
        updatedData.shift();
      }
      updatedData.push(newPoint);
      
      return updatedData;
    });
  };

  // Load sensor data
  const loadSensorData = useCallback(async (retryCount = 0) => {
    if (selectedBuildings.length === 0 || !isMountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const buildingsParam = selectedBuildings.join(',');
      const apiUrl = `/api/sensors?type=live&limit=20&buildings=${encodeURIComponent(buildingsParam)}`;
      
      console.log('Fetching sensor data from:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API response received:', result);
      
      // Extract sensor data array from API response
      const data = result.data || result;
      
      if (Array.isArray(data) && isMountedRef.current) {
        // Only update if data has actually changed
        if (hasDataChanged(data, previousDataRef.current)) {
          console.log('Sensor data has changed, updating...');
          setSensorData(data);
          previousDataRef.current = [...data]; // Store copy of new data
          
          // Generate or update historical data
          if (historicalData.length === 0) {
            const historical = generateHistoricalData(data);
            setHistoricalData(historical);
          } else if (isLive) {
            updateHistoricalDataWithCurrentReadings(data);
          }
        } else {
          console.log('Sensor data unchanged, skipping update...');
        }
      } else {
        console.error('Sensors API did not return an array:', result);
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error loading sensor data (attempt ' + (retryCount + 1) + '):', err);
      
      // Retry logic for network errors
      if (retryCount < 2 && (
        err instanceof TypeError || 
        (err instanceof Error && err.message.includes('fetch')) ||
        (err instanceof Error && err.message.includes('AbortError'))
      )) {
        console.log(`Retrying in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          if (isMountedRef.current) {
            loadSensorData(retryCount + 1);
          }
        }, (retryCount + 1) * 2000);
        return;
      }
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to load sensor data. Please check your connection.';
        setError(errorMessage);
        
        // If all retries failed, use fallback data to prevent complete failure
        if (retryCount >= 2) {
          console.log('Using fallback sensor data');
          const fallbackData = generateFallbackSensorData();
          setSensorData(fallbackData);
          setError('Using offline mode - API unavailable');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedBuildings, historicalData.length, isLive]);

  // Load data when selected buildings change
  useEffect(() => {
    if (!isClient) return; // Only run on client
    loadSensorData();
  }, [selectedBuildings, isClient, loadSensorData]);

  // Auto-update sensor data when live mode is enabled
  useEffect(() => {
    if (!isClient) return; // Only run on client
    
    let interval: NodeJS.Timeout;
    
    if (isLive && selectedBuildings.length > 0) {
      interval = setInterval(() => {
        if (isMountedRef.current) {
          console.log('Auto-refreshing sensor data...');
          loadSensorData(); // This will also update historical data
        }
      }, 10000); // Update every 10 seconds (reduced frequency)
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, selectedBuildings.length, isClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper function to get consistent colors for buildings
  const getBuildingColor = (building: string, index: number): string => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Orange
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316'  // Orange-red
    ];
    
    // Use building number to get consistent color
    const buildingNum = parseInt(building.replace('Blk ', '')) || index;
    return colors[buildingNum % colors.length] || colors[index % colors.length];
  };

  const handleRefresh = useCallback(() => {
    loadSensorData();
  }, [loadSensorData]);

  const handleBuildingSelectionChange = useCallback((buildings: string[]) => {
    setSelectedBuildings(buildings);
    setHistoricalData([]); // Reset historical data when buildings change
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Triangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <Triangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  }, []);

  const filteredSensors = useMemo(() => 
    sensorData.filter(sensor => 
      selectedBuildings.length === 0 || selectedBuildings.includes(sensor.building)
    ), [sensorData, selectedBuildings]
  );

  const sensorStats = useMemo(() => {
    const totalSensors = filteredSensors.length;
    const normalSensors = filteredSensors.filter(s => s.status === 'normal').length;
    const warningSensors = filteredSensors.filter(s => s.status === 'warning').length;
    const criticalSensors = filteredSensors.filter(s => s.status === 'critical').length;
    const avgTemperature = totalSensors > 0 
      ? (filteredSensors.reduce((sum, s) => sum + s.temperature, 0) / totalSensors).toFixed(1)
      : '0';

    return {
      totalSensors,
      normalSensors,
      warningSensors,
      criticalSensors,
      avgTemperature
    };
  }, [filteredSensors]);

  // Prepare chart data - only show sensors from selected buildings
  const chartData = useMemo(() => {
    const chartSensors = filteredSensors.slice(0, 8); // Limit to 8 sensors for readability
    const chartLines = chartSensors.map((sensor, index) => {
      const sensorKey = `${sensor.building} - ${sensor.name}`;
      const uniqueKey = `${sensorKey}-${sensor.id}-${index}`;
      const color = getBuildingColor(sensor.building, index);
      
      return (
        <Line
          key={uniqueKey}
          type="monotone"
          dataKey={sensorKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      );
    });
    
    return { chartSensors, chartLines };
  }, [filteredSensors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Building Temperature Monitoring
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time sensor monitoring across multiple buildings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setIsLive(!isLive)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isLive 
                  ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600' 
                  : 'bg-gray-600 dark:bg-gray-500 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isLive ? 'Live' : 'Paused'}
            </button>

            <Link
              href="/buildings"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Buildings
            </Link>
          </div>
        </div>

        {/* Building Selector */}
        <div className="mb-8">
          <BuildingSelector
            availableBuildings={availableBuildings}
            selectedBuildings={selectedBuildings}
            onBuildingChange={handleBuildingSelectionChange}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sensors</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{sensorStats.totalSensors}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <ThermometerSun className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Temp</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{sensorStats.avgTemperature}°C</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Normal Status</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{sensorStats.normalSensors}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alerts</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{sensorStats.warningSensors + sensorStats.criticalSensors}</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <Triangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ML Active</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  <span className="text-lg">🧠</span> ON
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Temperature Trend Chart */}
        {historicalData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Temperature Trends</h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                Last 24 hours
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value}°C`, 
                      name
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  {chartData.chartLines}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Triangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading sensor data...</p>
          </div>
        )}

        {/* Sensor Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={`${sensor.id || sensor.name}-${sensor.building || 'unknown'}`}
                sensor={sensor}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSensors.length === 0 && (
          <div className="text-center py-12">
            <ThermometerSun className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No sensors found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedBuildings.length === 0 
                ? 'Please select buildings to view sensor data'
                : 'No sensors available for the selected buildings'
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Last updated: {isClient ? new Date().toLocaleString() : '--'}</p>
        </footer>
      </div>
    </div>
  );
}
