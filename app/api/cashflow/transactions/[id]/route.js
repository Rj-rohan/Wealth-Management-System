import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { logAuditAction } from '../../../../middleware/auditLogger';

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const txIndex = db.transactions.findIndex(t => t.id === id);
    
    if (txIndex === -1) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const oldTx = { ...db.transactions[txIndex] };
    
    // Only allow updating safe fields in audit-compliant accounting ledger
    const allowedUpdates = ['category', 'date', 'description', 'reconcileStatus'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updatedTx = { ...oldTx, ...updates };
    db.transactions[txIndex] = updatedTx;

    logAuditAction('sys-admin', 'update', 'Transaction', id, oldTx, updatedTx);

    return NextResponse.json(updatedTx);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const txIndex = db.transactions.findIndex(t => t.id === id);
  
  if (txIndex === -1) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const oldTx = { ...db.transactions[txIndex] };

  // Reverse transaction impact on corresponding bank account balance
  const bankAccount = db.bankAccounts.find(b => b.id === oldTx.bankAccountId);
  if (bankAccount) {
    if (oldTx.type === 'income') {
      bankAccount.balance -= oldTx.amount;
    } else if (oldTx.type === 'expense') {
      bankAccount.balance += oldTx.amount;
    }
  }

  db.transactions.splice(txIndex, 1);
  
  logAuditAction('sys-admin', 'delete', 'Transaction', id, oldTx, null);

  return NextResponse.json({ message: 'Transaction deleted' });
}
