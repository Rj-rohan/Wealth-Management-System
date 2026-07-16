import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';
import { logAuditAction } from '../../../middleware/auditLogger';

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const invIndex = db.investments.findIndex(i => i.id === id);
    
    if (invIndex === -1) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    const oldInv = { ...db.investments[invIndex] };
    
    // Prevent changing key identifiers
    const { id: _, portfolioId: __, ...rest } = body;
    const updatedInv = { ...oldInv, ...rest };
    db.investments[invIndex] = updatedInv;

    saveDb();
    logAuditAction('sys-admin', 'update', 'Investment', id, oldInv, updatedInv);

    return NextResponse.json(updatedInv);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
