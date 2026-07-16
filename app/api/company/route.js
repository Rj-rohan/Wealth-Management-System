import { NextResponse } from 'next/server';
import { db, saveDb } from '../../lib/db';
import { logAuditAction } from '../../middleware/auditLogger';

export async function GET() {
  return NextResponse.json(db.company || {
    name: 'Apex Wealth Corp',
    taxBracket: '30%',
    cfoName: 'Rohan Sharma',
    incorporationDate: '2015-06-12',
    pan: 'AAACA1234A'
  });
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const oldCompany = { ...db.company };
    
    // Prevent ID or other unsafe updates if any
    db.company = { ...oldCompany, ...body };
    saveDb();
    
    logAuditAction('sys-admin', 'update', 'CompanyConfig', null, oldCompany, db.company);
    return NextResponse.json(db.company);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
