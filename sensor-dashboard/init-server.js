// Server initialization script to preload models
// This ensures models are loaded as soon as the server starts

const initializeServer = async () => {
  console.log('🚀 Initializing Sensor Dashboard Server...');
  
  try {
    // Dynamic import to ensure we're in the right environment
    const { getModelService } = await import('./src/lib/modelService.js');
    
    console.log('📦 Starting model preloading...');
    const modelService = getModelService();
    
    // Wait for models to be ready
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (!modelService.isReady() && attempts < maxAttempts) {
      const status = modelService.getInitializationStatus();
      console.log(`⏳ Loading models... ${status.loadingProgress}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (modelService.isReady()) {
      const status = modelService.getInitializationStatus();
      console.log('✅ Model preloading completed!');
      console.log(`📊 Loaded models: ${status.modelsLoaded}/${status.expectedModels}`);
      console.log(`📋 Available: ${modelService.getAvailableModels().join(', ')}`);
      console.log('🚀 Server ready for real-time predictions!');
    } else {
      console.log('⚠️ Model preloading timed out - models will load on first request');
    }
    
  } catch (error) {
    console.log('❌ Server initialization error:', error.message);
    console.log('⚠️ Server will continue but models may load on-demand');
  }
};

// Only run if this is the main module (when server starts)
if (require.main === module) {
  initializeServer();
}

module.exports = { initializeServer };