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
   * Get live sensor data
   */
  async getLiveSensorData(): Promise<SensorReading[]> {
    try {
      const response = await fetch(`${this.baseUrl}?type=live&limit=4`);
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
      return this.getFallbackData();
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
  private getFallbackData(): SensorReading[] {
    return [
      {
        id: 'VAV-1',
        name: 'Blk 22 Level 2 VAV',
        building: 'Blk 22',
        level: 2,
        temperature: 24.5 + (Math.random() * 2 - 1),
        timestamp: new Date(),
        status: 'normal',
        confidence: 0.95
      },
      {
        id: 'VAV-2',
        name: 'Blk 15 Level 5 VAV',
        building: 'Blk 15',
        level: 5,
        temperature: 25.2 + (Math.random() * 2 - 1),
        timestamp: new Date(),
        status: 'normal',
        confidence: 0.92
      },
      {
        id: 'VAV-3',
        name: 'Blk 19 Level 7 VAV',
        building: 'Blk 19',
        level: 7,
        temperature: 26.8 + (Math.random() * 2 - 1),
        timestamp: new Date(),
        status: 'warning',
        confidence: 0.88
      },
      {
        id: 'VAV-4',
        name: 'Blk 11 Level 6 VAV',
        building: 'Blk 11',
        level: 6,
        temperature: 23.1 + (Math.random() * 2 - 1),
        timestamp: new Date(),
        status: 'anomaly',
        confidence: 0.75
      }
    ];
  }
}

export const sensorDataService = new SensorDataService();
