import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';

export interface RealSensorReading {
  id: string;
  name: string;
  building: string;
  level: number;
  temperature: number;
  timestamp: Date;
  status: 'normal' | 'warning' | 'anomaly';
  confidence: number;
}

export interface ParsedSensorData {
  readings: RealSensorReading[];
  metadata: {
    building: string;
    level: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    totalReadings: number;
  };
}

/**
 * Parse Excel files from the sensor data folder
 */
export class SensorDataParser {
  private basePath: string;

  constructor(basePath: string = 'e:\\\\home work\\\\sensor_drift\\\\Sensor_data') {
    this.basePath = basePath;
  }

  /**
   * Get all available sensor files
   */
  async getAvailableFiles(): Promise<string[]> {
    try {
      const vavPath = path.join(this.basePath, 'VAV Room Temp');
      const buildings = await fs.readdir(vavPath);
      
      const files: string[] = [];
      for (const building of buildings) {
        const buildingPath = path.join(vavPath, building);
        const stat = await fs.stat(buildingPath);
        
        if (stat.isDirectory()) {
          const buildingFiles = await fs.readdir(buildingPath);
          for (const file of buildingFiles) {
            if (file.endsWith('.xls') || file.endsWith('.xlsx')) {
              files.push(path.join(buildingPath, file));
            }
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('Error getting available files:', error);
      return [];
    }
  }

  /**
   * Parse a single Excel file
   */
  async parseExcelFile(filePath: string): Promise<ParsedSensorData | null> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Extract metadata from filename
      const fileName = path.basename(filePath);
      const buildingMatch = fileName.match(/Blk (\d+)/);
      const levelMatch = fileName.match(/[Ll]evel (\d+)/);
      
      const building = buildingMatch ? `Blk ${buildingMatch[1]}` : 'Unknown';
      const level = levelMatch ? parseInt(levelMatch[1]) : 1;
      
      const readings: RealSensorReading[] = [];
      let minDate = new Date();
      let maxDate = new Date('1970-01-01');

      // Process the data (assuming first row is headers)
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (row.length < 2) continue;

        // Try to parse timestamp (could be in different formats)
        let timestamp: Date;
        try {
          const dateValue = row[0];
          if (typeof dateValue === 'number') {
            // Excel date serial number
            timestamp = new Date((dateValue - 25569) * 86400 * 1000);
          } else {
            timestamp = new Date(dateValue);
          }
          
          if (isNaN(timestamp.getTime())) continue;
        } catch {
          continue;
        }

        // Parse temperature value
        const tempValue = parseFloat(row[1]);
        if (isNaN(tempValue)) continue;

        // Update date range
        if (timestamp < minDate) minDate = timestamp;
        if (timestamp > maxDate) maxDate = timestamp;

        // Determine status based on temperature deviation from 25°C
        const deviation = Math.abs(tempValue - 25.0);
        let status: 'normal' | 'warning' | 'anomaly' = 'normal';
        let confidence = 0.95;

        if (deviation > 3) {
          status = 'anomaly';
          confidence = 0.7 + (Math.random() * 0.2);
        } else if (deviation > 1.5) {
          status = 'warning';
          confidence = 0.8 + (Math.random() * 0.15);
        }

        readings.push({
          id: `${building}-L${level}-${i}`,
          name: `${building} Level ${level} Sensor`,
          building,
          level,
          temperature: tempValue,
          timestamp,
          status,
          confidence
        });
      }

      return {
        readings,
        metadata: {
          building,
          level,
          dateRange: {
            start: minDate,
            end: maxDate
          },
          totalReadings: readings.length
        }
      };
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse multiple files and combine the data
   */
  async parseMultipleFiles(filePaths: string[]): Promise<RealSensorReading[]> {
    const allReadings: RealSensorReading[] = [];
    
    for (const filePath of filePaths) {
      const parsed = await this.parseExcelFile(filePath);
      if (parsed) {
        allReadings.push(...parsed.readings);
      }
    }
    
    // Sort by timestamp
    allReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return allReadings;
  }

  /**
   * Get recent sample data for dashboard
   */
  async getSampleData(building?: string, limit: number = 1000): Promise<RealSensorReading[]> {
    try {
      const files = await this.getAvailableFiles();
      
      // Filter by building if specified
      const filteredFiles = building 
        ? files.filter(f => f.includes(building))
        : files.slice(0, 5); // Take first 5 files if no building specified

      const readings = await this.parseMultipleFiles(filteredFiles);
      
      // Return most recent readings
      return readings.slice(-limit);
    } catch (error) {
      console.error('Error getting sample data:', error);
      return [];
    }
  }

  /**
   * Get live simulation data based on real data patterns
   */
  async getLiveSimulationData(): Promise<RealSensorReading[]> {
    try {
      // Get a sample of real data to base patterns on
      const sampleData = await this.getSampleData(undefined, 100);
      
      if (sampleData.length === 0) {
        // Fallback mock data if no real data available
        return this.generateFallbackData();
      }

      // Generate current readings based on real data patterns
      const currentReadings: RealSensorReading[] = [];
      const uniqueBuildings = [...new Set(sampleData.map(r => r.building))];
      
      for (const building of uniqueBuildings.slice(0, 4)) {
        const buildingData = sampleData.filter(r => r.building === building);
        const avgTemp = buildingData.reduce((sum, r) => sum + r.temperature, 0) / buildingData.length;
        const tempVariation = Math.random() * 4 - 2; // ±2°C variation
        
        const newTemp = avgTemp + tempVariation;
        const deviation = Math.abs(newTemp - 25.0);
        
        let status: 'normal' | 'warning' | 'anomaly' = 'normal';
        let confidence = 0.95;

        if (deviation > 3) {
          status = 'anomaly';
          confidence = 0.7 + (Math.random() * 0.2);
        } else if (deviation > 1.5) {
          status = 'warning';
          confidence = 0.8 + (Math.random() * 0.15);
        }

        currentReadings.push({
          id: `${building}-LIVE`,
          name: `${building} Live Sensor`,
          building,
          level: buildingData[0]?.level || 1,
          temperature: newTemp,
          timestamp: new Date(),
          status,
          confidence
        });
      }
      
      return currentReadings;
    } catch (error) {
      console.error('Error generating live simulation data:', error);
      return this.generateFallbackData();
    }
  }

  /**
   * Fallback data if Excel parsing fails
   */
  private generateFallbackData(): RealSensorReading[] {
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

export const sensorParser = new SensorDataParser();
