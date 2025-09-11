
# Standalone Sensor Anomaly Detection Script
# Generated on 20250911_103654
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

class SensorAnomalyDetector:
    def __init__(self, model_path, metadata_path):
        '''
        Initialize the anomaly detector
        
        Parameters:
        -----------
        model_path : str
            Path to the saved model file
        metadata_path : str  
            Path to the metadata JSON file
        '''
        self.model = joblib.load(model_path)
        
        import json
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)
            
        self.feature_columns = self.metadata['feature_columns']
        self.reference_temp = self.metadata['reference_temperature']
        
    def prepare_features(self, sensor_data, timestamp=None):
        '''
        Prepare features from raw sensor data
        
        Parameters:
        -----------
        sensor_data : dict
            Dictionary with sensor temperature readings
            Keys should match: ['SNE22-1_VAV1-2-1_Temp', 'SNE22-1_VAV1-2-2_Temp', 'SNE22-1_VAV1-2-3_Temp', 'SNE22-1_VAV1-2-4_Temp', 'SNE22-1_VAV1-2-1_Temp_Status', 'SNE22-1_VAV1-2-2_Temp_Status', 'SNE22-1_VAV1-2-3_Temp_Status', 'SNE22-1_VAV1-2-4_Temp_Status', 'SNE22-1_VAV1-2-1_Temp_ZScore', 'SNE22-1_VAV1-2-1_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-2_Temp_ZScore', 'SNE22-1_VAV1-2-2_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-3_Temp_ZScore', 'SNE22-1_VAV1-2-3_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-4_Temp_ZScore', 'SNE22-1_VAV1-2-4_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-1_Temp_MA', 'SNE22-1_VAV1-2-1_Temp_MA_Deviation', 'SNE22-1_VAV1-2-1_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-2_Temp_MA', 'SNE22-1_VAV1-2-2_Temp_MA_Deviation', 'SNE22-1_VAV1-2-2_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-3_Temp_MA', 'SNE22-1_VAV1-2-3_Temp_MA_Deviation', 'SNE22-1_VAV1-2-3_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-4_Temp_MA', 'SNE22-1_VAV1-2-4_Temp_MA_Deviation', 'SNE22-1_VAV1-2-4_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-1_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-1_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-2_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-2_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-3_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-3_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-4_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-4_Temp_Ensemble_Anomaly']
        timestamp : datetime, optional
            Timestamp for the reading
            
        Returns:
        --------
        numpy.ndarray : Feature vector ready for prediction
        '''
        if timestamp is None:
            timestamp = datetime.now()
            
        # Extract temperature values
        temp_values = []
        for col in ['SNE22-1_VAV1-2-1_Temp', 'SNE22-1_VAV1-2-2_Temp', 'SNE22-1_VAV1-2-3_Temp', 'SNE22-1_VAV1-2-4_Temp', 'SNE22-1_VAV1-2-1_Temp_Status', 'SNE22-1_VAV1-2-2_Temp_Status', 'SNE22-1_VAV1-2-3_Temp_Status', 'SNE22-1_VAV1-2-4_Temp_Status', 'SNE22-1_VAV1-2-1_Temp_ZScore', 'SNE22-1_VAV1-2-1_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-2_Temp_ZScore', 'SNE22-1_VAV1-2-2_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-3_Temp_ZScore', 'SNE22-1_VAV1-2-3_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-4_Temp_ZScore', 'SNE22-1_VAV1-2-4_Temp_ZScore_Anomaly', 'SNE22-1_VAV1-2-1_Temp_MA', 'SNE22-1_VAV1-2-1_Temp_MA_Deviation', 'SNE22-1_VAV1-2-1_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-2_Temp_MA', 'SNE22-1_VAV1-2-2_Temp_MA_Deviation', 'SNE22-1_VAV1-2-2_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-3_Temp_MA', 'SNE22-1_VAV1-2-3_Temp_MA_Deviation', 'SNE22-1_VAV1-2-3_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-4_Temp_MA', 'SNE22-1_VAV1-2-4_Temp_MA_Deviation', 'SNE22-1_VAV1-2-4_Temp_MA_Anomaly', 'SNE22-1_VAV1-2-1_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-1_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-2_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-2_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-3_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-3_Temp_Ensemble_Anomaly', 'SNE22-1_VAV1-2-4_Temp_Ensemble_Score', 'SNE22-1_VAV1-2-4_Temp_Ensemble_Anomaly']:
            if col in sensor_data:
                temp_values.append(float(sensor_data[col]))
            else:
                print(f"Warning: Missing sensor data for {col}")
                temp_values.append(25.0)  # Default to reference temperature
        
        # Create basic features (simplified version)
        features = []
        
        # Original temperature values
        features.extend(temp_values)
        
        # Deviation from reference
        for temp in temp_values:
            features.append(temp - self.reference_temp)  # DevFromRef
            features.append(abs(temp - self.reference_temp))  # AbsDevFromRef
        
        # Cross-sensor statistics
        features.append(np.mean(temp_values))  # Mean_All_Sensors
        features.append(np.std(temp_values))   # Std_All_Sensors
        features.append(np.min(temp_values))   # Min_All_Sensors
        features.append(np.max(temp_values))   # Max_All_Sensors
        features.append(np.max(temp_values) - np.min(temp_values))  # Range_All_Sensors
        
        # Time features
        features.append(timestamp.hour)  # Hour
        features.append(timestamp.weekday())  # DayOfWeek
        features.append(timestamp.month)  # Month
        features.append(1 if timestamp.weekday() >= 5 else 0)  # IsWeekend
        features.append(1 if 8 <= timestamp.hour <= 17 else 0)  # IsBusinessHours
        
        # Pad with zeros if needed (for rolling statistics that aren't available)
        while len(features) < len(self.feature_columns):
            features.append(0.0)
        
        # Truncate if too long
        features = features[:len(self.feature_columns)]
        
        return np.array(features).reshape(1, -1)
    
    def predict(self, sensor_data, timestamp=None):
        '''
        Predict anomaly for sensor data
        
        Parameters:
        -----------
        sensor_data : dict
            Sensor readings
        timestamp : datetime, optional
            Timestamp of the reading
            
        Returns:
        --------
        dict : Prediction results
        '''
        try:
            # Prepare features
            features = self.prepare_features(sensor_data, timestamp)
            
            # Make prediction
            prediction = self.model.predict(features)[0]
            
            # Get probability if available
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(features)[0]
                confidence = probabilities[1] if len(probabilities) > 1 else probabilities[0]
            else:
                confidence = 1.0 if prediction else 0.0
            
            return {
                'timestamp': timestamp or datetime.now(),
                'anomaly_detected': bool(prediction),
                'confidence': float(confidence),
                'status': 'ANOMALY' if prediction else 'NORMAL',
                'sensor_data': sensor_data
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': timestamp or datetime.now()
            }

# Usage Example:
if __name__ == "__main__":
    # Example usage
    detector = SensorAnomalyDetector(
        'model_path.pkl',  # Replace with actual model path
        'metadata.json'    # Replace with actual metadata path
    )
    
    # Example sensor reading
    sensor_reading = {
        'SNE22-1_VAV1-2-1_Temp': 25.5, 'SNE22-1_VAV1-2-2_Temp': 25.5
        # Add all your sensor readings here
    }
    
    result = detector.predict(sensor_reading)
    print(result)
