'use client';

import { useEffect, useState } from 'react';

interface ModelStatus {
  isInitialized: boolean;
  modelsLoaded: number;
  expectedModels: number;
  loadingProgress: string;
  availableModels: string[];
}

export function useModelPreload() {
  const [status, setStatus] = useState<ModelStatus>({
    isInitialized: false,
    modelsLoaded: 0,
    expectedModels: 0,
    loadingProgress: '0/0',
    availableModels: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const checkModelStatus = async () => {
      try {
        const response = await fetch('/api/models/status');
        const data = await response.json();
        
        if (mounted) {
          setStatus({
            isInitialized: data.isInitialized,
            modelsLoaded: data.modelsLoaded,
            expectedModels: data.expectedModels,
            loadingProgress: data.loadingProgress,
            availableModels: data.availableModels || []
          });
          
          if (data.isInitialized && data.modelsLoaded > 0) {
            setLoading(false);
            console.log(`✅ Models preloaded: ${data.availableModels.join(', ')}`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to check model status');
          setLoading(false);
        }
      }
    };

    const forcePreload = async () => {
      try {
        console.log('🚀 Forcing model preload...');
        const response = await fetch('/api/models/status', { method: 'POST' });
        const data = await response.json();
        
        if (mounted && data.success) {
          console.log('✅ Models force-loaded successfully');
          setStatus({
            isInitialized: data.isInitialized,
            modelsLoaded: data.modelsLoaded,
            expectedModels: data.expectedModels,
            loadingProgress: data.loadingProgress,
            availableModels: data.availableModels || []
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to force preload models:', err);
      }
    };

    // Initial check
    checkModelStatus();
    
    // Set up polling for model status
    intervalId = setInterval(checkModelStatus, 1000);
    
    // Force preload after a short delay
    setTimeout(forcePreload, 2000);
    
    // Cleanup
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { status, loading, error };
}

// Model Loading Component
export function ModelLoadingStatus() {
  const { status, loading, error } = useModelPreload();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400">❌</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Model Loading Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !status.isInitialized) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400">⏳</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Loading ML Models...</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Progress: {status.loadingProgress}</p>
              <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: status.expectedModels > 0 
                      ? `${(status.modelsLoaded / status.expectedModels) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-green-400">✅</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">ML Models Ready</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>Loaded: {status.availableModels.join(', ')}</p>
            <p>Ready for real-time predictions!</p>
          </div>
        </div>
      </div>
    </div>
  );
}