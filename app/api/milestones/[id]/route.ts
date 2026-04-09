import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

    let user = null;
    try {
      const supabaseServer = await createClient();
      const { data } = await supabaseServer.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }
    
    if (!user && !familySession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // In simple family mode, we allow the family session to delete any milestone
    // or you could check authorUid if you add it to the table later
    const { error: deleteError } = await supabase
      .from('family_milestones')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

    let user = null;
    try {
      const supabaseServer = await createClient();
      const { data } = await supabaseServer.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }
    
    if (!user && !familySession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createClient();
    
    const { data, error: updateError } = await supabase
      .from('family_milestones')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}
