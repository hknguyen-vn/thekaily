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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data.map((a: any) => ({ 
      ...a, 
      authorUid: a.authoruid || a.authorUid,
      createdAt: a.created_at || a.createdAt 
    })));
  } catch (error: any) {
    console.error("Supabase error fetching albums, falling back to data.json:", error);
    try {
      const data = await readData();
      const albums = (data.albums || [])
        .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .map((a: any) => ({ ...a, createdAt: a.created_at || a.createdAt }));
      return NextResponse.json(albums);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}

export async function POST(request: Request) {
  let name, description, authorUid;
  try {
    const body = await request.json();
    name = body.name;
    description = body.description;
    authorUid = body.authorUid;
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('albums')
      .insert([{ name, description, authoruid: authorUid }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ 
      ...data, 
      authorUid: data.authoruid || data.authorUid,
      createdAt: data.created_at || data.createdAt 
    });
  } catch (error: any) {
    console.error("Supabase error creating album, falling back to data.json:", error);
    try {
      const data = await readData();
      const newAlbum = {
        id: uuidv4(),
        name,
        description,
        authorUid,
        createdAt: new Date().toISOString()
      };
      data.albums = [newAlbum, ...(data.albums || [])];
      await writeData(data);
      return NextResponse.json(newAlbum);
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
    }
  }
}
