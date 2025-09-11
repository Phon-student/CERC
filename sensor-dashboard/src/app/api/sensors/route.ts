import { NextRequest, NextResponse } from 'next/server';
import { sensorParser } from '@/lib/sensorDataParser';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const building = searchParams.get('building');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const type = searchParams.get('type') || 'sample';

    let data;
    
    if (type === 'live') {
      // Get live simulation data based on real patterns
      data = await sensorParser.getLiveSimulationData();
    } else {
      // Get historical sample data
      data = await sensorParser.getSampleData(building || undefined, limit);
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      count: data.length
    });

  } catch (error) {
    console.error('Error in sensors API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sensor data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
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
