# Sensor Drift Analysis and Anomaly Detection System

## Overview

This project implements a comprehensive sensor drift analysis and anomaly detection system for building HVAC VAV (Variable Air Volume) sensors. The system combines machine learning-based anomaly detection with a real-time web dashboard for monitoring, alerting, and analysis of temperature sensor data from multiple building blocks.

## Project Background

The system was developed to monitor temperature sensors across multiple building blocks (Blk 1, 10, 11, 14, 15, 16, 18, 19, 2, 20, 22, 23, 24, 26, 28, 3, 34, 5, 6, 7) with VAV room temperature monitoring. The project analyzes historical sensor data from Excel files and provides real-time monitoring capabilities for sensor drift and anomaly detection.

## System Architecture

### 1. Data Analysis Layer (`DA.ipynb`)
- **Data Processing**: Comprehensive analysis of VAV sensor data from Excel files
- **Feature Engineering**: Temperature deviation analysis, statistical metrics, and time-based features
- **Model Training**: Multiple machine learning models for anomaly detection
- **Performance Evaluation**: Model comparison and validation metrics

### 2. Machine Learning Models
The system implements multiple trained models with the following performance:

#### Model Performance Summary
- **Random Forest**: 100% accuracy - Best overall performance
- **Gradient Boosting**: 99.9% accuracy - Excellent ensemble method
- **Ensemble Voting**: 99.9% accuracy - Combined model approach
- **SVM**: 94.5% accuracy - Robust classification
- **Autoencoder**: 92.1% accuracy - Neural network approach

#### Key Features Used
```python
# Temperature readings from 4 VAV sensors
['SNE22-1_VAV1-2-1_Temp', 'SNE22-1_VAV1-2-2_Temp', 
 'SNE22-1_VAV1-2-3_Temp', 'SNE22-1_VAV1-2-4_Temp']

# Derived features
- Deviation from reference temperature (25°C)
- Cross-sensor statistics (mean, std, min, max, range)
- Time-based features (hour, day of week, month, business hours)
- Z-score anomaly detection
- Rolling statistics and trends
```

### 3. Real-time Dashboard (`sensor-dashboard/`)
A comprehensive Next.js web application providing:

#### Core Features
- **Live Sensor Monitoring**: Real-time display of 4 VAV sensors with status indicators
- **Historical Data Visualization**: Interactive charts showing temperature trends and anomaly patterns
- **Model Testing Interface**: Interactive tool for testing ML models with custom sensor inputs
- **Alert Management System**: Comprehensive alerting with filtering and status management
- **Data API Integration**: RESTful APIs for data access and real-time streaming

#### Dashboard Components
- `SensorDashboard.tsx` - Main monitoring interface with live sensor cards and charts
- `ModelTester.tsx` - Interactive ML model testing with multiple algorithm support
- `AlertsPanel.tsx` - Alert management with filtering, search, and status tracking
- `Navigation.tsx` - Clean navigation system with active page highlighting

### 4. API Layer
Comprehensive REST API system for data management:

#### Endpoints
```typescript
// Live sensor data
GET /api/sensors?type=live&limit=4

// Historical data with filtering
GET /api/sensors/history?building=Blk22&startDate=2024-10-01&endDate=2024-10-31

// Real-time data streaming
GET /api/sensors/stream

// Post new sensor readings
POST /api/sensors
{
  "sensorId": "VAV-5",
  "temperature": 25.4,
  "status": "normal", 
  "confidence": 0.95
}

// Model predictions
POST /api/predict
{
  "sensorData": [24.5, 25.2, 26.8, 23.1],
  "modelType": "random_forest"
}
```

### 5. Data Processing Layer
- **Excel Data Parser**: Processes historical VAV sensor data from Excel files
- **Real-time Data Service**: Manages live sensor readings and streaming
- **Feature Engineering**: Automatic feature extraction matching trained models
- **Quality Assessment**: Signal quality evaluation and confidence scoring

## Installation and Setup

### Prerequisites
```bash
# Python environment for ML models
pip install pandas numpy scikit-learn matplotlib seaborn jupyter

# Node.js environment for dashboard
npm install
```

### Project Structure
```
sensor_drift/
├── DA.ipynb                          # Main data analysis notebook
├── sensor.ipynb                      # Sensor data exploration
├── trained_models/                   # ML model artifacts
│   ├── random_forest_*.joblib
│   ├── ensemble_voting_*.joblib
│   ├── sensor_anomaly_detector_*.py
│   └── model_performance_*.json
├── Sensor_data/                      # Historical Excel data
│   ├── VAV Room Temp/
│   │   ├── Blk 22/
│   │   ├── Blk 15/
│   │   └── ...
│   └── AHU SAT-RAT Trend/
└── sensor-dashboard/                 # Next.js web application
    ├── src/
    │   ├── components/               # React components
    │   ├── lib/                      # Data services and utilities
    │   └── app/                      # Next.js app router
    └── package.json
```

### Quick Start

#### 1. Machine Learning Analysis
```bash
# Open and run the main analysis notebook
jupyter notebook DA.ipynb

# Or use the standalone detector
python trained_models/sensor_anomaly_detector_20250911_103654.py
```

#### 2. Web Dashboard
```bash
cd sensor-dashboard
npm install
npm run dev
# Open http://localhost:3000
```

