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
  let memoryId, userUid, userName, userPhoto, content;
  try {
    const body = await request.json();
    memoryId = body.memoryId;
    userUid = body.userUid;
    userName = body.userName;
    userPhoto = body.userPhoto;
    content = body.content;
    
    if (!content || typeof content !== 'string' || content.length > 2000) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('family_comments')
      .insert([{
        memoryid: memoryId,
        useruid: userUid,
        username: userName,
        userphoto: userPhoto,
        content
      }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ 
      ...data, 
      memoryId: data.memoryid || data.memoryId,
      userUid: data.useruid || data.userUid,
      userName: data.username || data.userName,
      userPhoto: data.userphoto || data.userPhoto,
      createdAt: data.created_at || data.createdAt
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error creating comment, falling back to data.json:", error);
      try {
        if (!memoryId) return NextResponse.json({ error: "Missing memoryId" }, { status: 400 });
        
        const data = await readData();
        const newComment = {
          id: uuidv4(),
          memoryId,
          userUid,
          userName,
          userPhoto,
          content,
          createdAt: new Date().toISOString()
        };
        
        data.comments = [newComment, ...(data.comments || [])];
        await writeData(data);
        
        return NextResponse.json(newComment);
      } catch (fallbackError) {
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
