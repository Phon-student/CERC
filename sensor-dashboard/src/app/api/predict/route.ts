import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sensorData, modelType = 'random_forest' } = await request.json();

    // Validate input
    if (!sensorData || !Array.isArray(sensorData) || sensorData.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid sensor data. Expected array of 4 temperature readings.' },
        { status: 400 }
      );
    }

    // Simulate model prediction (replace with actual model call)
    const prediction = simulateModelPrediction(sensorData, modelType);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function simulateModelPrediction(sensorData: number[], modelType: string) {
  const referenceTemp = 25.0;
  
  // Calculate features similar to your notebook
  const temperatures = sensorData;
  const deviations = temperatures.map(temp => Math.abs(temp - referenceTemp));
  const maxDeviation = Math.max(...deviations);
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
  
  // Simulate model-specific predictions
  let anomalyProb = 0;
  let warningProb = 0;
  
  // Higher probability of anomaly for larger deviations
  const deviationScore = maxDeviation / 5.0; // Normalize to 0-1
  const rangeScore = tempRange / 10.0; // Normalize to 0-1
  
  switch (modelType) {
    case 'random_forest':
      anomalyProb = Math.min(0.99, Math.max(0.01, deviationScore * 0.8 + rangeScore * 0.2));
      break;
    case 'gradient_boosting':
      anomalyProb = Math.min(0.98, Math.max(0.02, deviationScore * 0.75 + rangeScore * 0.25));
      break;
    case 'svm':
      anomalyProb = Math.min(0.95, Math.max(0.05, deviationScore * 0.7 + rangeScore * 0.3));
      break;
    case 'autoencoder':
      anomalyProb = Math.min(0.92, Math.max(0.08, deviationScore * 0.6 + rangeScore * 0.4));
      break;
    case 'ensemble':
      anomalyProb = Math.min(0.999, Math.max(0.001, deviationScore * 0.85 + rangeScore * 0.15));
      break;
    default:
      anomalyProb = Math.min(0.99, Math.max(0.01, deviationScore * 0.8 + rangeScore * 0.2));
  }
  
  warningProb = Math.max(0, anomalyProb - 0.3);
  const normalProb = 1 - anomalyProb - warningProb;
  
  // Determine prediction
  let prediction: 'normal' | 'warning' | 'anomaly';
  let confidence: number;
  
  if (anomalyProb > 0.7) {
    prediction = 'anomaly';
    confidence = anomalyProb;
  } else if (anomalyProb > 0.5 || warningProb > 0.3) {
    prediction = 'warning';
    confidence = Math.max(anomalyProb, warningProb);
  } else {
    prediction = 'normal';
    confidence = normalProb;
  }
  
  return {
    prediction,
    confidence,
    probabilities: {
      normal: normalProb,
      warning: warningProb,
      anomaly: anomalyProb
    },
    features: {
      maxDeviation,
      avgDeviation,
      tempRange,
      temperatures
    },
    modelType,
    timestamp: new Date().toISOString()
  };
}
