import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Decode the ID since it might contain slashes (folder path)
    const publicId = decodeURIComponent(id);
    
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const publicId = decodeURIComponent(id);
    const body = await request.json();
    const { categories, caption } = body;

    await cloudinary.uploader.add_context(`categories=${categories.join(',')}|caption=${caption}`, [publicId]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}
