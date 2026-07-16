import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';
import { logAuditAction } from '../../../middleware/auditLogger';

export async function POST(request) {
  try {
    const { bankAccountId, entries } = await request.json();
    
    if (!bankAccountId || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const bankAccount = db.bankAccounts.find(b => b.id === bankAccountId);
    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    const reconciledTransactions = entries.map(entry => {
      const amount = Math.abs(Number(entry.amount));
      const type = Number(entry.amount) >= 0 ? 'income' : 'expense';

      // Adjust bank account balance
      if (type === 'income') {
        bankAccount.balance += amount;
      } else {
        bankAccount.balance -= amount;
      }

      const newTx = {
        id: crypto.randomUUID(),
        type,
        amount,
        category: entry.category || 'Uncategorized',
        date: entry.date || new Date().toISOString(),
        bankAccountId,
        description: entry.description || 'Imported from bank statement',
        reconcileStatus: 'reconciled'
      };

      db.transactions.push(newTx);
      return newTx;
    });

    saveDb();
    logAuditAction('sys-admin', 'create', 'ReconciliationBatch', bankAccountId, null, { count: entries.length });

    return NextResponse.json({ message: 'Reconciliation complete', transactions: reconciledTransactions }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
  }
}