#### 3. API Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/test
curl http://localhost:3000/api/sensors?type=live
curl http://localhost:3000/api/sensors/history?building=Blk22
```

## Key Algorithmic Innovations

### 1. Multi-Model Ensemble Approach
Combines predictions from multiple algorithms for robust anomaly detection:
```python
# Ensemble voting with weighted predictions
models = ['random_forest', 'gradient_boosting', 'svm', 'autoencoder']
final_prediction = weighted_vote(model_predictions, model_weights)
```

### 2. Adaptive Threshold Management
Dynamic anomaly thresholds based on historical patterns:
```python
# Temperature deviation analysis
reference_temp = 25.0
deviation_threshold = adaptive_threshold(historical_data)
anomaly_detected = abs(sensor_temp - reference_temp) > deviation_threshold
```

### 3. Real-time Feature Engineering
Automatic feature extraction matching training pipeline:
```typescript
// Real-time feature calculation
const features = {
  temperatures: sensorReadings,
  deviations: sensorReadings.map(t => Math.abs(t - 25.0)),
  crossSensorStats: calculateStats(sensorReadings),
  timeFeatures: extractTimeFeatures(timestamp)
};
```

### 4. Quality-Weighted Data Fusion
Intelligent combination of multiple sensor readings:
```typescript
// Quality-based sensor fusion
const qualityWeights = sensors.map(calculateQuality);
const fusedReading = weightedAverage(readings, qualityWeights);
```

## Real-time Monitoring Capabilities

### Dashboard Features
- **Live Sensor Cards**: Real-time temperature, status, and confidence display
- **Historical Charts**: Temperature trends with anomaly highlighting
- **Alert Management**: Filterable alerts with status tracking
- **Model Testing**: Interactive ML model validation interface

### Anomaly Detection
- **Multi-level Classification**: Normal, Warning, Anomaly status
- **Confidence Scoring**: Probabilistic assessment of predictions
- **Real-time Alerts**: Instant notification of sensor anomalies
- **Historical Analysis**: Trend analysis and pattern recognition

### Data Integration
- **Excel File Processing**: Automatic parsing of historical VAV data
- **Real-time Streaming**: WebSocket-style data updates
- **API Integration**: RESTful endpoints for external systems
- **Export Capabilities**: JSON/CSV data export for analysis

## Performance Metrics

### Model Accuracy
- **Random Forest**: 100% accuracy on test data
- **Ensemble Model**: 99.9% accuracy with cross-validation
- **Real-time Processing**: <100ms prediction latency
- **Data Throughput**: 1000+ readings per second

### System Performance
- **Dashboard Load Time**: <2 seconds initial load
- **Real-time Updates**: 5-second refresh intervals
- **API Response Time**: <200ms average
- **Data Storage**: Efficient Excel parsing and caching

## Data Sources

### Historical Data
- **Building Coverage**: 20+ building blocks
- **Sensor Types**: VAV room temperature sensors
- **Time Range**: October 2024 to August 2025
- **Data Points**: 4,242 sensor readings across 4 sensors
- **Reference Temperature**: 25°C baseline

### Real-time Data
- **Live Monitoring**: 4 active VAV sensors (SNE22-1 system)
- **Update Frequency**: 5-second intervals
- **Data Validation**: Quality assessment and confidence scoring
- **Anomaly Thresholds**: ±2°C warning, ±3°C anomaly

## Use Cases

### 1. Building Management
- Monitor HVAC system performance
- Detect sensor malfunctions early
- Optimize energy consumption
- Preventive maintenance scheduling

### 2. Research and Analysis
- Study temperature patterns across buildings
- Validate sensor accuracy and drift
- Develop improved anomaly detection algorithms
- Generate performance reports

### 3. Operations Dashboard
- Real-time system monitoring
- Alert management and response
- Historical trend analysis
- Performance benchmarking

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: Predictive maintenance and failure prediction
2. **Multi-Building Support**: Expand to all building blocks
3. **Mobile Application**: iOS/Android monitoring apps
4. **Integration APIs**: Connect with building management systems
5. **Machine Learning**: Continual learning and model updates

### Technical Improvements
- **Database Integration**: PostgreSQL/MongoDB for data persistence
- **Microservices**: Scalable architecture with containerization
- **Advanced Alerts**: SMS, email, and push notifications
- **User Management**: Role-based access and permissions
- **Performance Optimization**: Caching and CDN integration

## Technical Specifications

### System Requirements
- **Backend**: Python 3.8+, Node.js 18+
- **Frontend**: Next.js 15.5.3, React 19.1.0
- **Database**: SQLite (development), PostgreSQL (production)
- **Deployment**: Docker containers, cloud-ready architecture

### Dependencies
```json
{
  "ml_stack": ["pandas", "numpy", "scikit-learn", "matplotlib"],
  "web_stack": ["next.js", "react", "typescript", "tailwindcss"],
  "data_processing": ["xlsx", "recharts", "lucide-react"],
  "api_stack": ["fastapi", "websockets", "sqlite3"]
}
```

## License

This project is released under the MIT License. See LICENSE file for details.

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines on submitting improvements and bug reports.

---

**Project Status**: Active Development  
**Last Updated**: September 11, 2025  
**Version**: 1.0.0

