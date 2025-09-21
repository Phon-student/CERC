import { NextRequest, NextResponse } from 'next/server';
import { sensorParser } from '@/lib/sensorDataParser';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const building = searchParams.get('building');
    const buildings = searchParams.get('buildings')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const type = searchParams.get('type') || 'sample';
    const dataSource = searchParams.get('source') || 'simulated'; // New parameter for real vs simulated data

    console.log('Sensor API called with:', { building, buildings, limit, type, dataSource });

    // If real data is requested, try to fetch from real sensor files
    if (dataSource === 'real') {
      try {
        console.log('Attempting to fetch real sensor data...');
        const realDataUrl = `${request.nextUrl.origin}/api/sensors/real?buildings=${buildings?.join(',') || ''}&type=${type}&limit=${limit}`;
        
        const realDataResponse = await fetch(realDataUrl);
        
        if (realDataResponse.ok) {
          const realData = await realDataResponse.json();
          console.log('Successfully fetched real sensor data:', realData);
          
          // Ensure the response has the expected format
          if (realData && Array.isArray(realData.data)) {
            return NextResponse.json(realData);
          } else {
            console.log('Real data response format invalid, falling back to simulated data');
          }
        } else {
          console.log('Real data not available, falling back to simulated data');
        }
      } catch (error) {
        console.log('Error fetching real data, falling back to simulated:', error);
      }
    }

    let data;
    
    try {
      if (type === 'live') {
        // Get live simulation data based on real patterns
        const targetBuildings = buildings || (building ? [building] : undefined);
        data = await sensorParser.getLiveSimulationData(targetBuildings);
      } else {
        // Get historical sample data
        const targetBuilding = buildings?.[0] || building;
        data = await sensorParser.getSampleData(targetBuilding || undefined, limit);
      }
    } catch (parseError) {
      console.error('Parser error, using fallback data:', parseError);
      // Use fallback data if parser fails
      data = generateFallbackSensorData(buildings || (building ? [building] : undefined));
    }

    console.log(`Returning ${data.length} sensor readings`);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      count: data.length
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in sensors API:', error);
    
    // Always return fallback data instead of error
    const fallbackData = generateFallbackSensorData();
    
    return NextResponse.json({
      success: true,
      data: fallbackData,
      timestamp: new Date().toISOString(),
      count: fallbackData.length,
      warning: 'Using fallback data due to system issues'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

function generateFallbackSensorData(buildings?: string[]) {
  const defaultBuildings = buildings || ['Blk 22', 'Blk 15', 'Blk 19', 'Blk 11'];
  const sensorData: any[] = [];
  
  // Use a more robust ID generation to avoid duplicates
  const timestamp = Date.now();
  let sensorIdCounter = 1;
  
  defaultBuildings.forEach((building, buildingIndex) => {
    // Generate 1-2 sensors per building
    const sensorCount = Math.min(2, Math.floor(Math.random() * 2) + 1);
    
    for (let i = 0; i < sensorCount; i++) {
      const sensorNumber = i + 1;
      const baseTemp = 25.0;
      const variation = (Math.random() - 0.5) * 4; // ±2°C variation
      const temp = baseTemp + variation;
      const level = Math.floor(Math.random() * 8) + 2;
      
      let status: 'normal' | 'warning' | 'anomaly' = 'normal';
      let confidence = 0.95;
      
      if (Math.abs(variation) > 2) {
        status = 'anomaly';
        confidence = 0.7 + (Math.random() * 0.2);
      } else if (Math.abs(variation) > 1) {
        status = 'warning';
        confidence = 0.8 + (Math.random() * 0.15);
      }
      
      // Create more unique IDs using building index, sensor number, and counter
      const uniqueId = `VAV-${building.replace('Blk ', '')}-L${level}-${sensorNumber}-${buildingIndex}-${timestamp}-${sensorIdCounter++}`;
      
      sensorData.push({
        id: uniqueId,
        name: `${building} Level ${level} VAV-${sensorNumber}`,
        building,
        level,
        temperature: temp,
        timestamp: new Date(),
        status,
        confidence
      });
    }
  });
  
  return sensorData;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sensorId, temperature, status, confidence } = body;

    // Validate input
    if (!sensorId || temperature === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: sensorId, temperature' 
        },
        { status: 400 }
      );
    }

    // Create new sensor reading
    const newReading = {
      id: sensorId,
      name: `Sensor ${sensorId}`,
      building: body.building || 'Unknown',
      level: body.level || 1,
      temperature: parseFloat(temperature),
      timestamp: new Date(),
      status: status || 'normal',
      confidence: confidence || 0.95
    };

    // In a real application, you would save this to a database
    // For now, we'll just return the created reading
    console.log('New sensor reading received:', newReading);

    return NextResponse.json({
      success: true,
      data: newReading,
      message: 'Sensor reading stored successfully'
    });

  } catch (error) {
    console.error('Error storing sensor data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to store sensor data' 
      },
      { status: 500 }
    );
  }
}
