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
    return { memories: [], likes: [], comments: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  let memoryId, userUid, userName;
  try {
    const body = await request.json();
    memoryId = body.memoryId;
    userUid = body.userUid;
    userName = body.userName;
    
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('family_likes')
      .insert([{
        memoryid: memoryId,
        useruid: userUid,
        username: userName
      }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ 
      ...data, 
      memoryId: data.memoryid || data.memoryId,
      userUid: data.useruid || data.userUid,
      userName: data.username || data.userName,
      createdAt: data.created_at || data.createdAt
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error creating like, falling back to data.json:", error);
      try {
        if (!memoryId) return NextResponse.json({ error: "Missing memoryId" }, { status: 400 });
        
        const data = await readData();
        const newLike = {
          id: uuidv4(),
          memoryId,
          userUid,
          userName,
          createdAt: new Date().toISOString()
        };
        
        data.likes = [newLike, ...(data.likes || [])];
        await writeData(data);
        
        return NextResponse.json(newLike);
      } catch (fallbackError) {
        return NextResponse.json({ error: "Failed to create like" }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
