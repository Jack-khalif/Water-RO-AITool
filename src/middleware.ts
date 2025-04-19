import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware is working!');
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/proposal/:path*'],
};
