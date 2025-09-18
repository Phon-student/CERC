import { NextRequest, NextResponse } from 'next/server';
import { getModelService } from '@/lib/modelService';

export async function GET(request: NextRequest) {
  try {
    const modelService = getModelService();
    const status = modelService.getInitializationStatus();
    
    return NextResponse.json({
      success: true,
      ...status,
      availableModels: modelService.getAvailableModels(),
      metadata: modelService.getMetadata(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Model status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get model status',
        isInitialized: false,
        modelsLoaded: 0,
        expectedModels: 0,
        loadingProgress: '0/0'
      },
      { status: 500 }
    );
  }
}

// Force model preloading when this endpoint is accessed
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Forcing model preload via API...');
    const modelService = getModelService();
    
    // Force wait for initialization
    await new Promise(resolve => {
      const checkReady = () => {
        if (modelService.isReady()) {
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
    
    const status = modelService.getInitializationStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Models preloaded successfully',
      ...status,
      availableModels: modelService.getAvailableModels(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Model preload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to preload models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}