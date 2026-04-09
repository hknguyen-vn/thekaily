import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_FILE = path.join(process.cwd(), "data.json");

async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { memories: [], likes: [], comments: [], albums: [], photo_albums: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: album_id } = await params;
  let photo_id = null;
  
  try {
    const body = await request.json();
    photo_id = body.photo_id;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('photo_albums')
      .insert([{ album_id, photo_id }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error adding photo to album, falling back to data.json:", error);
    try {
      if (!photo_id) return NextResponse.json({ error: "Missing photo_id" }, { status: 400 });
      
      const data = await readData();
      const newPhotoAlbum = {
        id: uuidv4(),
        album_id,
        photo_id,
        createdAt: new Date().toISOString()
      };
      
      data.photo_albums = [newPhotoAlbum, ...(data.photo_albums || [])];
      await writeData(data);
      
      return NextResponse.json(newPhotoAlbum);
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to add photo to album" }, { status: 500 });
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: album_id } = await params;
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('photo_albums')
      .select('photo_id')
      .eq('album_id', album_id);

    if (error) throw error;
    return NextResponse.json(data.map(item => item.photo_id));
  } catch (error: any) {
    console.error("Error fetching album photos, falling back to data.json:", error);
    try {
      const data = await readData();
      const photoIds = (data.photo_albums || [])
        .filter((pa: any) => pa.album_id === album_id)
        .map((pa: any) => pa.photo_id);
      return NextResponse.json(photoIds);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}
