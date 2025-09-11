# Sensor Drift Analysis Dashboard

A comprehensive Next.js web application for real-time monitoring and analysis of building VAV (Variable Air Volume) temperature sensors with machine learning-based anomaly detection.

## Overview

This dashboard provides a complete interface for monitoring sensor drift and anomalies in building HVAC systems. Built with Next.js 15.5.3, React 19.1.0, and TypeScript, it offers real-time visualization, model testing, and alert management capabilities.

## Features

### 🔄 Real-time Monitoring
- **Live Sensor Cards**: Display current temperature, status, and confidence for 4 VAV sensors
- **Auto-refresh**: 5-second interval updates with quality-weighted data fusion
- **Status Indicators**: Normal (green), Warning (yellow), Anomaly (red) classifications
- **Historical Charts**: Interactive temperature trends with Recharts visualization

### 🤖 ML Model Integration
- **Multiple Algorithms**: Random Forest (100%), Gradient Boosting (99.9%), SVM (94.5%), Autoencoder (92.1%), Ensemble (99.9%)
- **Interactive Testing**: Custom sensor input testing with real-time predictions
- **Feature Engineering**: Automatic calculation of deviations, statistics, and time features
- **Confidence Scoring**: Probabilistic assessment of all predictions

### 📊 Data Management
- **Excel Integration**: Automatic parsing of historical VAV sensor data
- **REST APIs**: Comprehensive endpoints for data access and streaming
- **Real-time Streaming**: WebSocket-style data updates via Server-Sent Events
- **Export Capabilities**: JSON/CSV data export for external analysis

### 🚨 Alert System
- **Multi-level Alerts**: Normal, Warning, Anomaly classifications
- **Smart Filtering**: Filter by status, severity, building, or time range
- **Search Functionality**: Quick alert lookup with text search
- **Status Management**: Mark alerts as acknowledged, resolved, or ignored

## Architecture

### Component Structure
```
src/
├── components/
│   ├── SensorDashboard.tsx    # Main monitoring interface
│   ├── SensorCard.tsx         # Individual sensor display
│   ├── ModelTester.tsx        # ML model testing interface
│   ├── AlertsPanel.tsx        # Alert management system
│   └── Navigation.tsx         # App navigation
├── lib/
│   ├── sensorDataParser.ts    # Excel data processing
│   └── sensorDataService.ts   # API client service
└── app/
    ├── page.tsx               # Dashboard home
    ├── testing/page.tsx       # Model testing page
    ├── training/page.tsx      # Training interface
    ├── alerts/page.tsx        # Alert management
    └── api/                   # REST API endpoints
        ├── sensors/           # Sensor data APIs
        ├── predict/           # ML prediction API
        └── test/              # API health check
```

### API Endpoints

#### Sensor Data
```typescript
// Get live sensor readings
GET /api/sensors?type=live&limit=4

// Get historical data with filtering
GET /api/sensors/history?building=Blk22&startDate=2024-10-01&limit=1000

// Real-time data streaming
GET /api/sensors/stream

// Post new sensor reading
POST /api/sensors
{
  "sensorId": "VAV-5",
  "temperature": 25.4,
  "status": "normal",
  "confidence": 0.95,
  "building": "Blk22",
  "level": 2
}
```

#### Machine Learning
```typescript
// Model predictions
POST /api/predict
{
  "sensorData": [24.5, 25.2, 26.8, 23.1],
  "modelType": "random_forest"
}

// Response
{
  "success": true,
  "prediction": "normal",
  "confidence": 0.95,
  "probabilities": {
    "normal": 0.95,
    "warning": 0.03,
    "anomaly": 0.02
  },
  "features": {
    "maxDeviation": 1.8,
    "avgTemperature": 24.9,
    "tempRange": 3.7
  }
}
```

## Getting Started

### Prerequisites
- Node.js 18.0 or later
- npm 8.0 or later

### Installation

