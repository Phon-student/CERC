import { NextRequest, NextResponse } from 'next/server';

// Simulate training job management
const trainingJobs = new Map();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (jobId) {
    const job = trainingJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Training job not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(job);
  }
  
  // Return all jobs
  return NextResponse.json([...trainingJobs.values()]);
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate configuration
    const requiredFields = ['modelType', 'testSize', 'crossValidation'];
    for (const field of requiredFields) {
      if (!(field in config)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      config,
      logs: [`[${new Date().toLocaleTimeString()}] Training job ${jobId} created`]
    };
    
    trainingJobs.set(jobId, job);
    
    // Simulate training process
    simulateTraining(jobId);
    
    return NextResponse.json({ jobId, status: 'started' });
  } catch (error) {
    console.error('Training start error:', error);
    return NextResponse.json(
      { error: 'Failed to start training job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }
  
  if (!trainingJobs.has(jobId)) {
    return NextResponse.json(
      { error: 'Training job not found' },
      { status: 404 }
    );
  }
  
  const job = trainingJobs.get(jobId);
  if (job.status === 'running') {
    job.status = 'cancelled';
    job.logs.push(`[${new Date().toLocaleTimeString()}] Training cancelled by user`);
    trainingJobs.set(jobId, job);
  }
  
  return NextResponse.json({ message: 'Training job cancelled' });
}

async function simulateTraining(jobId: string) {
  const job = trainingJobs.get(jobId);
  if (!job) return;
  
  const phases = [
    'Loading dataset...',
    'Preprocessing data...',
    'Feature engineering...',
    'Splitting train/test sets...',
    'Training model...',
    'Cross-validation...',
    'Computing metrics...',
    'Saving model...',
    'Training completed!'
  ];
  
  job.status = 'running';
  trainingJobs.set(jobId, job);
  
  for (let i = 0; i < phases.length; i++) {
    if (job.status === 'cancelled') break;
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    job.progress = ((i + 1) / phases.length) * 100;
    job.logs.push(`[${new Date().toLocaleTimeString()}] ${phases[i]}`);
    
    if (i === phases.length - 1) {
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      job.metrics = generateMockMetrics(job.config.modelType);
    }
    
    trainingJobs.set(jobId, job);
  }
}

function generateMockMetrics(modelType: string) {
  const baseMetrics = {
    random_forest: { accuracy: 0.998, precision: 0.995, recall: 0.992, f1Score: 0.994, auc: 0.997 },
    gradient_boosting: { accuracy: 0.994, precision: 0.991, recall: 0.988, f1Score: 0.990, auc: 0.993 },
    svm: { accuracy: 0.945, precision: 0.941, recall: 0.938, f1Score: 0.940, auc: 0.952 },
    autoencoder: { accuracy: 0.921, precision: 0.918, recall: 0.915, f1Score: 0.917, auc: 0.929 },
    ensemble: { accuracy: 0.999, precision: 0.998, recall: 0.997, f1Score: 0.998, auc: 0.999 }
  };

  const base = baseMetrics[modelType as keyof typeof baseMetrics] || baseMetrics.random_forest;
  
  return {
    ...base,
    trainingTime: Math.random() * 60 + 10, // 10-70 seconds
    featureCount: 298,
    cvScores: Array.from({ length: 5 }, () => base.accuracy + (Math.random() - 0.5) * 0.01)
  };
}
