import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple test to see if our APIs work
    return NextResponse.json({
      success: true,
      message: 'Sensor API is working!',
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        '/api/sensors - GET live data, POST new readings',
        '/api/sensors/history - GET historical data',  
        '/api/sensors/stream - GET real-time stream'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'API test failed' 
      },
      { status: 500 }
    );
  }
}