1. **Clone and navigate to dashboard**
   ```bash
   cd sensor-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

### Production Build
```bash
npm run build
npm start
```

## Technology Stack

### Frontend Framework
- **Next.js 15.5.3**: React framework with App Router
- **React 19.1.0**: Component library with server components
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling

### Data Visualization
- **Recharts**: Interactive charts for temperature trends
- **Lucide React**: Modern icon library
- **Custom Components**: Specialized sensor displays

### Data Processing
- **XLSX**: Excel file parsing for historical data
- **Date-fns**: Date manipulation and formatting
- **UUID**: Unique identifier generation

### API Integration
- **Next.js API Routes**: Server-side endpoints
- **Server-Sent Events**: Real-time data streaming
- **Fetch API**: Client-side data fetching

## Configuration

### Environment Variables
```bash
# Optional - defaults work for development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
SENSOR_DATA_PATH=/path/to/sensor/excel/files
```

### Sensor Configuration
```typescript
// Default sensor setup for SNE22-1 system
const defaultSensors = [
  { id: 'VAV-1', name: 'SNE22-1 VAV Zone 1-2-1', building: 'Blk 22' },
  { id: 'VAV-2', name: 'SNE22-1 VAV Zone 1-2-2', building: 'Blk 22' },
  { id: 'VAV-3', name: 'SNE22-1 VAV Zone 1-2-3', building: 'Blk 22' },
  { id: 'VAV-4', name: 'SNE22-1 VAV Zone 1-2-4', building: 'Blk 22' }
];
```

### Model Configuration
```typescript
// Available ML models for prediction
const models = {
  'random_forest': { accuracy: 1.0, description: 'Random Forest Classifier' },
  'gradient_boosting': { accuracy: 0.999, description: 'Gradient Boosting' },
  'ensemble': { accuracy: 0.999, description: 'Ensemble Voting' },
  'svm': { accuracy: 0.945, description: 'Support Vector Machine' },
  'autoencoder': { accuracy: 0.921, description: 'Neural Autoencoder' }
};
```

## Key Features Deep Dive

### Real-time Dashboard
- **Sensor Cards**: Live temperature display with status indicators
- **Quality Assessment**: Confidence scoring and reliability metrics
- **Trend Analysis**: Historical temperature patterns with anomaly highlighting
- **Statistics Panel**: Average confidence, anomaly counts, system health

### Model Testing Interface
- **Interactive Inputs**: Adjust temperature values for each sensor
- **Multi-model Support**: Test different ML algorithms
- **Instant Predictions**: Real-time anomaly detection results
- **Prediction History**: Track recent predictions and patterns
- **Export Results**: Download predictions for analysis

### Alert Management
- **Smart Filtering**: Filter alerts by status, building, date range
- **Bulk Operations**: Mark multiple alerts as resolved/acknowledged
- **Search Functionality**: Quick text-based alert search
- **Priority Levels**: Critical, High, Medium, Low severity levels
- **Status Tracking**: New, Acknowledged, Investigating, Resolved states

### Data Integration
- **Excel Parsing**: Automatic processing of historical VAV data
- **Real-time Updates**: Live sensor data via streaming APIs
- **Quality Control**: Data validation and confidence assessment
- **Export Options**: CSV, JSON export for external analysis

## Performance Optimizations

### Client-side
- **Server-Side Rendering**: Fast initial page loads
- **Code Splitting**: Automatic component lazy loading
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Optimized JavaScript bundles

### Data Handling
- **Incremental Loading**: Paginated historical data
- **Caching Strategy**: Smart data caching for performance
- **Streaming Updates**: Efficient real-time data delivery
- **Error Boundaries**: Graceful error handling

### User Experience
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile and desktop optimized
- **Accessibility**: WCAG 2.1 compliance

## Monitoring and Analytics

### System Health
- **API Response Times**: Monitor endpoint performance
- **Data Quality**: Track sensor reliability and accuracy
- **Error Rates**: Monitor system errors and failures
- **User Activity**: Track dashboard usage patterns

### Sensor Metrics
- **Anomaly Detection Rate**: Track detection accuracy
- **False Positive Rate**: Monitor prediction quality
- **Sensor Uptime**: Track sensor availability
- **Data Completeness**: Monitor missing data points

## Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality
- **ESLint**: Code linting with Next.js config
- **TypeScript**: Full type safety
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

### Testing (Planned)
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing
- **Playwright**: Cross-browser testing

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel with automatic optimizations
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Hosting
```bash
npm run build
npm start
# Serve on port 3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with**: Next.js, React, TypeScript, Tailwind CSS  
**Data Source**: Building VAV temperature sensors  
**ML Models**: Random Forest, Gradient Boosting, SVM, Autoencoder, Ensemble  
**Last Updated**: September 11, 2025
