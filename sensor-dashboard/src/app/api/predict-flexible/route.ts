import { NextRequest, NextResponse } from 'next/server';
import { flexibleModelService } from '@/lib/flexibleModelService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sensorData, sensorId, sensorName } = body;

    // Validate input - now supports variable length arrays
    if (!sensorData || !Array.isArray(sensorData)) {
      return NextResponse.json(
        { 
          error: 'Invalid sensor data. Expected array of temperature readings.',
          received: typeof sensorData,
          example: [24.5, 25.1, 24.8]
        },
        { status: 400 }
      );
    }

    // Filter out invalid readings
    const validReadings = sensorData.filter(temp => 
      typeof temp === 'number' && !isNaN(temp) && isFinite(temp) && temp > 0 && temp < 60
    );

    if (validReadings.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid temperature readings found.',
          receivedData: sensorData,
          requirements: 'Temperature readings should be numbers between 0 and 60°C'
        },
        { status: 400 }
      );
    }

    // Check if service is ready
    if (!flexibleModelService.isServiceReady()) {
      return NextResponse.json(
        { 
          error: 'Flexible model service is initializing. Please try again in a moment.',
          status: 'initializing'
        },
        { status: 503 }
      );
    }

    // Get prediction using flexible model service
    const result = await flexibleModelService.predict(validReadings);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Model prediction failed. Please check your input data.' },
        { status: 500 }
      );
    }

    // Format response for dashboard
    const response = {
      success: true,
      prediction: result.prediction,
      confidence: result.confidence,
      rawPrediction: result.rawPrediction,
      inputSensors: result.inputSensors,
      validSensors: validReadings.length,
      features: result.features,
      sensorInfo: {
        sensorId: sensorId || 'unknown',
        sensorName: sensorName || 'Unknown Sensor',
        originalReadings: sensorData.length,
        validReadings: validReadings.length,
        filteredOut: sensorData.length - validReadings.length
      },
      modelInfo: {
        type: 'flexible_statistical',
        version: flexibleModelService.getMetadata().version,
        supportedInputs: '1 to N sensors',
        referenceTemperature: flexibleModelService.getMetadata().referenceTemperature
      },
      timestamp: result.timestamp
    };

    console.log(`🔮 Flexible prediction: ${result.prediction} (${result.confidence}%) for ${validReadings.length} sensors`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Flexible Prediction API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'flexible_prediction_error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return service status and capabilities
    const status = flexibleModelService.getStatus();
    
    return NextResponse.json({
      service: 'Flexible Model Prediction API',
      status: 'active',
      capabilities: status,
      usage: {
        endpoint: '/api/predict-flexible',
        method: 'POST',
        inputFormat: {
          sensorData: 'Array of temperature readings (1 to N values)',
          sensorId: 'Optional sensor identifier',
          sensorName: 'Optional sensor name'
        },
        examples: [
          { sensorData: [24.5] },
          { sensorData: [24.5, 25.1] },
          { sensorData: [24.5, 25.1, 24.8, 25.3] },
          { sensorData: [23.2, 24.1, 25.5, 24.9, 25.2, 24.7] }
        ]
      },
      features: [
        'Variable sensor count (1 to N)',
        'Automatic data validation',
        'Statistical feature extraction',
        'Robust anomaly detection',
        'Real-time classification',
        'Confidence scoring'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
}