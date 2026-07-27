import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({
      status: 'ERROR',
      issue: 'MONGODB_URI environment variable is NOT set in Vercel',
      fix: 'Go to Vercel → Settings → Environment Variables and add MONGODB_URI'
    }, { status: 500 });
  }

  // Mask password for safe display
  const maskedUri = uri.replace(/:([^@]+)@/, ':***@');

  try {
    await dbConnect();
    return NextResponse.json({
      status: 'SUCCESS ✅',
      message: 'MongoDB connected successfully!',
      uri_used: maskedUri,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR ❌',
      message: error.message,
      uri_used: maskedUri,
      fix: error.message?.includes('ECONNREFUSED') || error.message?.includes('network')
        ? 'Check MongoDB Atlas Network Access — add 0.0.0.0/0'
        : error.message?.includes('Authentication failed') || error.message?.includes('bad auth')
        ? 'Wrong username or password in MONGODB_URI'
        : 'Unknown error — see message above'
    }, { status: 500 });
  }
}
