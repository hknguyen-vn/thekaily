import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@/lib/supabase/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'sunclub_gallery/',
      max_results: 500,
      context: true,
    });

    let allPhotos = result.resources.map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      createdAt: resource.created_at,
      caption: resource.context?.custom?.caption || "",
      categories: resource.context?.custom?.categories ? resource.context.custom.categories.split(',') : [],
      authorUid: resource.context?.custom?.authorUid || "guest",
      authorName: resource.context?.custom?.authorName || "Sunclub Member",
      date_taken: resource.context?.custom?.date_taken || resource.created_at,
      width: resource.width,
      height: resource.height,
    }));

    if (category && category !== 'All') {
      allPhotos = allPhotos.filter((p: any) => p.categories.includes(category));
    }

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
    const categories = formData.getAll('categories') as string[];
    const authorName = formData.get('authorName') as string;
    const authorUid = formData.get('authorUid') as string;
    const date_taken = formData.get('date_taken') as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    const finalAuthorUid = user?.id || authorUid || 'guest';
    const finalAuthorName = authorName || user?.user_metadata?.full_name || user?.email || 'Sunclub Member';

    const result = await cloudinary.uploader.upload(base64File, {
      folder: 'sunclub_gallery',
      context: {
        caption: caption || '',
        categories: categories ? categories.join(',') : '',
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
      categories: categories || [],
      authorUid: finalAuthorUid,
      authorName: finalAuthorName,
      date_taken: date_taken || ''
    });
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
