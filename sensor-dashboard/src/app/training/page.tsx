'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Upload,
  Download,
  Settings,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  BarChart3,
  Zap,
  Database,
  Cpu,
  Target,
  RefreshCw
} from 'lucide-react';

interface TrainingConfig {
  modelType: 'random_forest' | 'gradient_boosting' | 'svm' | 'autoencoder' | 'ensemble';
  testSize: number;
  randomState: number;
  crossValidation: number;
  referenceTemp: number;
  anomalyThreshold: number;
  warningThreshold: number;
  normalThreshold: number;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  trainingTime: number;
  featureCount: number;
}

interface TrainingJob {
  id: string;
  modelType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  metrics?: ModelMetrics;
  config: TrainingConfig;
  logs: string[];
}

const ModelTrainingPage: React.FC = () => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [currentJob, setCurrentJob] = useState<TrainingJob | null>(null);
  const [config, setConfig] = useState<TrainingConfig>({
    modelType: 'random_forest',
    testSize: 0.2,
    randomState: 42,
    crossValidation: 5,
    referenceTemp: 25.0,
    anomalyThreshold: 0.7,
    warningThreshold: 0.5,
    normalThreshold: 0.3
  });
  const [datasetInfo, setDatasetInfo] = useState({
    fileName: 'SNE22-1 VAV Temperature Data',
    samples: 4242,
    features: 298,
    sensors: 4,
    anomalies: 184,
    warnings: 312,
    normal: 3746
  });
  const [isTraining, setIsTraining] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simulate training process
  const startTraining = async () => {
    const newJob: TrainingJob = {
      id: `job_${Date.now()}`,
      modelType: config.modelType,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      config: { ...config },
      logs: []
    };

    setCurrentJob(newJob);
    setTrainingJobs(prev => [newJob, ...prev]);
    setIsTraining(true);

    // Simulate training process
    const phases = [
      'Loading dataset...',
      'Preprocessing data...',
      'Feature engineering...',
      'Splitting train/test sets...',
      'Training model...',
      'Validating model...',
      'Computing metrics...',
      'Saving model...',
      'Training completed!'
    ];

    for (let i = 0; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const progress = ((i + 1) / phases.length) * 100;
      const newLog = `[${new Date().toLocaleTimeString()}] ${phases[i]}`;
      
      setCurrentJob(prev => prev ? {
        ...prev,
        status: i === phases.length - 1 ? 'completed' : 'running',
        progress,
        logs: [...prev.logs, newLog],
        endTime: i === phases.length - 1 ? new Date() : prev.endTime,
        metrics: i === phases.length - 1 ? generateMockMetrics(config.modelType) : prev.metrics
      } : null);
      
      setTrainingJobs(prev => prev.map(job => 
        job.id === newJob.id ? {
          ...job,
          status: i === phases.length - 1 ? 'completed' : 'running',
          progress,
          logs: [...job.logs, newLog],
          endTime: i === phases.length - 1 ? new Date() : job.endTime,
          metrics: i === phases.length - 1 ? generateMockMetrics(config.modelType) : job.metrics
        } : job
      ));
    }

    setIsTraining(false);
  };

  const generateMockMetrics = (modelType: string): ModelMetrics => {
    const baseMetrics = {
      random_forest: { accuracy: 0.998, precision: 0.995, recall: 0.992, f1Score: 0.994, auc: 0.997 },
      gradient_boosting: { accuracy: 0.994, precision: 0.991, recall: 0.988, f1Score: 0.990, auc: 0.993 },
      svm: { accuracy: 0.945, precision: 0.941, recall: 0.938, f1Score: 0.940, auc: 0.952 },
      autoencoder: { accuracy: 0.921, precision: 0.918, recall: 0.915, f1Score: 0.917, auc: 0.929 },
      ensemble: { accuracy: 0.999, precision: 0.998, recall: 0.997, f1Score: 0.998, auc: 0.999 }
    };

    const base = baseMetrics[modelType as keyof typeof baseMetrics] || baseMetrics.random_forest;
    
    return {
      ...base,
      trainingTime: Math.random() * 60 + 10, // 10-70 seconds
      featureCount: datasetInfo.features
    };
  };

  const stopTraining = () => {
    if (currentJob) {
      setCurrentJob(prev => prev ? { ...prev, status: 'failed' } : null);
      setTrainingJobs(prev => prev.map(job => 
        job.id === currentJob.id ? { ...job, status: 'failed' } : job
      ));
    }
    setIsTraining(false);
  };

  const getModelIcon = (modelType: string) => {
    switch (modelType) {
      case 'random_forest': return <Brain className="h-5 w-5" />;
      case 'gradient_boosting': return <TrendingUp className="h-5 w-5" />;
      case 'svm': return <Target className="h-5 w-5" />;
      case 'autoencoder': return <Zap className="h-5 w-5" />;
      case 'ensemble': return <Cpu className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Model Training Center
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Train and optimize machine learning models for sensor anomaly detection
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Load Dataset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dataset Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dataset Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {datasetInfo.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    VAV Temperature Sensor Data
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                    {datasetInfo.samples.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400">Samples</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-900 dark:text-green-300">
                    {datasetInfo.features}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400">Features</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                    {datasetInfo.sensors}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-400">Sensors</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <div className="text-lg font-bold text-red-900 dark:text-red-300">
                    {datasetInfo.anomalies}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-400">Anomalies</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Normal</span>
                  <span className="font-medium">{((datasetInfo.normal / datasetInfo.samples) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(datasetInfo.normal / datasetInfo.samples) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Training Configuration */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model Type
                </label>
                <select
                  value={config.modelType}
                  onChange={(e) => setConfig(prev => ({ ...prev, modelType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isTraining}
                >
                  <option value="random_forest">Random Forest</option>
                  <option value="gradient_boosting">Gradient Boosting</option>
                  <option value="svm">Support Vector Machine</option>
                  <option value="autoencoder">Autoencoder</option>
                  <option value="ensemble">Ensemble Model</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Test Size
                  </label>
                  <input
                    type="number"
                    value={config.testSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, testSize: parseFloat(e.target.value) }))}
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isTraining}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CV Folds
                  </label>
                  <input
                    type="number"
                    value={config.crossValidation}
                    onChange={(e) => setConfig(prev => ({ ...prev, crossValidation: parseInt(e.target.value) }))}
                    min="3"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isTraining}
                  />
                </div>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Advanced Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reference Temp (°C)
                      </label>
                      <input
                        type="number"
                        value={config.referenceTemp}
                        onChange={(e) => setConfig(prev => ({ ...prev, referenceTemp: parseFloat(e.target.value) }))}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTraining}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Random State
                      </label>
                      <input
                        type="number"
                        value={config.randomState}
                        onChange={(e) => setConfig(prev => ({ ...prev, randomState: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTraining}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Anomaly Threshold
                      </label>
                      <input
                        type="number"
                        value={config.anomalyThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, anomalyThreshold: parseFloat(e.target.value) }))}
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTraining}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Warning Threshold
                      </label>
                      <input
                        type="number"
                        value={config.warningThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, warningThreshold: parseFloat(e.target.value) }))}
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTraining}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Normal Threshold
                      </label>
                      <input
                        type="number"
                        value={config.normalThreshold}
                        onChange={(e) => setConfig(prev => ({ ...prev, normalThreshold: parseFloat(e.target.value) }))}
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        disabled={isTraining}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                {!isTraining ? (
                  <button
                    onClick={startTraining}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start Training</span>
                  </button>
                ) : (
                  <button
                    onClick={stopTraining}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop Training</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Current Training Job */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training Progress
            </h3>
            
            {currentJob ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getModelIcon(currentJob.modelType)}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {currentJob.modelType.replace('_', ' ')}
                    </span>
                  </div>
                  {getStatusIcon(currentJob.status)}
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">{currentJob.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-mono space-y-1">
                    {currentJob.logs.map((log, index) => (
                      <div key={index} className="text-gray-700 dark:text-gray-300">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {currentJob.metrics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Metrics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                        <span className="font-medium">{(currentJob.metrics.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">AUC:</span>
                        <span className="font-medium">{currentJob.metrics.auc.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Precision:</span>
                        <span className="font-medium">{(currentJob.metrics.precision * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Recall:</span>
                        <span className="font-medium">{(currentJob.metrics.recall * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No training job in progress</p>
                <p className="text-sm">Configure settings and click "Start Training"</p>
              </div>
            )}
          </div>
        </div>

        {/* Training History */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Training History
              </h3>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span>Compare Models</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {trainingJobs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No training jobs yet</p>
                <p className="text-sm">Start your first training job to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainingJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getModelIcon(job.modelType)}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                            {job.modelType.replace('_', ' ')} Model
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Started: {job.startTime.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                          {job.status}
                        </span>
                      </div>
                    </div>
                    
                    {job.metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-300">
                            {(job.metrics.accuracy * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-400">Accuracy</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-green-900 dark:text-green-300">
                            {job.metrics.auc.toFixed(3)}
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-400">AUC Score</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-purple-900 dark:text-purple-300">
                            {job.metrics.trainingTime.toFixed(1)}s
                          </div>
                          <div className="text-xs text-purple-700 dark:text-purple-400">Training Time</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
                            {job.metrics.featureCount}
                          </div>
                          <div className="text-xs text-orange-700 dark:text-orange-400">Features</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTrainingPage;
