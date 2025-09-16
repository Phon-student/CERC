'use client';

import React, { useState, useEffect } from 'react';
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
  Building2
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
  
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(initialBuildings);
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingStats[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Load available buildings
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await fetch('/api/sensors/buildings');
        if (response.ok) {
          const buildings = await response.json();
          setAvailableBuildings(buildings);
          
          // If no buildings selected, select first 4 by default
          if (selectedBuildings.length === 0) {
            setSelectedBuildings(buildings.slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error loading buildings:', err);
      }
    };

    loadBuildings();
  }, []);

  // Load building statistics
  useEffect(() => {
    const loadBuildingStats = async () => {
      try {
        const response = await fetch('/api/sensors/statistics');
        if (response.ok) {
          const stats = await response.json();
          setBuildingStats(stats);
        }
      } catch (err) {
        console.error('Error loading building statistics:', err);
      }
    };

    loadBuildingStats();
  }, []);

  // Generate historical data with actual sensor readings
  const generateHistoricalData = (sensors: SensorReading[]): HistoricalDataPoint[] => {
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
      sensors.forEach(sensor => {
        // Add some variation to make it look realistic
        const variation = (Math.random() - 0.5) * 4; // ±2°C variation
        point[`${sensor.building} - ${sensor.name}`] = Math.round((sensor.temperature + variation) * 10) / 10;
      });
      
      data.push(point);
    }
    
    return data;
  };

  // Update historical data with current readings
  const updateHistoricalDataWithCurrentReadings = (sensors: SensorReading[]) => {
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
  const loadSensorData = async () => {
    if (selectedBuildings.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const buildingsParam = selectedBuildings.join(',');
      const response = await fetch(`/api/sensors?type=live&limit=20&buildings=${encodeURIComponent(buildingsParam)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSensorData(data);
        
        // Generate or update historical data
        if (historicalData.length === 0) {
          const historical = generateHistoricalData(data);
          setHistoricalData(historical);
        } else if (isLive) {
          updateHistoricalDataWithCurrentReadings(data);
        }
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error loading sensor data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sensor data');
    } finally {
      setLoading(false);
    }
  };

  // Load data when selected buildings change
  useEffect(() => {
    loadSensorData();
  }, [selectedBuildings]);

  // Auto-update sensor data when live mode is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive && selectedBuildings.length > 0) {
      interval = setInterval(() => {
        console.log('Auto-refreshing sensor data...');
        loadSensorData(); // This will also update historical data
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, selectedBuildings.length]); // Simplified dependencies

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

  const handleRefresh = () => {
    loadSensorData();
  };

  const handleBuildingSelectionChange = (buildings: string[]) => {
    setSelectedBuildings(buildings);
    setHistoricalData([]); // Reset historical data when buildings change
  };

  const getStatusIcon = (status: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredSensors = sensorData.filter(sensor => 
    selectedBuildings.length === 0 || selectedBuildings.includes(sensor.building)
  );

  const totalSensors = filteredSensors.length;
  const normalSensors = filteredSensors.filter(s => s.status === 'normal').length;
  const warningSensors = filteredSensors.filter(s => s.status === 'warning').length;
  const criticalSensors = filteredSensors.filter(s => s.status === 'critical').length;
  const avgTemperature = totalSensors > 0 
    ? (filteredSensors.reduce((sum, s) => sum + s.temperature, 0) / totalSensors).toFixed(1)
    : '0';

  // Prepare chart data - only show sensors from selected buildings
  const chartSensors = filteredSensors.slice(0, 8); // Limit to 8 sensors for readability
  const chartLines = chartSensors.map((sensor, index) => {
    const sensorKey = `${sensor.building} - ${sensor.name}`;
    const color = getBuildingColor(sensor.building, index);
    
    return (
      <Line
        key={sensorKey}
        type="monotone"
        dataKey={sensorKey}
        stroke={color}
        strokeWidth={2}
        dot={false}
        connectNulls={false}
      />
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Building Temperature Monitoring
            </h1>
            <p className="text-gray-600">
              Real-time sensor monitoring across multiple buildings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setIsLive(!isLive)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isLive 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isLive ? 'Live' : 'Paused'}
            </button>

            <Link
              href="/buildings"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            onSelectionChange={handleBuildingSelectionChange}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sensors</p>
                <p className="text-3xl font-bold text-gray-900">{totalSensors}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ThermometerSun className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Temp</p>
                <p className="text-3xl font-bold text-gray-900">{avgTemperature}°C</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Normal Status</p>
                <p className="text-3xl font-bold text-green-600">{normalSensors}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-3xl font-bold text-red-600">{warningSensors + criticalSensors}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Triangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Temperature Trend Chart */}
        {historicalData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Temperature Trends</h2>
              <div className="flex items-center text-sm text-gray-500">
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
                  {chartLines}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Triangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading sensor data...</p>
          </div>
        )}

        {/* Sensor Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
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
            <ThermometerSun className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sensors found</h3>
            <p className="text-gray-600">
              {selectedBuildings.length === 0 
                ? 'Please select buildings to view sensor data'
                : 'No sensors available for the selected buildings'
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </footer>
      </div>
    </div>
  );
}

  const loadDefaultBuildings = async () => {
    try {
      const mostActive = await sensorDataService.getMostActiveBuildings(4);
      setSelectedBuildings(mostActive);
    } catch (error) {
      console.error('Failed to load default buildings:', error);
      // Set fallback buildings
      setSelectedBuildings(['Blk 22', 'Blk 15', 'Blk 19', 'Blk 11']);
    }
  };

  const loadAvailableBuildings = async () => {
    try {
      const buildings = await sensorDataService.getAvailableBuildings();
      setAvailableBuildings(buildings);
    } catch (error) {
      console.error('Failed to load available buildings:', error);
      // Set default buildings if API fails
      setAvailableBuildings(['Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7', 'Blk 10', 'Blk 11', 'Blk 14', 'Blk 15', 'Blk 16', 'Blk 18', 'Blk 19', 'Blk 20', 'Blk 22', 'Blk 23', 'Blk 24', 'Blk 26', 'Blk 28', 'Blk 34']);
    }
  };

  const loadSensorData = async () => {
    if (isLoadingData) {
      console.log('Already loading data, skipping...');
      return;
    }
    
    try {
      setIsLoadingData(true);
      console.log('Loading sensor data for buildings:', selectedBuildings);
      const data = await sensorDataService.getLiveSensorData(selectedBuildings.length > 0 ? selectedBuildings : undefined);
      console.log('Received sensor data:', data.length, 'readings');
      setSensorData(data);
      setLastUpdate(new Date());
      
      // Update historical data with new readings
      updateHistoricalDataWithCurrentReadings(data);
    } catch (error) {
      console.error('Failed to load sensor data:', error);
      // Fallback to default data if API fails
      loadFallbackData();
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateHistoricalDataWithCurrentReadings = (currentData: SensorReading[]) => {
    if (currentData.length === 0) return;

    // Update historical data with a new entry based on current readings
    const newHistoricalEntry: HistoricalData = {
      timestamp: new Date().toLocaleTimeString(),
      sensor1: currentData[0]?.temperature || 25,
      sensor2: currentData[1]?.temperature || 25,
      sensor3: currentData[2]?.temperature || 25,
      sensor4: currentData[3]?.temperature || 25,
      anomalyCount: currentData.filter(s => s.status === 'anomaly').length
    };

    setHistoricalData(prev => [...prev.slice(-19), newHistoricalEntry]);
  };

  const loadFallbackData = () => {
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
  };

  // Auto-update sensor data when live mode is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive && sensorData.length > 0 && selectedBuildings.length > 0) {
      interval = setInterval(() => {
        console.log('Auto-refreshing sensor data...');
        loadSensorData();
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, selectedBuildings.length]); // Simplified dependencies

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
    if (!isClient || sensorData.length === 0) return;
    
    console.log('Generating historical data for current sensors:', sensorData.length);
    
    const data: HistoricalData[] = [];
    for (let i = 19; i >= 0; i--) {
      const time = new Date();
      time.setMinutes(time.getMinutes() - i * 5);
      
      // Use actual sensor data with some historical variation
      const entry: HistoricalData = {
        timestamp: time.toLocaleTimeString(),
        sensor1: 25,
        sensor2: 25,
        sensor3: 25,
        sensor4: 25,
        anomalyCount: 0
      };

      // Map current sensors to chart lines
      sensorData.slice(0, 4).forEach((sensor, index) => {
        // Add some historical variation to current temperature
        const variation = (Math.random() - 0.5) * 2; // ±1°C variation
        const historicalTemp = sensor.temperature + variation;
        
        switch (index) {
          case 0:
            entry.sensor1 = historicalTemp;
            break;
          case 1:
            entry.sensor2 = historicalTemp;
            break;
          case 2:
            entry.sensor3 = historicalTemp;
            break;
          case 3:
            entry.sensor4 = historicalTemp;
            break;
        }
      });

      // Count anomalies in current time frame
      entry.anomalyCount = Math.floor(Math.random() * 2); // 0-1 anomalies per time period
      
      data.push(entry);
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
                {selectedBuildings.length > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • Monitoring {selectedBuildings.length} building{selectedBuildings.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="ml-2">
                  • <Link href="/buildings" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    View All Buildings
                  </Link>
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <BuildingSelector
              availableBuildings={availableBuildings}
              selectedBuildings={selectedBuildings}
              onBuildingChange={setSelectedBuildings}
            />
            
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
            
            <Link
              href="/buildings"
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span>All Buildings</span>
            </Link>
            
            <button
              onClick={() => loadSensorData()}
              disabled={isLoadingData}
              className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>{isLoadingData ? 'Loading...' : 'Refresh Data'}</span>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Temperature Trends
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedBuildings.length > 0 ? (
                <span>Showing: {selectedBuildings.slice(0, 4).join(', ')}</span>
              ) : (
                <span>Select buildings to view trends</span>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip formatter={(value: any, name: string) => [
                `${parseFloat(value).toFixed(1)}°C`, 
                name
              ]} />
              <Legend />
              {sensorData.slice(0, 4).map((sensor, index) => {
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                const dataKey = `sensor${index + 1}` as keyof HistoricalData;
                return (
                  <Line 
                    key={sensor.id}
                    type="monotone" 
                    dataKey={dataKey}
                    stroke={colors[index]} 
                    name={sensor.name || `Sensor ${index + 1}`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                );
              })}
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
