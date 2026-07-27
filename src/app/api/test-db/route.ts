// v2 - debug deployment
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({
      status: 'ERROR',
      issue: 'MONGODB_URI is NOT SET in Vercel at all',
    }, { status: 500 });
  }

  // Show full URI so we can debug exactly what Vercel has
  const parts = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@(.+)/);
  const username = parts?.[1] ?? 'PARSE_FAILED';
  const password = parts?.[2] ?? 'PARSE_FAILED';
  const host = parts?.[3] ?? 'PARSE_FAILED';

  try {
    await dbConnect();
    return NextResponse.json({
      status: 'SUCCESS ✅',
      message: 'MongoDB connected!',
      username,
      host,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR ❌',
      message: error.message,
      username,
      password_length: password.length,
      password_preview: password.substring(0, 3) + '***' + password.slice(-2),
      host,
    }, { status: 500 });
  }
}
