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
      const comments = (data.comments || [])
        .filter((c: any) => c.memoryId === memoryId)
        .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .map((c: any) => ({ ...c, createdAt: c.created_at || c.createdAt }));
      return NextResponse.json(comments);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('family_comments')
      .select('*')
      .eq('memoryid', memoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error fetching comments:", error);
      throw error;
    }
    
    return NextResponse.json(data.map((c: any) => ({ 
      ...c, 
      memoryId: c.memoryid || c.memoryId,
      userUid: c.useruid || c.userUid,
      userName: c.username || c.userName,
      userPhoto: c.userphoto || c.userPhoto,
      createdAt: c.created_at || c.createdAt
    })));
  } catch (error: any) {
    console.error("Error fetching comments from Supabase, falling back to data.json:", error);
    try {
      const data = await readData();
      const comments = (data.comments || [])
        .filter((c: any) => c.memoryId === memoryId)
        .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .map((c: any) => ({ ...c, createdAt: c.created_at || c.createdAt }));
      return NextResponse.json(comments);
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(commentId);

  if (!isUUID) {
    try {
      const data = await readData();
      data.comments = (data.comments || []).filter((c: any) => c.id !== commentId);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('family_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting comment from Supabase, falling back to data.json:", error);
    try {
      const data = await readData();
      data.comments = (data.comments || []).filter((c: any) => c.id !== commentId);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
  }
}
