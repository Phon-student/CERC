import * as ort from 'onnxruntime-node';
import * as fs from 'fs';
import * as path from 'path';

// Model metadata interface
interface ModelMetadata {
  models: { [key: string]: string };
  feature_columns: string[];
  input_shape: [null, number];
  reference_temperature: number;
  timestamp: string;
  opset_version: number;
  framework: string;
}

// Prediction result interface
interface PredictionResult {
  prediction: number;
  confidence: number;
  modelType: string;
  features: number[];
  timestamp: string;
  success: boolean;
}

class ModelService {
  private sessions: Map<string, ort.InferenceSession> = new Map();
  private metadata: ModelMetadata | null = null;
  private modelsPath: string;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.modelsPath = path.join(process.cwd(), 'src', 'lib', 'models');
    // Start initialization immediately but don't wait for it
    this.initializationPromise = this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    try {
      console.log('🚀 Starting model preloading...');
      
      // Load metadata
      const metadataPath = path.join(this.modelsPath, 'onnx_metadata_20250916_132947.json');
      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      this.metadata = JSON.parse(metadataContent);

      console.log('📊 Model metadata loaded:', this.metadata);

      // Load ONNX models
      if (this.metadata?.models) {
        const modelLoadPromises = Object.entries(this.metadata.models).map(async ([modelName, modelPath]) => {
          try {
            // Use the actual model filename instead of the path from metadata
            const modelFileName = path.basename(modelPath);
            const actualModelPath = path.join(this.modelsPath, modelFileName);
            
            if (fs.existsSync(actualModelPath)) {
              console.log(`🔄 Loading ${modelName}...`);
              const session = await ort.InferenceSession.create(actualModelPath);
              this.sessions.set(modelName, session);
              console.log(`✅ Loaded model: ${modelName} from ${modelFileName}`);
            } else {
              console.error(`❌ Model file not found: ${actualModelPath}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load model ${modelName}:`, error);
          }
        });

        // Wait for all models to load
        await Promise.all(modelLoadPromises);
      }

      this.isInitialized = true;
      console.log(`🎉 ModelService initialized with ${this.sessions.size} models - Ready for predictions!`);
    } catch (error) {
      console.error('❌ Failed to initialize models:', error);
      this.isInitialized = false;
    }
  }

  // Ensure models are loaded before making predictions
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized && this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  async predict(sensorData: number[], modelType: string = 'random_forest'): Promise<PredictionResult> {
    // Ensure models are loaded before prediction
    await this.ensureInitialized();
    
    try {
      if (!this.metadata) {
        throw new Error('Model metadata not loaded');
      }

      const session = this.sessions.get(modelType);
      if (!session) {
        throw new Error(`Model ${modelType} not found. Available models: ${Array.from(this.sessions.keys()).join(', ')}`);
      }

      // Validate input data
      if (!Array.isArray(sensorData) || sensorData.length !== this.metadata.input_shape[1]) {
        throw new Error(`Invalid input data. Expected ${this.metadata.input_shape[1]} features, got ${sensorData.length}`);
      }

      // Prepare input tensor
      const inputTensor = new ort.Tensor('float32', Float32Array.from(sensorData), [1, sensorData.length]);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[session.inputNames[0]] = inputTensor;

      // Run inference
      const results = await session.run(feeds);
      
      // Extract prediction (assuming regression model)
      const output = results[session.outputNames[0]];
      const prediction = (output.data as Float32Array)[0];

      // Calculate confidence based on prediction deviation from reference
      const referenceTemp = this.metadata.reference_temperature;
      const deviation = Math.abs(prediction - referenceTemp);
      const confidence = Math.max(0.1, Math.min(0.99, 1 - (deviation / 10))); // Simple confidence calculation

      return {
        prediction,
        confidence,
        modelType,
        features: sensorData,
        timestamp: new Date().toISOString(),
        success: true
      };

    } catch (error) {
      console.error('Prediction error:', error);
      return {
        prediction: 0,
        confidence: 0,
        modelType,
        features: sensorData,
        timestamp: new Date().toISOString(),
        success: false
      };
    }
  }

  // Get available models
  getAvailableModels(): string[] {
    return Array.from(this.sessions.keys());
  }

  // Get model metadata
  getMetadata(): ModelMetadata | null {
    return this.metadata;
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isInitialized && this.metadata !== null && this.sessions.size > 0;
  }

  // Get initialization status
  getInitializationStatus(): { 
    isInitialized: boolean; 
    modelsLoaded: number; 
    expectedModels: number;
    loadingProgress: string;
  } {
    const expectedModels = this.metadata?.models ? Object.keys(this.metadata.models).length : 0;
    const loadedModels = this.sessions.size;
    const progress = expectedModels > 0 ? `${loadedModels}/${expectedModels}` : '0/0';
    
    return {
      isInitialized: this.isInitialized,
      modelsLoaded: loadedModels,
      expectedModels,
      loadingProgress: progress
    };
  }

  // Convert regression prediction to classification
  classifyPrediction(prediction: number, referenceTemp: number = 25.0): {
    classification: 'normal' | 'warning' | 'anomaly';
    confidence: number;
    probabilities: { normal: number; warning: number; anomaly: number };
  } {
    const deviation = Math.abs(prediction - referenceTemp);
    
    let classification: 'normal' | 'warning' | 'anomaly';
    let anomalyProb = 0;
    let warningProb = 0;
    let normalProb = 0;

    // Adjust thresholds for better classification
    if (deviation <= 0.5) {
      classification = 'normal';
      normalProb = 0.95 - (deviation * 0.1);
      warningProb = 0.03 + (deviation * 0.05);
      anomalyProb = 0.02 + (deviation * 0.05);
    } else if (deviation <= 1.5) {
      classification = 'warning';
      normalProb = 0.5 - (deviation * 0.2);
      warningProb = 0.4 + (deviation * 0.2);
      anomalyProb = 0.1 + (deviation * 0.1);
    } else {
      classification = 'anomaly';
      const saturation = Math.min(deviation / 5.0, 1.0); // Cap at deviation of 5°C
      normalProb = 0.1 * (1 - saturation);
      warningProb = 0.2 * (1 - saturation * 0.5);
      anomalyProb = 0.7 + (saturation * 0.25);
    }

    // Normalize probabilities to sum to 1
    const total = normalProb + warningProb + anomalyProb;
    normalProb /= total;
    warningProb /= total;
    anomalyProb /= total;

    const confidence = Math.max(normalProb, warningProb, anomalyProb);

    return {
      classification,
      confidence,
      probabilities: { normal: normalProb, warning: warningProb, anomaly: anomalyProb }
    };
  }
}

// Singleton instance
let modelService: ModelService | null = null;

export function getModelService(): ModelService {
  if (!modelService) {
    modelService = new ModelService();
  }
  return modelService;
}

export type { PredictionResult, ModelMetadata };