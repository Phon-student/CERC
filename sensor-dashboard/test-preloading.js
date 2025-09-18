// Test script to verify model preloading functionality
const testModelPreloading = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 TESTING MODEL PRELOADING');
  console.log('='*50);
  
  // Test 1: Check initial model status
  console.log('\n1️⃣ Checking initial model status...');
  try {
    const statusResponse = await fetch(`${baseUrl}/api/models/status`);
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok) {
      console.log(`✅ Status API accessible`);
      console.log(`📊 Models loaded: ${statusData.modelsLoaded}/${statusData.expectedModels}`);
      console.log(`🔄 Progress: ${statusData.loadingProgress}`);
      console.log(`✅ Initialized: ${statusData.isInitialized}`);
      console.log(`📋 Available: ${statusData.availableModels.join(', ')}`);
    } else {
      console.log(`❌ Status API error: ${statusData.error}`);
    }
  } catch (error) {
    console.log(`❌ Failed to check status: ${error.message}`);
  }

  // Test 2: Force preload if needed
  console.log('\n2️⃣ Force preloading models...');
  try {
    const preloadResponse = await fetch(`${baseUrl}/api/models/status`, {
      method: 'POST'
    });
    const preloadData = await preloadResponse.json();
    
    if (preloadResponse.ok) {
      console.log(`✅ Force preload successful`);
      console.log(`📊 Models loaded: ${preloadData.modelsLoaded}/${preloadData.expectedModels}`);
      console.log(`📋 Available: ${preloadData.availableModels.join(', ')}`);
    } else {
      console.log(`❌ Force preload failed: ${preloadData.error}`);
    }
  } catch (error) {
    console.log(`❌ Failed to force preload: ${error.message}`);
  }

  // Test 3: Test prediction speed (should be instant now)
  console.log('\n3️⃣ Testing prediction speed...');
  const testData = [24.5, 25.2, 25.8];
  
  for (let i = 0; i < 3; i++) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorData: testData,
          modelType: 'random_forest'
        })
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Prediction ${i+1}: ${result.prediction} (${responseTime}ms)`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        
        // Check if response is instant (< 50ms indicates preloaded models)
        if (responseTime < 50) {
          console.log(`   🚀 FAST! Models are preloaded (${responseTime}ms)`);
        } else if (responseTime < 200) {
          console.log(`   ⚡ Good response time (${responseTime}ms)`);
        } else {
          console.log(`   ⏳ Slow - models may not be preloaded (${responseTime}ms)`);
        }
      } else {
        console.log(`❌ Prediction ${i+1} failed: ${result.error}`);
        if (result.initializationStatus) {
          console.log(`   Status: ${result.initializationStatus.loadingProgress}`);
        }
      }
    } catch (error) {
      console.log(`❌ Prediction ${i+1} error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎯 PRELOADING TEST SUMMARY:');
  console.log('='*40);
  console.log('1. Models should load during server startup');
  console.log('2. Status API should show progress and completion');
  console.log('3. Predictions should be instant (< 50ms) when models are preloaded');
  console.log('4. No "models are still loading" errors after preload');
  console.log('\n✅ If all tests pass, model preloading is working correctly!');
};

// Run the test
testModelPreloading().catch(console.error);