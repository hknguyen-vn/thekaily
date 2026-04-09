import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), "data.json");

async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { memories: [], likes: [], comments: [], albums: [], photo_albums: [] };
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*');

    if (error) throw error;
    return NextResponse.json(data.map((pa: any) => ({ ...pa, createdAt: pa.created_at })));
  } catch (error: any) {
    console.error("Supabase error fetching photo_albums, falling back to data.json:", error);
    try {
      const data = await readData();
      return NextResponse.json((data.photo_albums || []).map((pa: any) => ({ ...pa, createdAt: pa.created_at || pa.createdAt })));
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}
