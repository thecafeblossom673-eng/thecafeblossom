import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TMP_FILE = path.join('/tmp', 'cafe_blossom_db.json');

// In-memory cache for fast access
let serverDbInMemory: any = null;

function readDb() {
  if (serverDbInMemory) {
    return serverDbInMemory;
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, 'utf8');
      serverDbInMemory = JSON.parse(data);
      return serverDbInMemory;
    }
  } catch (err) {
    console.error('Failed to read tmp db file:', err);
  }
  return null;
}

function writeDb(data: any) {
  serverDbInMemory = data;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data), 'utf8');
  } catch (err) {
    console.error('Failed to write tmp db file:', err);
  }
}

export async function GET() {
  const db = readDb();
  return NextResponse.json(db || { lastUpdated: 0 });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const current = readDb();
    
    // Only update if incoming data is newer than what we have on the server
    if (!current || (data && data.lastUpdated > (current.lastUpdated || 0))) {
      writeDb(data);
    }
    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 400 });
  }
}
