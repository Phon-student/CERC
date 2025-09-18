/**
 * Minimal test for the flexible prediction API
 */

const testFlexibleAPI = async () => {
  try {
    console.log('🧪 Testing Flexible Prediction API...\n');

    // Test case 1: Single sensor
    console.log('📍 Test 1: Single sensor input');
    const testData1 = {
      sensorData: [23.5],
      sensorId: 'TEST-001',
      sensorName: 'Single Test Sensor'
    };

    console.log('Making API call to /api/predict-flexible...');
    console.log('Test data:', JSON.stringify(testData1, null, 2));

    const response1 = await fetch('http://localhost:3000/api/predict-flexible', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData1),
    });

    console.log('Response status:', response1.status);
    console.log('Response headers:', Object.fromEntries(response1.headers.entries()));

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Success!');
      console.log('Result:', JSON.stringify(result1, null, 2));
    } else {
      const error1 = await response1.text();
      console.log('❌ Error response:', error1);
    }

    console.log('\n' + '-'.repeat(50) + '\n');

    // Test case 2: Multiple sensors
    console.log('📍 Test 2: Multiple sensor inputs');
    const testData2 = {
      sensorData: [23.2, 24.1, 23.8, 24.0],
      sensorId: 'TEST-002',
      sensorName: 'Multi Test Sensors'
    };

    console.log('Test data:', JSON.stringify(testData2, null, 2));

    const response2 = await fetch('http://localhost:3000/api/predict-flexible', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData2),
    });

    console.log('Response status:', response2.status);

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Success!');
      console.log('Result:', JSON.stringify(result2, null, 2));
    } else {
      const error2 = await response2.text();
      console.log('❌ Error response:', error2);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the Next.js dev server is running:');
      console.log('   cd sensor-dashboard && npm run dev');
    }
  }
};

// Check if we're being called from command line
if (require.main === module) {
  console.log('🚀 Starting Flexible API Test...\n');
  testFlexibleAPI()
    .then(() => {
      console.log('\n✅ Test suite completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testFlexibleAPI };