import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';
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

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const person = searchParams.get('person');
  const album = searchParams.get('album');
  
  let supabase = null;
  try {
    supabase = await createClient();
  } catch (e) {
    console.error("Supabase client error:", e);
  }

  try {
    // Fetch all resources from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      context: true,
    });

    let allPhotos = result.resources.map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      createdAt: resource.created_at,
      caption: resource.context?.custom?.caption || "",
      people: resource.context?.custom?.people ? resource.context.custom.people.split(',') : [],
      authorUid: resource.context?.custom?.authorUid || "guest",
      authorName: resource.context?.custom?.authorName || "Thành viên gia đình",
      date_taken: resource.context?.custom?.date_taken || resource.created_at,
      width: resource.width,
      height: resource.height,
    }));

    // Server-side filtering
    if (person && person !== 'All') {
      allPhotos = allPhotos.filter((p: any) => p.people.includes(person));
    }

    if (album && album !== 'All') {
      let photoAlbums = null;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('photo_albums')
            .select('photo_id')
            .eq('album_id', album);
          
          if (error) throw error;
          photoAlbums = data;
        } catch (supabaseError) {
          console.error("Supabase error fetching photo_albums:", supabaseError);
        }
      }

      if (!photoAlbums) {
        try {
          const data = await readData();
          photoAlbums = (data.photo_albums || []).filter((pa: any) => pa.album_id === album);
        } catch (fallbackError) {
          // Ignore fallback error
        }
      }

      if (photoAlbums) {
        const albumPhotoIds = photoAlbums.map((pa: any) => pa.photo_id);
        allPhotos = allPhotos.filter((p: any) => albumPhotoIds.includes(p.id));
      }
    }

    // Server-side sorting
    allPhotos.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allPhotos);
  } catch (error: any) {
    console.error("Error fetching from Cloudinary:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let user = null;
  try {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Supabase client error:", e);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const people = formData.getAll('people') as string[];
    const authorName = formData.get('authorName') as string;
    const authorUid = formData.get('authorUid') as string;
    const date_taken = formData.get('date_taken') as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to base64 for Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    const finalAuthorUid = user?.id || authorUid || 'guest';
    const finalAuthorName = authorName || user?.user_metadata?.full_name || user?.email || 'Thành viên gia đình';

    // Upload to Cloudinary with User ID in context
    const result = await cloudinary.uploader.upload(base64File, {
      folder: 'family_vault',
      context: {
        caption: caption || '',
        people: people ? people.join(',') : '',
        authorUid: finalAuthorUid,
        authorName: finalAuthorName,
        date_taken: date_taken || ''
      }
    });

    return NextResponse.json({
      id: result.public_id,
      url: result.secure_url,
      createdAt: result.created_at,
      caption: caption || '',
      people: people || [],
      authorUid: finalAuthorUid,
      authorName: finalAuthorName,
      date_taken: date_taken || ''
    });
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
