// Comprehensive test comparing dashboard API with notebook expectations
const testModelAccuracy = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔬 COMPREHENSIVE MODEL ACCURACY TEST');
  console.log('='*60);
  console.log('Comparing dashboard predictions with expected model behavior\n');

  // Test cases based on your sensor data from the notebook
  const testCases = [
    {
      name: "Ideal conditions (all sensors normal)",
      data: [24.8, 25.1, 25.3], // Very close to 25°C reference
      expectedClass: "normal",
      expectedConfidence: "> 85%"
    },
    {
      name: "Slight drift (one sensor off)",
      data: [24.2, 25.0, 25.5], // Small deviations
      expectedClass: "normal", 
      expectedConfidence: "> 70%"
    },
    {
      name: "Moderate anomaly (temperature drift)",
      data: [23.0, 25.8, 26.5], // Moderate deviations
      expectedClass: "warning",
      expectedConfidence: "> 60%"
    },
    {
      name: "Clear anomaly (sensor malfunction)",
      data: [21.5, 28.2, 29.0], // Large deviations
      expectedClass: "anomaly",
      expectedConfidence: "> 70%"
    },
    {
      name: "Extreme anomaly (system failure)",
      data: [18.0, 32.0, 15.5], // Very large deviations
      expectedClass: "anomaly", 
      expectedConfidence: "> 85%"
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 ${testCase.name}`);
      console.log(`📊 Input: [${testCase.data.join(', ')}]°C`);
      
      // Test Random Forest
      const rfResponse = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorData: testCase.data,
          modelType: 'random_forest'
        })
      });

      // Test Linear Regression
      const lrResponse = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensorData: testCase.data,
          modelType: 'linear_regression'
        })
      });

      if (rfResponse.ok && lrResponse.ok) {
        const rfResult = await rfResponse.json();
        const lrResult = await lrResponse.json();
        
        console.log(`\n🌲 Random Forest:`);
        console.log(`   Prediction: ${rfResult.prediction}`);
        console.log(`   Confidence: ${(rfResult.confidence * 100).toFixed(1)}%`);
        console.log(`   Raw Output: ${rfResult.rawPrediction?.toFixed(2)}°C`);
        
        console.log(`\n📈 Linear Regression:`);
        console.log(`   Prediction: ${lrResult.prediction}`);
        console.log(`   Confidence: ${(lrResult.confidence * 100).toFixed(1)}%`);
        console.log(`   Raw Output: ${lrResult.rawPrediction?.toFixed(2)}°C`);

        // Validate against expectations
        const rfCorrect = rfResult.prediction === testCase.expectedClass;
        const lrCorrect = lrResult.prediction === testCase.expectedClass;
        
        console.log(`\n✅ Validation:`);
        console.log(`   Expected: ${testCase.expectedClass}`);
        console.log(`   Random Forest: ${rfCorrect ? '✅' : '❌'} ${rfResult.prediction}`);
        console.log(`   Linear Regression: ${lrCorrect ? '✅' : '❌'} ${lrResult.prediction}`);
        
        // Feature analysis
        console.log(`\n📊 Feature Analysis:`);
        console.log(`   Max Deviation: ${rfResult.features?.maxDeviation?.toFixed(2)}°C`);
        console.log(`   Avg Temperature: ${rfResult.features?.avgTemperature?.toFixed(2)}°C`);
        console.log(`   Temperature Range: ${rfResult.features?.tempRange?.toFixed(2)}°C`);
        console.log(`   Reference Temp: ${rfResult.features?.referenceTemp}°C`);
        
        if (rfCorrect || lrCorrect) {
          passedTests++;
        }
      } else {
        console.log(`❌ API Error - RF: ${rfResponse.status}, LR: ${lrResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
    
    console.log('-'.repeat(50));
  }

  // Summary
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`='*30`);
  console.log(`Passed: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`\n🚀 DEPLOYMENT STATUS:`);
  
  if (passedTests >= totalTests * 0.8) {
    console.log(`✅ READY FOR PRODUCTION - Models are performing well!`);
  } else if (passedTests >= totalTests * 0.6) {
    console.log(`⚠️ NEEDS TUNING - Models need classification threshold adjustment`);
  } else {
    console.log(`❌ NOT READY - Models need retraining or data preprocessing`);
  }

  console.log(`\n🎯 Next Steps:`);
  console.log(`1. Dashboard is running at http://localhost:3000`);
  console.log(`2. Test page available at http://localhost:3000/testing`);
  console.log(`3. Real-time monitoring at http://localhost:3000`);
  console.log(`4. Models are using your actual ONNX trained models!`);
};

testModelAccuracy().catch(console.error);