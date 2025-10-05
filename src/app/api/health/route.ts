import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  return NextResponse.json(healthData);
}