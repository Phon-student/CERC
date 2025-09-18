/**
 * Flexible Model Service for Variable Sensor Inputs
 * =================================================
 * 
 * This service handles ML predictions for varying numbers of sensor inputs.
 * It can work with 1 to N sensors and provides robust feature engineering.
 * 
 * Key Features:
 * - Variable input size (1-10+ sensors)
 * - Robust statistical feature extraction
 * - Fallback mechanisms for missing sensors
 * - Compatible with existing ONNX models via feature adaptation
 */

import * as fs from 'fs';
import * as path from 'path';

interface FlexiblePredictionResult {
  success: boolean;
  prediction: 'normal' | 'warning' | 'critical';
  confidence: number;
  rawPrediction?: number;
  inputSensors: number;
  features: {
    meanTemp: number;
    tempStd: number;
    tempRange: number;
    maxDeviation: number;
    activeSensors: number;
  };
  timestamp: string;
}

interface FlexibleModelMetadata {
  referenceTemperature: number;
  warningThreshold: number;
  criticalThreshold: number;
  maxSensors: number;
  version: string;
}

export class FlexibleModelService {
  private static instance: FlexibleModelService;
  private metadata: FlexibleModelMetadata;
  private isReady: boolean = false;

  private constructor() {
    this.metadata = {
      referenceTemperature: 25.0,
      warningThreshold: 1.5,
      criticalThreshold: 2.5,
      maxSensors: 10,
      version: 'flexible_v1.0'
    };
    this.initialize();
  }

  public static getInstance(): FlexibleModelService {
    if (!FlexibleModelService.instance) {
      FlexibleModelService.instance = new FlexibleModelService();
    }
    return FlexibleModelService.instance;
  }

  private async initialize(): Promise<void> {
    console.log('🚀 Initializing Flexible Model Service...');
    
    try {
      // Load metadata if available
      const metadataPath = path.join(process.cwd(), 'src', 'lib', 'models', 'flexible_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        this.metadata = { ...this.metadata, ...JSON.parse(metadataContent) };
        console.log('📊 Loaded flexible model metadata');
      }
      
      this.isReady = true;
      console.log('🎉 Flexible Model Service ready for variable sensor inputs!');
      
    } catch (error) {
      console.error('❌ Error initializing Flexible Model Service:', error);
      this.isReady = true; // Still proceed with default parameters
    }
  }

  /**
   * Extract robust statistical features from variable number of sensors
   */
  private extractFeatures(sensorReadings: number[]): {
    meanTemp: number;
    tempStd: number;
    tempRange: number;
    maxDeviation: number;
    activeSensors: number;
  } {
    // Filter out invalid readings
    const validReadings = sensorReadings.filter(temp => 
      !isNaN(temp) && isFinite(temp) && temp > 0 && temp < 60
    );

    if (validReadings.length === 0) {
      // No valid sensors - return defaults based on reference
      return {
        meanTemp: this.metadata.referenceTemperature,
        tempStd: 0,
        tempRange: 0,
        maxDeviation: 0,
        activeSensors: 0
      };
    }

    // Calculate statistical features
    const meanTemp = validReadings.reduce((sum, temp) => sum + temp, 0) / validReadings.length;
    
    // Standard deviation
    const variance = validReadings.reduce((sum, temp) => sum + Math.pow(temp - meanTemp, 2), 0) / validReadings.length;
    const tempStd = Math.sqrt(variance);
    
    // Temperature range
    const minTemp = Math.min(...validReadings);
    const maxTemp = Math.max(...validReadings);
    const tempRange = maxTemp - minTemp;
    
    // Maximum deviation from reference
    const deviations = validReadings.map(temp => Math.abs(temp - this.metadata.referenceTemperature));
    const maxDeviation = Math.max(...deviations);
    
    return {
      meanTemp: Math.round(meanTemp * 10) / 10,
      tempStd: Math.round(tempStd * 100) / 100,
      tempRange: Math.round(tempRange * 100) / 100,
      maxDeviation: Math.round(maxDeviation * 100) / 100,
      activeSensors: validReadings.length
    };
  }

