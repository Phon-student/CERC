export interface SensorReading {
  id: string;
  name: string;
  building?: string;
  level?: number;
  temperature: number;
  timestamp: Date;
  lastUpdated?: Date;  // For compatibility with existing dashboard
  status: 'normal' | 'warning' | 'anomaly';
  confidence: number;
}

export interface HistoricalData {
  timestamp: string;
  sensor1: number;
  sensor2: number;
  sensor3: number;
  sensor4: number;
  anomalyCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  count?: number;
  metadata?: any;
  error?: string;
}

class SensorDataService {
  private baseUrl = '/api/sensors';

  /**
   * Get available buildings
   */
  async getAvailableBuildings(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/buildings`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response:', await response.text());
        throw new Error('API returned non-JSON response');
      }
      
      const result: ApiResponse<string[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch available buildings');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching available buildings:', error);
      // Return default buildings if API fails
      return [
        'Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7', 'Blk 10', 'Blk 11', 
        'Blk 14', 'Blk 15', 'Blk 16', 'Blk 18', 'Blk 19', 'Blk 20', 'Blk 22', 
        'Blk 23', 'Blk 24', 'Blk 26', 'Blk 28', 'Blk 34'
      ];
    }
  }

  /**
   * Get building statistics
   */
  async getBuildingStatistics(): Promise<{ building: string; sensorCount: number; anomalyRate: number }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/statistics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Statistics API returned non-JSON response');
        throw new Error('API returned non-JSON response');
      }
      
      const result: ApiResponse<{ building: string; sensorCount: number; anomalyRate: number }[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch statistics');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching building statistics:', error);
      // Return mock statistics based on building activity
      return [
        { building: 'Blk 22', sensorCount: 12, anomalyRate: 0.15 },
        { building: 'Blk 15', sensorCount: 10, anomalyRate: 0.08 },
        { building: 'Blk 19', sensorCount: 8, anomalyRate: 0.12 },
        { building: 'Blk 11', sensorCount: 7, anomalyRate: 0.05 },
        { building: 'Blk 16', sensorCount: 6, anomalyRate: 0.10 },
        { building: 'Blk 10', sensorCount: 5, anomalyRate: 0.07 }
      ];
    }
  }

  /**
   * Get most active buildings (by sensor count)
   */
  async getMostActiveBuildings(limit: number = 4): Promise<string[]> {
    try {
      const stats = await this.getBuildingStatistics();
      return stats
        .sort((a, b) => b.sensorCount - a.sensorCount) // Sort by sensor count descending
        .slice(0, limit)
        .map(stat => stat.building);
    } catch (error) {
      console.error('Error fetching most active buildings:', error);
      return ['Blk 22', 'Blk 15', 'Blk 19', 'Blk 11'];
    }
  }

  /**
   * Get live sensor data
   */
  async getLiveSensorData(buildings?: string[]): Promise<SensorReading[]> {
    try {
      const buildingsParam = buildings && buildings.length > 0 ? buildings.join(',') : undefined;
      const url = `${this.baseUrl}?type=live&limit=20${buildingsParam ? `&buildings=${buildingsParam}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('API returned non-JSON response:', responseText);
        throw new Error('API returned non-JSON response');
      }
      
      const result: ApiResponse<SensorReading[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live sensor data');
      }
      
      return result.data.map(reading => ({
        ...reading,
        timestamp: new Date(reading.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching live sensor data:', error);
      return this.getFallbackData(buildings);
    }
  }

  /**
   * Get historical sensor data
   */
  async getHistoricalData(params?: {
    building?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SensorReading[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.building) searchParams.set('building', params.building);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/history?${searchParams}`);
      const result: ApiResponse<SensorReading[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch historical data');
      }
      
      return result.data.map(reading => ({
        ...reading,
        timestamp: new Date(reading.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching historical sensor data:', error);
      return [];
    }
  }

  /**
   * Post new sensor reading
   */
  async postSensorReading(reading: Omit<SensorReading, 'timestamp'>): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensorId: reading.id,
          temperature: reading.temperature,
          status: reading.status,
          confidence: reading.confidence,
          building: reading.building,
          level: reading.level
        }),
      });

      const result: ApiResponse<SensorReading> = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error posting sensor reading:', error);
      return false;
    }
  }

  /**
   * Start real-time sensor stream
   */
  startSensorStream(onData: (readings: SensorReading[]) => void, onError?: (error: Error) => void): () => void {
    let isCancelled = false;

    const startStream = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/stream`);
        
        if (!response.body) {
          throw new Error('No response body for sensor stream');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (!isCancelled) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.type === 'sensor_update' && data.data) {
                const readings = data.data.map((reading: any) => ({
                  ...reading,
                  timestamp: new Date(reading.timestamp)
                }));
                onData(readings);
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', parseError);
            }
          }
        }
      } catch (error) {
        if (!isCancelled && onError) {
          onError(error instanceof Error ? error : new Error('Stream error'));
        }
      }
    };

    startStream();

    // Return cleanup function
    return () => {
      isCancelled = true;
    };
  }

  /**
   * Convert sensor readings to historical chart data
   */
  convertToHistoricalData(readings: SensorReading[]): HistoricalData[] {
    // Group readings by time intervals (e.g., hourly)
    const grouped = new Map<string, SensorReading[]>();

    readings.forEach(reading => {
      // Round to nearest hour for grouping
      const hourKey = new Date(reading.timestamp);
      hourKey.setMinutes(0, 0, 0);
      const key = hourKey.toISOString();

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(reading);
    });

    // Convert to chart data format
    const chartData: HistoricalData[] = [];
    
    for (const [timeKey, groupReadings] of grouped) {
      const timestamp = new Date(timeKey).toLocaleTimeString();
      
      // Get average temperature for up to 4 sensors
      const sensorTemps = [0, 0, 0, 0];
      const sensorCounts = [0, 0, 0, 0];
      
      groupReadings.forEach((reading, index) => {
        const sensorIndex = index % 4;
        sensorTemps[sensorIndex] += reading.temperature;
        sensorCounts[sensorIndex]++;
      });

      const anomalyCount = groupReadings.filter(r => r.status === 'anomaly').length;

      chartData.push({
        timestamp,
        sensor1: sensorCounts[0] > 0 ? sensorTemps[0] / sensorCounts[0] : 25,
        sensor2: sensorCounts[1] > 0 ? sensorTemps[1] / sensorCounts[1] : 25,
        sensor3: sensorCounts[2] > 0 ? sensorTemps[2] / sensorCounts[2] : 25,
        sensor4: sensorCounts[3] > 0 ? sensorTemps[3] / sensorCounts[3] : 25,
        anomalyCount
      });
    }

    return chartData.slice(-20); // Return last 20 data points
  }

  /**
   * Fallback data if API fails
   */
  private getFallbackData(buildings?: string[]): SensorReading[] {
    const defaultBuildings = buildings || ['Blk 22', 'Blk 15', 'Blk 19', 'Blk 11'];
    
    const sensorData: SensorReading[] = [];
    
    defaultBuildings.forEach((building, buildingIndex) => {
      // Generate 1-2 sensors per building
      const sensorCount = Math.min(2, Math.floor(Math.random() * 2) + 1);
      
      for (let i = 0; i < sensorCount; i++) {
        const sensorNumber = i + 1;
        const baseTemp = 25.0;
        const variation = (Math.random() - 0.5) * 4; // ±2°C variation
        const temp = baseTemp + variation;
        
        let status: 'normal' | 'warning' | 'anomaly' = 'normal';
        let confidence = 0.95;
        
        if (Math.abs(variation) > 2) {
          status = 'anomaly';
          confidence = 0.7 + (Math.random() * 0.2);
        } else if (Math.abs(variation) > 1) {
          status = 'warning';
          confidence = 0.8 + (Math.random() * 0.15);
        }
        
        sensorData.push({
          id: `VAV-${building.replace('Blk ', '')}-${sensorNumber}`,
          name: `${building} Level ${Math.floor(Math.random() * 8) + 2} VAV`,
          building,
          level: Math.floor(Math.random() * 8) + 2,
          temperature: temp,
          timestamp: new Date(),
          status,
          confidence
        });
      }
    });
    
    return sensorData;
  }
}

export const sensorDataService = new SensorDataService();
