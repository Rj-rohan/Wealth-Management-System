import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../../lib/db';
import { logAuditAction } from '../../../../middleware/auditLogger';

export async function POST(request, { params }) {
  const { id } = await params;
  
  const invIndex = db.investments.findIndex(i => i.id === id);
  if (invIndex === -1) {
    return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
  }

  const oldInv = { ...db.investments[invIndex] };

  if (oldInv.approvalStatus === 'approved') {
    return NextResponse.json({ error: 'Investment is already approved' }, { status: 400 });
  }

  const updatedInv = {
    ...oldInv,
    approvalStatus: 'approved',
    approvedBy: 'CFO', // Mocked user
    approvedAt: new Date().toISOString()
  };

  db.investments[invIndex] = updatedInv;
  saveDb();

  logAuditAction('CFO', 'update', 'InvestmentApproval', id, oldInv.approvalStatus, updatedInv.approvalStatus);

  return NextResponse.json(updatedInv);
}
