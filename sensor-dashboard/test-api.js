// Test script for the prediction API
const testPredictionAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // Test data - using 3 sensor readings as required by our model
  const testCases = [
    {
      name: "Normal temperatures",
      data: [24.5, 25.2, 25.8], // Close to reference temp (25.0)
      expectedClass: "normal"
    },
    {
      name: "Warning temperatures", 
      data: [23.0, 26.5, 27.0], // Moderate deviation
      expectedClass: "warning"
    },
    {
      name: "Anomaly temperatures",
      data: [20.0, 30.0, 28.5], // Large deviation
      expectedClass: "anomaly"
    }
  ];

  console.log('🧪 Testing Prediction API with Real ONNX Models');
  console.log('='*60);

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Test: ${testCase.name}`);
      console.log(`📊 Input: [${testCase.data.join(', ')}]`);
      
      const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensorData: testCase.data,
          modelType: 'random_forest'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Prediction: ${result.prediction}`);
        console.log(`📈 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`🎯 Raw Prediction: ${result.rawPrediction?.toFixed(2)}°C`);
        console.log(`📊 Features:`);
        console.log(`   - Max Deviation: ${result.features?.maxDeviation?.toFixed(2)}°C`);
        console.log(`   - Avg Temperature: ${result.features?.avgTemperature?.toFixed(2)}°C`);
        console.log(`   - Temperature Range: ${result.features?.tempRange?.toFixed(2)}°C`);
        console.log(`🔧 Model: ${result.modelInfo?.type} (${result.modelInfo?.framework})`);
        
        // Check if prediction matches expectation
        const isCorrect = result.prediction === testCase.expectedClass;
        console.log(`${isCorrect ? '✅' : '⚠️'} Expected: ${testCase.expectedClass}, Got: ${result.prediction}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  // Test model info endpoint
  console.log('\n🔍 Testing Available Models...');
  try {
    const response = await fetch(`${baseUrl}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sensorData: [25.0, 25.0, 25.0],
        modelType: 'linear_regression'
      })
    });

    const result = await response.json();
    if (response.ok && result.modelInfo) {
      console.log(`📋 Available Models: ${result.modelInfo.availableModels.join(', ')}`);
      console.log(`📊 Feature Columns: ${result.modelInfo.featureColumns.join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Model info test failed: ${error.message}`);
  }

  console.log('\n🎉 API Testing Complete!');
};

// Run the test
testPredictionAPI().catch(console.error);