import { NextRequest, NextResponse } from 'next/server';
import { sensorParser } from '@/lib/sensorDataParser';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing file access...');
    
    // Test different possible paths
    const possiblePaths = [
      path.join(process.cwd(), '..', 'Sensor_data', 'VAV Room Temp'),
      path.join(process.cwd(), 'Sensor_data', 'VAV Room Temp'),
      'e:\\home work\\sensor_drift\\Sensor_data\\VAV Room Temp',
      path.resolve(process.cwd(), '..', 'Sensor_data', 'VAV Room Temp')
    ];

    const results = [];
    
    for (const testPath of possiblePaths) {
      try {
        console.log(`Testing path: ${testPath}`);
        const exists = await fs.access(testPath).then(() => true).catch(() => false);
        
        if (exists) {
          const files = await fs.readdir(testPath);
          results.push({
            path: testPath,
            exists: true,
            folders: files.slice(0, 5), // First 5 folders
            totalFolders: files.length
          });
        } else {
          results.push({
            path: testPath,
            exists: false,
            error: 'Path not accessible'
          });
        }
      } catch (error) {
        results.push({
          path: testPath,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test the sensor parser
    let parserResult;
    try {
      const files = await sensorParser.getAvailableFiles();
      parserResult = {
        success: true,
        fileCount: files.length,
        sampleFiles: files.slice(0, 3)
      };
    } catch (error) {
      parserResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      currentWorkingDirectory: process.cwd(),
      pathTests: results,
      sensorParser: parserResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in file test API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        currentWorkingDirectory: process.cwd()
      },
      { status: 500 }
    );
  }
}
