import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('family_memories')
      .select('*, family_likes(*), family_comments(*)')
      .order('created_at', { ascending: false });

    if (supabaseError) throw supabaseError;

    let localData: any = { memories: [], likes: [], comments: [] };
    try {
      localData = await readData();
    } catch (e) {
      console.error("Error reading local data:", e);
    }

    const supabaseMemories = (supabaseData || []).map((memory: any) => ({
      ...memory,
      type: memory.type || 'note',
      privacy: memory.privacy || 'public',
      authorUid: memory.authoruid || memory.authorUid,
      authorName: memory.authorname || memory.authorName,
      authorPhoto: memory.authorphoto || memory.authorPhoto,
      createdAt: memory.created_at,
      updatedAt: memory.updated_at,
      likesList: (memory.family_likes || []).map((l: any) => ({
        ...l,
        userUid: l.useruid || l.userUid,
        userName: l.username || l.userName,
        createdAt: l.created_at || l.createdAt
      })),
      commentsList: (memory.family_comments || []).map((c: any) => ({
        ...c,
        userUid: c.useruid || c.userUid,
        userName: c.username || c.userName,
        userPhoto: c.userphoto || c.userPhoto,
        createdAt: c.created_at || c.createdAt
      })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      likes: memory.family_likes?.length || 0,
      comments: memory.family_comments?.length || 0
    }));

    const localMemories = (localData.memories || []).map((m: any) => {
      const m_likes = (localData.likes || []).filter((l: any) => l.memoryId === m.id);
      const m_comments = (localData.comments || []).filter((c: any) => c.memoryId === m.id)
        .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .map((c: any) => ({ ...c, createdAt: c.created_at || c.createdAt }));
      
      return {
        ...m,
        type: m.type || 'note',
        createdAt: m.created_at || m.createdAt,
        updatedAt: m.updated_at || m.updatedAt,
        likesList: m_likes,
        commentsList: m_comments,
        likes: m_likes.length,
        comments: m_comments.length
      };
    });

    // Merge and remove duplicates by ID if any
    const allMemories = [...supabaseMemories, ...localMemories];
    const uniqueMemories = Array.from(new Map(allMemories.map(m => [m.id, m])).values())
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(uniqueMemories);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching memories from Supabase, falling back to data.json:", error);
      try {
        const data = await readData();
        const memories = (data.memories || [])
          .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
          .map((m: any) => {
            const m_likes = (data.likes || []).filter((l: any) => l.memoryId === m.id);
            const m_comments = (data.comments || []).filter((c: any) => c.memoryId === m.id)
              .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
              .map((c: any) => ({ ...c, createdAt: c.created_at || c.createdAt }));
            
            return {
              ...m,
              createdAt: m.created_at || m.createdAt,
              updatedAt: m.updated_at || m.updatedAt,
              likesList: m_likes,
              commentsList: m_comments,
              likes: m_likes.length,
              comments: m_comments.length
            };
          });
        return NextResponse.json(memories);
      } catch (fallbackError) {
        console.error("Error reading from data.json:", fallbackError);
        return NextResponse.json([], { status: 200 });
      }
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let content, authorName, authorPhoto, authorUid, type, privacy;
  let user = null;
  try {
    const body = await request.json();
    content = body.content;
    authorName = body.authorName;
    authorPhoto = body.authorPhoto;
    authorUid = body.authorUid;
    type = body.type || 'note';
    privacy = body.privacy || 'public';

    if (!content || typeof content !== 'string' || content.length > 5000) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }
    
    // Use authenticated user info if available, otherwise use provided info (for guests)
    const finalAuthorUid = user?.id || authorUid || 'guest';
    const finalAuthorName = authorName || user?.user_metadata?.full_name || user?.email || 'Thành viên gia đình';
    const finalAuthorPhoto = authorPhoto || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalAuthorUid}`;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('family_memories')
      .insert([{
        content,
        type,
        privacy,
        authoruid: finalAuthorUid,
        authorname: finalAuthorName,
        authorphoto: finalAuthorPhoto,
      }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({
      ...data,
      type: data.type || type,
      privacy: data.privacy || privacy,
      authorUid: data.authoruid || data.authorUid,
      authorName: data.authorname || data.authorName,
      authorPhoto: data.authorphoto || data.authorPhoto,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: 0,
      comments: 0
    });
  } catch (error: any) {
    console.error("Error creating memory, falling back to data.json:", error);
    try {
      if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });
      
      const finalAuthorUid = user?.id || authorUid || 'guest';
      const finalAuthorName = authorName || user?.user_metadata?.full_name || user?.email || 'Thành viên gia đình';
      const finalAuthorPhoto = authorPhoto || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalAuthorUid}`;

      const data = await readData();
      const newMemory = {
        id: uuidv4(),
        content,
        type,
        privacy,
        authorUid: finalAuthorUid,
        authorName: finalAuthorName,
        authorPhoto: finalAuthorPhoto,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0
      };
      
      data.memories = [newMemory, ...(data.memories || [])];
      await writeData(data);
      
      return NextResponse.json(newMemory);
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
    }
  }
}
