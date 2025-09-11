'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CheckCircle, Clock, Filter, Search, Trash2, Eye, EyeOff } from 'lucide-react';

interface SensorReading {
  id: string;
  name: string;
  temperature: number;
  status: 'normal' | 'warning' | 'anomaly';
  lastUpdated: Date;
  confidence: number;
}

interface Alert {
  id: string;
  sensorId: string;
  sensorName: string;
  type: 'anomaly' | 'warning' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  temperature: number;
  confidence: number;
  acknowledged: boolean;
  resolved: boolean;
}

interface AlertsPanelProps {
  sensorData: SensorReading[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ sensorData }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [showResolved, setShowResolved] = useState(true);

  // Generate alerts based on sensor data
  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts: Alert[] = [];
      
      sensorData.forEach(sensor => {
        if (sensor.status === 'anomaly' || sensor.status === 'warning') {
          const alertId = `${sensor.id}_${sensor.lastUpdated.getTime()}`;
          
          // Check if alert already exists
          const existingAlert = alerts.find(alert => 
            alert.sensorId === sensor.id && 
            alert.timestamp.getTime() === sensor.lastUpdated.getTime()
          );
          
          if (!existingAlert) {
            const severity = sensor.status === 'anomaly' ? 
              (sensor.confidence > 0.9 ? 'critical' : 'high') :
              (sensor.confidence > 0.8 ? 'medium' : 'low');
            
            const message = generateAlertMessage(sensor);
            
            newAlerts.push({
              id: alertId,
              sensorId: sensor.id,
              sensorName: sensor.name,
              type: sensor.status === 'anomaly' ? 'anomaly' : 'warning',
              severity,
              message,
              timestamp: sensor.lastUpdated,
              temperature: sensor.temperature,
              confidence: sensor.confidence,
              acknowledged: false,
              resolved: false
            });
          }
        }
      });
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 100)); // Keep last 100 alerts
      }
    };

    generateAlerts();
  }, [sensorData, alerts]);

  const generateAlertMessage = (sensor: SensorReading): string => {
    const deviation = Math.abs(sensor.temperature - 25.0);
    const tempStatus = sensor.temperature > 25.0 ? 'elevated' : 'reduced';
    
    if (sensor.status === 'anomaly') {
      return `Critical temperature anomaly detected in ${sensor.name}. Temperature is ${tempStatus} at ${sensor.temperature.toFixed(1)}°C (${deviation.toFixed(1)}°C from reference). Confidence: ${(sensor.confidence * 100).toFixed(0)}%`;
    } else {
      return `Temperature warning in ${sensor.name}. ${tempStatus.charAt(0).toUpperCase() + tempStatus.slice(1)} temperature detected at ${sensor.temperature.toFixed(1)}°C. Monitor for further changes.`;
    }
  };

  // Filter alerts based on current filters
  useEffect(() => {
    let filtered = alerts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'active':
          filtered = filtered.filter(alert => !alert.acknowledged && !alert.resolved);
          break;
        case 'acknowledged':
          filtered = filtered.filter(alert => alert.acknowledged && !alert.resolved);
          break;
        case 'resolved':
          filtered = filtered.filter(alert => alert.resolved);
          break;
      }
    }

    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    // Hide resolved if option is unchecked
    if (!showResolved) {
      filtered = filtered.filter(alert => !alert.resolved);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterStatus, filterSeverity, showResolved]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true, acknowledged: true } : alert
    ));
  };

  const handleDelete = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllResolved = () => {
    setAlerts(prev => prev.filter(alert => !alert.resolved));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged && !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alerts & Notifications
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={clearAllResolved}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Resolved</span>
            </button>
          </div>
        </div>
        
        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-400">Active Alerts</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-red-900 dark:text-red-300">
              {activeAlerts.length}
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Acknowledged</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {acknowledgedAlerts.length}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">Resolved</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-900 dark:text-green-300">
              {resolvedAlerts.length}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">Total Alerts</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
              {alerts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alerts..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Show Resolved Toggle */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Resolved
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Alerts ({filteredAlerts.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts match your current filters.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 ${getSeverityColor(alert.severity)} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-semibold">
                          {alert.sensorName}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            ACKNOWLEDGED
                          </span>
                        )}
                        {alert.resolved && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>{alert.timestamp.toLocaleString()}</span>
                        <span>Temperature: {alert.temperature.toFixed(1)}°C</span>
                        <span>Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
