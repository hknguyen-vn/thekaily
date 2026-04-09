import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
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

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!isUUID) {
    try {
      const data = await readData();
      data.memories = (data.memories || []).filter((m: any) => m.id !== id);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
    }
  }

  try {
    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

    let user = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }
    
    if (!user && !familySession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    // Fetch memory to check ownership
    const { data: memory, error: fetchError } = await supabase
      .from('family_memories')
      .select('authoruid')
      .eq('id', id)
      .single();

    if (fetchError || !memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    const isGuestPost = memory.authoruid === 'guest';
    const isOwner = user && memory.authoruid === user.id;
    const canDelete = isOwner || familySession || isGuestPost;

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('family_memories')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting memory, falling back to data.json:", error);
    try {
      const data = await readData();
      data.memories = (data.memories || []).filter((m: any) => m.id !== id);
      await writeData(data);
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
    }
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let content = null;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    const body = await request.json();
    content = body.content;

    if (!content || typeof content !== 'string' || content.length > 5000) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    if (!isUUID) {
      try {
        if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });
        
        const data = await readData();
        let updatedMemory = null;
        data.memories = (data.memories || []).map((m: any) => {
          if (m.id === id) {
            updatedMemory = { ...m, content, updatedAt: new Date().toISOString() };
            return updatedMemory;
          }
          return m;
        });
        
        if (!updatedMemory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
        
        await writeData(data);
        return NextResponse.json(updatedMemory);
      } catch (fallbackError) {
        return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
      }
    }

    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

    let user = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }
    
    if (!user && !familySession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    // Fetch memory to check ownership
    const { data: memory, error: fetchError } = await supabase
      .from('family_memories')
      .select('authoruid')
      .eq('id', id)
      .single();

    if (fetchError || !memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    const isGuestPost = memory.authoruid === 'guest';
    const isOwner = user && memory.authoruid === user.id;
    const canEdit = isOwner || familySession || isGuestPost;

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error: updateError } = await supabase
      .from('family_memories')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating memory, falling back to data.json:", error);
    try {
      if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });
      
      const data = await readData();
      let updatedMemory = null;
      data.memories = (data.memories || []).map((m: any) => {
        if (m.id === id) {
          updatedMemory = { ...m, content, updatedAt: new Date().toISOString() };
          return updatedMemory;
        }
        return m;
      });
      
      if (!updatedMemory) return NextResponse.json({ error: "Memory not found" }, { status: 404 });
      
      await writeData(data);
      return NextResponse.json(updatedMemory);
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
    }
  }
}
