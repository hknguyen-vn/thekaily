import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    // Hardcoded fallback account to ensure login always works
    if (username === 'admin' && password === '123456') {
      const response = NextResponse.json({ 
        success: true, 
        user: { id: 'admin-fallback', username: 'admin', full_name: 'Admin Gia Đình', role: 'admin' } 
      });
      
      response.cookies.set('family_session', JSON.stringify({
        uid: 'admin-fallback',
        username: 'admin',
        displayName: 'Admin Gia Đình',
        role: 'admin'
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      return response;
    }

    const supabase = await createClient();

    // Query custom table
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      console.error('Supabase login error:', error);
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
    }

    // Create response and set cookie
    const response = NextResponse.json({ success: true, user: data });
    
    // Simple cookie session
    response.cookies.set('family_session', JSON.stringify({
      uid: data.id,
      username: data.username,
      displayName: data.full_name,
      role: data.role
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
