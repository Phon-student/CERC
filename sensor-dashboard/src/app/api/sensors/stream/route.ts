import { NextRequest, NextResponse } from 'next/server';
import { sensorParser } from '@/lib/sensorDataParser';

export async function GET(request: NextRequest) {
  try {
    // Create a readable stream for real-time sensor data
    const stream = new ReadableStream({
      start(controller) {
        // Start streaming real-time data
        const interval = setInterval(async () => {
          try {
            const liveData = await sensorParser.getLiveSimulationData();
            const chunk = JSON.stringify({
              type: 'sensor_update',
              data: liveData,
              timestamp: new Date().toISOString()
            }) + '\n';
            
            controller.enqueue(new TextEncoder().encode(chunk));
          } catch (error) {
            console.error('Error in sensor stream:', error);
            controller.error(error);
          }
        }, 5000); // Update every 5 seconds

        // Clean up on close
        return () => {
          clearInterval(interval);
        };
      },
      cancel() {
        // Stream was cancelled
        console.log('Sensor stream cancelled');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error setting up sensor stream:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to setup sensor stream' 
      },
      { status: 500 }
    );
  }
}
