import { NextResponse } from 'next/server';

export async function GET(request) {
  // In a real application, this would decode a session token
  const roleCookie = request.cookies.get('mock_role');
  const role = roleCookie ? roleCookie.value : 'CFO'; // Mock default
  
  return NextResponse.json({ role, permissions: ['read:all', 'write:all'] });
}
