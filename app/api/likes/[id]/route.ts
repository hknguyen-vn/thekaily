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
    return { memories: [], likes: [], comments: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memoryId);

  if (!isUUID) {
    try {
      const data = await readData();
      const likes = (data.likes || [])
        .filter((l: any) => l.memoryId === memoryId)
        .map((l: any) => ({ ...l, createdAt: l.created_at || l.createdAt }));
      return NextResponse.json(likes);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('family_likes')
      .select('*')
      .eq('memoryid', memoryId);

    if (error) {
      console.error("Supabase error fetching likes:", error);
      throw error;
    }
    
    return NextResponse.json(data.map((l: any) => ({ 
      ...l, 
      memoryId: l.memoryid || l.memoryId,
      userUid: l.useruid || l.userUid,
      userName: l.username || l.userName,
      createdAt: l.created_at || l.createdAt
    })));
  } catch (error: any) {
    console.error("Error fetching likes from Supabase, falling back to data.json:", error);
    try {
      const data = await readData();
      const likes = (data.likes || [])
        .filter((l: any) => l.memoryId === memoryId)
        .map((l: any) => ({ ...l, createdAt: l.created_at || l.createdAt }));
      return NextResponse.json(likes);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: likeId } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(likeId);

  if (!isUUID) {
    try {
      const data = await readData();
      data.likes = (data.likes || []).filter((l: any) => l.id !== likeId);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete like" }, { status: 500 });
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('family_likes')
      .delete()
      .eq('id', likeId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting like from Supabase, falling back to data.json:", error);
    try {
      const data = await readData();
      data.likes = (data.likes || []).filter((l: any) => l.id !== likeId);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete like" }, { status: 500 });
    }
  }
}
