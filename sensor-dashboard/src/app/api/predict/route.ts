import { NextRequest, NextResponse } from 'next/server';
import { getModelService } from '@/lib/modelService';

export async function POST(request: NextRequest) {
  try {
    const { sensorData, modelType = 'random_forest' } = await request.json();

    // Validate input
    if (!sensorData || !Array.isArray(sensorData)) {
      return NextResponse.json(
        { error: 'Invalid sensor data. Expected array of temperature readings.' },
        { status: 400 }
      );
    }

    // Get model service
    const modelService = getModelService();
    
    if (!modelService.isReady()) {
      const status = modelService.getInitializationStatus();
      return NextResponse.json(
        { 
          error: 'Models are still loading. Please try again in a moment.',
          details: `Progress: ${status.loadingProgress}`,
          initializationStatus: status
        },
        { status: 503 }
      );
    }

    const metadata = modelService.getMetadata();
    if (!metadata) {
      return NextResponse.json(
        { error: 'Model metadata not available.' },
        { status: 500 }
      );
    }

    // Validate sensor data length against model requirements
    const expectedLength = metadata.input_shape[1];
    if (sensorData.length !== expectedLength) {
      return NextResponse.json(
        { 
          error: `Invalid sensor data length. Expected ${expectedLength} readings, got ${sensorData.length}.`,
          expectedFeatures: metadata.feature_columns,
          receivedLength: sensorData.length,
          receivedData: sensorData,
          hint: `Model expects: ${metadata.feature_columns.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Get prediction from actual ONNX model
    const result = await modelService.predict(sensorData, modelType);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Model prediction failed. Please check your input data.' },
        { status: 500 }
      );
    }

    // Calculate additional features for response
    const temperatures = sensorData;
    const referenceTemp = metadata.reference_temperature;
    const deviations = temperatures.map(temp => Math.abs(temp - referenceTemp));
    const maxDeviation = Math.max(...deviations);
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
    const avgTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    // Convert regression prediction to classification
    // Use both the model prediction AND input sensor analysis for better classification
    const inputDeviations = temperatures.map(temp => Math.abs(temp - referenceTemp));
    const maxInputDeviation = Math.max(...inputDeviations);
    
    // Use the larger deviation (either from model prediction or input sensors) for classification
    const modelDeviation = Math.abs(result.prediction - referenceTemp);
    const combinedDeviation = Math.max(modelDeviation, maxInputDeviation);
    
    const classification = modelService.classifyPrediction(
      referenceTemp + (combinedDeviation * (result.prediction > referenceTemp ? 1 : -1)), 
      referenceTemp
    );
    const response = {
      success: true,
      prediction: classification.classification,
      confidence: classification.confidence,
      probabilities: classification.probabilities,
      rawPrediction: result.prediction,
      features: {
        temperatures,
        maxDeviation,
        avgDeviation,
        tempRange,
        avgTemperature,
        referenceTemp
      },
      modelInfo: {
        type: modelType,
        availableModels: modelService.getAvailableModels(),
        featureColumns: metadata.feature_columns,
        framework: metadata.framework
      },
      timestamp: result.timestamp
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


