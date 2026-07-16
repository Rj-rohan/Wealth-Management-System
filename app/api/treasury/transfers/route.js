import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';
import { logAuditAction } from '../../../middleware/auditLogger';

export async function POST(request) {
  try {
    const { fromAccountId, toAccountId, amount } = await request.json();
    const amt = Number(amount);
    if (!fromAccountId || !toAccountId || isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid transfer payload' }, { status: 400 });
    }
    
    // Check if transferring to the same account
    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    }

    const fromAcc = db.bankAccounts.find(b => b.id === fromAccountId);
    const toAcc = db.bankAccounts.find(b => b.id === toAccountId);
    
    if (!fromAcc || !toAcc) {
      return NextResponse.json({ error: 'One or both accounts not found' }, { status: 404 });
    }
    
    if (fromAcc.balance < amt) {
      return NextResponse.json({ error: `Insufficient funds in ${fromAcc.name}. Balance is ₹${fromAcc.balance.toLocaleString('en-IN')}` }, { status: 400 });
    }
    
    fromAcc.balance -= amt;
    toAcc.balance += amt;
    
    // Log transfer as transactions in ledger
    const txFrom = {
      id: crypto.randomUUID(),
      type: 'expense',
      amount: amt,
      category: 'Treasury Transfer',
      date: new Date().toISOString(),
      bankAccountId: fromAccountId,
      description: `Transfer to ${toAcc.name}`,
      reconcileStatus: 'reconciled'
    };
    const txTo = {
      id: crypto.randomUUID(),
      type: 'income',
      amount: amt,
      category: 'Treasury Transfer',
      date: new Date().toISOString(),
      bankAccountId: toAccountId,
      description: `Transfer from ${fromAcc.name}`,
      reconcileStatus: 'reconciled'
    };
    
    db.transactions.push(txFrom);
    db.transactions.push(txTo);
    saveDb();
    
    logAuditAction('sys-admin', 'create', 'TreasuryTransfer', `${fromAccountId}->${toAccountId}`, null, { amount: amt });
    
    return NextResponse.json({ 
      message: 'Transfer successful', 
      fromBalance: fromAcc.balance, 
      toBalance: toAcc.balance 
    });
  } catch (e) {
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }
}
