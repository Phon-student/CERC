import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Buildings API called - returning static list');
    
    // Return static list of buildings instead of scanning file system
    const buildingList = [
      'Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7', 'Blk 10', 'Blk 11',
      'Blk 14', 'Blk 15', 'Blk 16', 'Blk 18', 'Blk 19', 'Blk 20', 'Blk 22',
      'Blk 23', 'Blk 24', 'Blk 26', 'Blk 28', 'Blk 34'
    ];

    console.log(`Returning ${buildingList.length} buildings`);

    return NextResponse.json({
      success: true,
      data: buildingList,
      timestamp: new Date().toISOString(),
      count: buildingList.length
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in buildings API:', error);
    
    // Return fallback buildings list
    const fallbackBuildings = [
      'Blk 1', 'Blk 2', 'Blk 3', 'Blk 5', 'Blk 6', 'Blk 7', 'Blk 10', 'Blk 11',
      'Blk 14', 'Blk 15', 'Blk 16', 'Blk 18', 'Blk 19', 'Blk 20', 'Blk 22',
      'Blk 23', 'Blk 24', 'Blk 26', 'Blk 28', 'Blk 34'
    ];
    
    return NextResponse.json({
      success: true,
      data: fallbackBuildings,
      timestamp: new Date().toISOString(),
      count: fallbackBuildings.length,
      warning: 'Using fallback data due to system issues'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