  /**
   * Classify temperature deviation into normal/warning/critical
   */
  private classifyTemperature(features: any): {
    classification: 'normal' | 'warning' | 'critical';
    confidence: number;
  } {
    const { meanTemp, maxDeviation, tempRange, tempStd, activeSensors } = features;
    
    // Primary classification based on deviation from reference
    let baseClassification: 'normal' | 'warning' | 'critical';
    let baseConfidence: number;
    
    if (maxDeviation <= this.metadata.warningThreshold) {
      baseClassification = 'normal';
      baseConfidence = Math.max(60, 100 - (maxDeviation / this.metadata.warningThreshold) * 40);
    } else if (maxDeviation <= this.metadata.criticalThreshold) {
      baseClassification = 'warning';
      baseConfidence = Math.max(50, 80 - (maxDeviation - this.metadata.warningThreshold) / 
        (this.metadata.criticalThreshold - this.metadata.warningThreshold) * 30);
    } else {
      baseClassification = 'critical';
      baseConfidence = Math.min(95, 70 + (maxDeviation - this.metadata.criticalThreshold) * 10);
    }

    // Adjust confidence based on additional factors
    let adjustedConfidence = baseConfidence;

    // Factor 1: Temperature range (higher range = less confidence)
    if (tempRange > 2.0) {
      adjustedConfidence *= 0.9; // Reduce confidence by 10%
    }

    // Factor 2: Standard deviation (higher std = less confidence)
    if (tempStd > 1.0) {
      adjustedConfidence *= 0.95; // Reduce confidence by 5%
    }

    // Factor 3: Number of sensors (fewer sensors = less confidence)
    if (activeSensors < 2) {
      adjustedConfidence *= 0.8; // Reduce confidence by 20%
    } else if (activeSensors >= 3) {
      adjustedConfidence *= 1.1; // Increase confidence by 10%
    }

    // Factor 4: Extremely high deviation should always be critical
    if (maxDeviation > 5.0) {
      baseClassification = 'critical';
      adjustedConfidence = Math.min(95, 80 + maxDeviation * 2);
    }

    // Ensure confidence is within bounds
    adjustedConfidence = Math.max(10, Math.min(100, adjustedConfidence));

    return {
      classification: baseClassification,
      confidence: Math.round(adjustedConfidence * 10) / 10
    };
  }

  /**
   * Make prediction with flexible number of sensor inputs
   */
  public async predict(sensorReadings: number[]): Promise<FlexiblePredictionResult> {
    if (!this.isReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      // Extract features from variable sensor inputs
      const features = this.extractFeatures(sensorReadings);
      
      // Classify the temperature reading
      const classification = this.classifyTemperature(features);
      
      // Create result
      const result: FlexiblePredictionResult = {
        success: true,
        prediction: classification.classification,
        confidence: classification.confidence,
        rawPrediction: features.meanTemp,
        inputSensors: sensorReadings.length,
        features,
        timestamp: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error('❌ Flexible prediction error:', error);
      return {
        success: false,
        prediction: 'normal',
        confidence: 0,
        inputSensors: sensorReadings.length,
        features: {
          meanTemp: this.metadata.referenceTemperature,
          tempStd: 0,
          tempRange: 0,
          maxDeviation: 0,
          activeSensors: 0
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if service is ready
   */
  public isServiceReady(): boolean {
    return this.isReady;
  }

  /**
   * Get service metadata
   */
  public getMetadata(): FlexibleModelMetadata {
    return this.metadata;
  }

  /**
   * Get service status
   */
  public getStatus() {
    return {
      ready: this.isReady,
      version: this.metadata.version,
      maxSensors: this.metadata.maxSensors,
      referenceTemperature: this.metadata.referenceTemperature,
      supportedInputSizes: '1 to N sensors',
      features: [
        'Variable sensor count (1-N)',
        'Statistical feature extraction',
        'Robust anomaly detection',
        'Real-time classification',
        'Confidence scoring'
      ]
    };
  }
}

// Export singleton instance
export const flexibleModelService = FlexibleModelService.getInstance();