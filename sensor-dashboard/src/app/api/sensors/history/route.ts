import { NextRequest, NextResponse } from 'next/server';
import { sensorParser } from '@/lib/sensorDataParser';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const building = searchParams.get('building');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '10000');

    console.log('Fetching historical data with params:', {
      building,
      startDate,
      endDate,
      limit
    });

    // Get available files
    const files = await sensorParser.getAvailableFiles();
    console.log(`Found ${files.length} sensor data files`);

    // Filter files by building if specified
    const filteredFiles = building 
      ? files.filter(f => f.toLowerCase().includes(building.toLowerCase()))
      : files.slice(0, 10); // Limit to first 10 files to avoid timeout

    console.log(`Processing ${filteredFiles.length} files`);

    if (filteredFiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No data files found for the specified criteria',
        metadata: {
          availableBuildings: files.map(f => {
            const match = f.match(/Blk (\d+)/);
            return match ? `Blk ${match[1]}` : null;
          }).filter(Boolean)
        }
      });
    }

    // Parse files and get readings
    const allReadings = await sensorParser.parseMultipleFiles(filteredFiles);
    console.log(`Parsed ${allReadings.length} total readings`);

    // Filter by date range if specified
    let filteredReadings = allReadings;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1970-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      filteredReadings = allReadings.filter(reading => 
        reading.timestamp >= start && reading.timestamp <= end
      );
    }

    // Limit results
    const limitedReadings = filteredReadings.slice(-limit);

    // Calculate statistics
    const temperatures = limitedReadings.map(r => r.temperature);
    const avgTemp = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);

    const anomalies = limitedReadings.filter(r => r.status === 'anomaly').length;
    const warnings = limitedReadings.filter(r => r.status === 'warning').length;

    return NextResponse.json({
      success: true,
      data: limitedReadings,
      metadata: {
        totalReadings: filteredReadings.length,
        returnedReadings: limitedReadings.length,
        statistics: {
          averageTemperature: Math.round(avgTemp * 100) / 100,
          minimumTemperature: Math.round(minTemp * 100) / 100,
          maximumTemperature: Math.round(maxTemp * 100) / 100,
          anomalyCount: anomalies,
          warningCount: warnings,
          normalCount: limitedReadings.length - anomalies - warnings
        },
        dateRange: {
          start: limitedReadings[0]?.timestamp || null,
          end: limitedReadings[limitedReadings.length - 1]?.timestamp || null
        },
        processedFiles: filteredFiles.map(f => ({
          filename: f.split('\\').pop(),
          path: f
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in historical data API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch historical sensor data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
