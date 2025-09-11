'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Download, Upload, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface PredictionResult {
  anomaly_detected: boolean;
  confidence: number;
  status: string;
  sensor_temperatures: number[];
  timestamp: Date;
}

const ModelTester: React.FC = () => {
  const [sensorInputs, setSensorInputs] = useState({
    sensor1: 25.0,
    sensor2: 25.0,
    sensor3: 25.0,
    sensor4: 25.0
  });
  
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);

  // Simulate the trained model prediction (in a real app, this would call your Python API)
  const simulateModelPrediction = (inputs: typeof sensorInputs): PredictionResult => {
    const temperatures = [inputs.sensor1, inputs.sensor2, inputs.sensor3, inputs.sensor4];
    const referenceTemp = 25.0;
    
    // Calculate features similar to the trained model
    const deviations = temperatures.map(temp => Math.abs(temp - referenceTemp));
    const maxDeviation = Math.max(...deviations);
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
    
    // Simple anomaly detection logic (mimicking the trained model)
    let anomaly_detected = false;
    let confidence = 0.9;
    
    // Check for anomalies based on multiple factors
    if (maxDeviation > 2.0) {
      anomaly_detected = true;
      confidence = 0.85 + (maxDeviation - 2.0) * 0.1;
    } else if (maxDeviation > 1.0) {
      anomaly_detected = Math.random() > 0.7; // Some probability for warning zone
      confidence = 0.7 + Math.random() * 0.2;
    } else if (tempRange > 2.5) {
      anomaly_detected = true;
      confidence = 0.8;
    } else {
      confidence = 0.9 + Math.random() * 0.1;
    }
    
    // Ensure confidence is capped at 1.0
    confidence = Math.min(confidence, 1.0);
    
    return {
      anomaly_detected,
      confidence,
      status: anomaly_detected ? 'ANOMALY DETECTED' : 'NORMAL',
      sensor_temperatures: temperatures,
      timestamp: new Date()
    };
  };

  const handlePredict = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = simulateModelPrediction(sensorInputs);
    setPredictionResult(result);
    setPredictionHistory(prev => [result, ...prev].slice(0, 10)); // Keep last 10 predictions
    
    setIsLoading(false);
  };

  const handleReset = () => {
    setSensorInputs({
      sensor1: 25.0,
      sensor2: 25.0,
      sensor3: 25.0,
      sensor4: 25.0
    });
    setPredictionResult(null);
  };

  const loadPresetScenario = (scenario: 'normal' | 'warning' | 'anomaly') => {
    switch (scenario) {
      case 'normal':
        setSensorInputs({
          sensor1: 25.1,
          sensor2: 24.9,
          sensor3: 25.2,
          sensor4: 24.8
        });
        break;
      case 'warning':
        setSensorInputs({
          sensor1: 26.2,
          sensor2: 25.8,
          sensor3: 26.5,
          sensor4: 25.9
        });
        break;
      case 'anomaly':
        setSensorInputs({
          sensor1: 28.5,
          sensor2: 32.1,
          sensor3: 29.8,
          sensor4: 30.2
        });
        break;
    }
  };

  const exportPredictions = () => {
    const dataStr = JSON.stringify(predictionHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prediction_history_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Model Testing Interface
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Test the trained Random Forest model with custom sensor inputs to predict anomalies in real-time.
          Enter temperature values for each VAV sensor and get instant predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sensor Inputs
          </h3>
          
          {/* Sensor Input Fields */}
          <div className="space-y-4 mb-6">
            {Object.entries(sensorInputs).map(([key, value], index) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VAV Zone 1-2-{index + 1} Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="15"
                  max="35"
                  value={value}
                  onChange={(e) => setSensorInputs(prev => ({
                    ...prev,
                    [key]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deviation from 25°C: {(value - 25).toFixed(1)}°C
                </div>
              </div>
            ))}
          </div>

          {/* Preset Scenarios */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Test Scenarios
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => loadPresetScenario('normal')}
                className="px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Normal
              </button>
              <button
                onClick={() => loadPresetScenario('warning')}
                className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
              >
                Warning
              </button>
              <button
                onClick={() => loadPresetScenario('anomaly')}
                className="px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
              >
                Anomaly
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              <Play className="h-4 w-4" />
              <span>{isLoading ? 'Predicting...' : 'Predict'}</span>
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prediction Results
          </h3>
          
          {predictionResult ? (
            <div className="space-y-4">
              {/* Main Result */}
              <div className={`p-4 rounded-lg border-l-4 ${
                predictionResult.anomaly_detected
                  ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600'
                  : 'bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {predictionResult.anomaly_detected ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <span className={`font-bold ${
                    predictionResult.anomaly_detected ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'
                  }`}>
                    {predictionResult.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence: {(predictionResult.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Average Temperature:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(predictionResult.sensor_temperatures.reduce((a, b) => a + b, 0) / 4).toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Temperature Range:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(Math.max(...predictionResult.sensor_temperatures) - Math.min(...predictionResult.sensor_temperatures)).toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Max Deviation from 25°C:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.max(...predictionResult.sensor_temperatures.map(t => Math.abs(t - 25))).toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prediction Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {predictionResult.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No prediction yet. Enter sensor values and click "Predict" to test the model.</p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History */}
      {predictionHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prediction History
            </h3>
            <button
              onClick={exportPredictions}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Temperatures
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {predictionHistory.map((prediction, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {prediction.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prediction.anomaly_detected
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {prediction.anomaly_detected ? 'Anomaly' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {prediction.sensor_temperatures.map(t => t.toFixed(1)).join(', ')}°C
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTester;
