import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Authentication is disabled as per user request.
  // Just pass the request through.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
