# ML Integration Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **Issue 1: "Models not preloading on startup"**
**Symptoms**: Dashboard shows "ML Inactive" or models don't load
**Solutions**:
```bash
# Check if model files exist
ls trained_models/onnx/

# Verify model service initialization
curl http://localhost:3000/api/models/status

# Check server logs for model loading errors
npm run dev # Look for "Model metadata loaded" messages
```

### **Issue 2: "Prediction API returns 400 errors"**
**Symptoms**: `/api/predict` returns 400 Bad Request
**Root Cause**: ONNX models expect exactly 3 inputs, dashboard sends variable inputs
**Solutions**:
1. **Use Flexible API (Recommended)**:
   ```javascript
   // Update SensorCard.tsx to use /api/predict-flexible
   const response = await fetch('/api/predict-flexible', {
     method: 'POST',
     body: JSON.stringify({ sensorData: [temp1, temp2, ...] })
   });
   ```

2. **Or fix input format for ONNX**:
   ```javascript
   // Ensure exactly 3 inputs for /api/predict
   const sensorData = [
     sensor.temperature,
     sensor.temperature + variation1,
     sensor.temperature + variation2
   ];
   ```

### **Issue 3: "Flexible API not working"**
**Symptoms**: `/api/predict-flexible` returns 404 or 500 errors
**Solutions**:
```bash
# Verify file exists
ls src/app/api/predict-flexible/route.ts

# Check flexibleModelService
ls src/lib/flexibleModelService.ts

# Test API directly
node test-api-simple.js
```

### **Issue 4: "ML predictions not showing on dashboard"**
**Symptoms**: Sensor cards don't display ML results
**Solutions**:
1. Check browser console for errors
2. Verify SensorCard is calling prediction API:
   ```typescript
   // In SensorCard.tsx, check getMlPrediction function
   const getMlPrediction = useCallback(async () => {
     // Should call /api/predict-flexible
   }, []);
   ```

### **Issue 5: "Development server won't start"**
**Symptoms**: `npm run dev` fails
**Solutions**:
```bash
# Install dependencies
npm install

# Clear Next.js cache
rm -rf .next/

# Check Node.js version (should be 18+)
node --version

# Restart with clean cache
npm run dev -- --reset-cache
```

## 🔧 Quick Diagnostics

### **Health Check Commands**
```bash
# 1. Check if dev server is running
curl http://localhost:3000/api/models/status

# 2. Test flexible prediction API
curl -X POST http://localhost:3000/api/predict-flexible \
  -H "Content-Type: application/json" \
  -d '{"sensorData":[23.5],"sensorId":"TEST","sensorName":"Test"}'

# 3. Check ONNX model status
curl http://localhost:3000/api/models/status | grep -i "ready"

# 4. Verify sensor API
curl "http://localhost:3000/api/sensors?buildings=Blk%201"
```

### **Log Analysis**
Look for these key messages in `npm run dev` output:
- ✅ `🎉 ModelService initialized with X models` - ONNX models loaded
- ✅ `Flexible model service ready` - Statistical service active
- ❌ `Error loading model` - Model loading failed
- ❌ `Prediction API error` - API endpoint issues

## 📊 Testing Your Implementation

### **Step 1: Basic Functionality**
```bash
# Start development server
npm run dev

# In another terminal, test flexible API
node test-api-simple.js
```

### **Step 2: Dashboard Integration**
1. Open browser to `http://localhost:3000`
2. Check for "ML Active" indicator in summary cards
3. Verify sensor cards show confidence scores
4. Look for 🧠 brain icon indicating ML predictions

### **Step 3: Real-world Simulation**
1. Select different buildings
2. Watch sensor cards update with ML predictions
3. Check confidence scores change based on temperature readings
4. Verify fallback to original status if ML fails

## 🎯 Performance Optimization

### **If Predictions Are Slow**
```typescript
// Add caching to flexible model service
const predictionCache = new Map();
const cacheKey = sensorData.join(',');
if (predictionCache.has(cacheKey)) {
  return predictionCache.get(cacheKey);
}
```

### **If Memory Usage Is High**
```typescript
// Implement model cleanup in modelService.ts
process.on('exit', () => {
  ModelService.cleanup();
});
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the main summary**: `ML_INTEGRATION_SUMMARY.md`
2. **Review the code**: Key files are documented with comprehensive comments
3. **Run diagnostics**: Use the health check commands above
4. **Check logs**: Look for error messages in the console output

**Remember**: The flexible model service (`/api/predict-flexible`) is designed to be the primary solution for production use, while the ONNX service (`/api/predict`) is kept for compatibility and specific use cases requiring exactly 3 sensor inputs.