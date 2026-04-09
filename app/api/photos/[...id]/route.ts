import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const { id } = await params;
  let user = null;
  
  try {
    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

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

    const publicId = id.join('/');
    console.log("Attempting to delete Cloudinary resource:", publicId);
    
    // Fetch resource to check ownership
    const resource = await cloudinary.api.resource(publicId, { type: 'upload' });
    console.log("Resource found:", resource.public_id);
    const authorUid = resource.context?.custom?.authorUid;

    // Allow deletion if:
    // 1. Logged in via Supabase and is owner
    // 2. Logged in via simple session (familySession)
    // 3. It's a guest post (allow simple session to delete)
    const isGuestPost = authorUid === 'guest' || !authorUid;
    const isOwner = user && authorUid === user.id;
    const canDelete = isOwner || familySession || isGuestPost;

    if (!canDelete) {
      console.log("Forbidden: You are not authorized to delete this photo");
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting from Cloudinary:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const { id } = await params;
  let user = null;
  
  try {
    const cookieStore = await cookies();
    const familySession = cookieStore.get('family_session')?.value;

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

    const publicId = id.join('/');
    const { caption, people } = await request.json();
    
    // Fetch resource to check ownership
    const resource = await cloudinary.api.resource(publicId, { type: 'upload' });
    const authorUid = resource.context?.custom?.authorUid;

    const isGuestPost = authorUid === 'guest' || !authorUid;
    const isOwner = user && authorUid === user.id;
    const canEdit = isOwner || familySession || isGuestPost;

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update context metadata in Cloudinary
    await cloudinary.api.update(publicId, { 
      context: {
        caption: caption || '',
        people: people ? people.join(',') : ''
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating Cloudinary metadata:", error);
    return NextResponse.json({ error: "Failed to update metadata" }, { status: 500 });
  }
}
