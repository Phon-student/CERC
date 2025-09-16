'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  ThermometerSun, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { sensorDataService, SensorReading } from '@/lib/sensorDataService';

interface BuildingStats {
  building: string;
  sensorCount: number;
  anomalyRate: number;
  avgTemperature: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: Date;
}

const AllBuildingsPage: React.FC = () => {
  const [buildingStats, setBuildingStats] = useState<BuildingStats[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    loadBuildingData();
  }, [isClient]);

  const loadBuildingData = async () => {
    try {
      setIsLoading(true);
      
      // Load available buildings
      const buildings = await sensorDataService.getAvailableBuildings();
      setAvailableBuildings(buildings);
      
      // Get statistics for each building
      const stats: BuildingStats[] = [];
      
      for (const building of buildings) {
        try {
          // Get live data for this building
          const sensorData = await sensorDataService.getLiveSensorData([building]);
          
          // Calculate statistics
          const sensorCount = sensorData.length;
          const anomalyCount = sensorData.filter(s => s.status === 'anomaly').length;
          const anomalyRate = sensorCount > 0 ? anomalyCount / sensorCount : 0;
          const avgTemperature = sensorCount > 0 
            ? sensorData.reduce((sum, s) => sum + s.temperature, 0) / sensorCount 
            : 25.0;

          // Determine overall building status
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          if (anomalyRate > 0.3) status = 'critical';
          else if (anomalyRate > 0.1 || sensorData.some(s => s.status === 'warning')) status = 'warning';

          stats.push({
            building,
            sensorCount,
            anomalyRate,
            avgTemperature,
            status,
            lastUpdate: new Date()
          });
        } catch (error) {
          console.error(`Failed to load data for ${building}:`, error);
          // Add placeholder data for failed buildings
          stats.push({
            building,
            sensorCount: 0,
            anomalyRate: 0,
            avgTemperature: 25.0,
            status: 'normal',
            lastUpdate: new Date()
          });
        }
      }
      
      // Sort by sensor count (most active first)
      stats.sort((a, b) => b.sensorCount - a.sensorCount);
      setBuildingStats(stats);
      
    } catch (error) {
      console.error('Error loading building data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <Zap className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Loading All Buildings...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  All Buildings Overview
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Comprehensive monitoring across all {availableBuildings.length} buildings
                </p>
              </div>
            </div>
            
            <button
              onClick={loadBuildingData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              <Activity className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh All</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Buildings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {availableBuildings.length}
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
                  <ThermometerSun className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Sensors
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {buildingStats.reduce((sum, stat) => sum + stat.sensorCount, 0)}
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
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Healthy Buildings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {buildingStats.filter(stat => stat.status === 'normal').length}
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
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Avg Temperature
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {buildingStats.length > 0 
                        ? (buildingStats.reduce((sum, stat) => sum + stat.avgTemperature, 0) / buildingStats.length).toFixed(1)
                        : '25.0'
                      }°C
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buildings Grid */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading building data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {buildingStats.map((stat) => (
              <div key={stat.building} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stat.building}
                      </h3>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(stat.status)}`}>
                      {getStatusIcon(stat.status)}
                      <span className="capitalize">{stat.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sensors</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stat.sensorCount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Avg Temp</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stat.avgTemperature.toFixed(1)}°C</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Anomaly Rate</span>
                      <span className={`font-medium ${
                        stat.anomalyRate > 0.3 ? 'text-red-600' : 
                        stat.anomalyRate > 0.1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {(stat.anomalyRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-400">
                        Last updated: {stat.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <Link 
                    href={`/?buildings=${encodeURIComponent(stat.building)}`}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {buildingStats.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Building Data</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Unable to load building data. Please check your connection and try again.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBuildingsPage;
