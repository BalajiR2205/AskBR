import { NextResponse } from 'next/server';
import config from '@/config';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: config.appName,
    tagline: config.tagline,
    segment: 'Segment 0: Project Foundation',
    environment: config.env,
    timestamp: new Date().toISOString(),
    architecture: {
      sources: 'ready',
      retrieval: 'ready (interface boundary)',
      evidence: 'ready (interface boundary)',
      answers: 'ready (interface boundary)',
      multilingual: 'ready (interface boundary)',
      sessions: 'ready (interface boundary)',
    },
  });
}
