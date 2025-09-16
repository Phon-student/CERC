
def predict_sensor_anomaly(sensor_readings, timestamp=None):
    """
    Predict anomaly for real-time sensor data
    
    sensor_readings: dict with keys like 'SNE22-1_VAV1-2-X_Temp' where X is sensor number
    timestamp: datetime object (optional, defaults to current time)
    """
    import joblib
    import numpy as np
    import pandas as pd
    from datetime import datetime
    
    # Load trained model
    model = joblib.load('trained_models/ensemble_voting_20250916_120605.joblib')
    preprocessing = joblib.load('trained_models/preprocessing_objects_20250916_120605.joblib')
    
    # Feature engineering (implement based on training pipeline)
    # ... (feature extraction code would go here)
    
    # Make prediction
    prediction = model.predict([features])[0]
    probability = model.predict_proba([features])[0][1]
    
    return {
        "anomaly": bool(prediction),
        "confidence": float(probability),
        "timestamp": timestamp or datetime.now(),
        "status": "ANOMALY" if prediction else "NORMAL"
    }
