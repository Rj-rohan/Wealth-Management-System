import { NextResponse } from 'next/server';

// For demonstration purposes, we will mock the current user's role here
// In a real application, this would verify a JWT or session cookie
function getMockUserRole(request) {
  const roleCookie = request.cookies.get('mock_role');
  return roleCookie ? roleCookie.value : 'CFO'; // Default to CFO if no mock role is set
}

export function middleware(request) {
  const role = getMockUserRole(request);
  const path = request.nextUrl.pathname;
  
  // Auditor restrictions
  if (role === 'Auditor' && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Auditors have read-only access' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // 1. Audit Logs: Accessible only by 'Auditor' and 'CFO'
  if (path.startsWith('/api/compliance/logs') || path.startsWith('/api/audit-logs')) {
    if (role !== 'Auditor' && role !== 'CFO') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Requires Auditor or CFO role' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // 2. Treasury Transfers: Accessible only by 'CFO' and 'Treasury Manager'
  if (path.startsWith('/api/treasury/transfers') && request.method === 'POST') {
    if (role !== 'CFO' && role !== 'Treasury Manager') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Requires CFO or Treasury Manager role' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // 3. Investments (Mutating): Accessible only by 'CFO' and 'Investment Manager'
  if (path.startsWith('/api/investments') && ['POST', 'PATCH'].includes(request.method)) {
    if (role !== 'CFO' && role !== 'Investment Manager') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Requires CFO or Investment Manager role' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // 4. Company config (Mutating): Editable only by 'CFO'
  if (path.startsWith('/api/company') && request.method === 'PATCH') {
    if (role !== 'CFO') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Requires CFO role' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};
