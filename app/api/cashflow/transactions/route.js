import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';
import { logAuditAction } from '../../../middleware/auditLogger';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const bankAccountId = searchParams.get('bankAccountId');
  
  let results = db.transactions;

  if (type) results = results.filter(t => t.type === type);
  if (category) results = results.filter(t => t.category === category);
  if (bankAccountId) results = results.filter(t => t.bankAccountId === bankAccountId);

  return NextResponse.json(results);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);

    // Validation
    if (!body.type || isNaN(amount) || amount <= 0 || !body.bankAccountId || !body.category) {
      return NextResponse.json({ error: 'Missing or invalid fields: type (income|expense), amount, bankAccountId, category' }, { status: 400 });
    }

    if (body.type !== 'income' && body.type !== 'expense') {
      return NextResponse.json({ error: 'Type must be either income or expense' }, { status: 400 });
    }

    // Mutate corresponding bank account balance and check overdraft
    const bankAccount = db.bankAccounts.find(b => b.id === body.bankAccountId);
    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }

    if (body.type === 'expense' && bankAccount.balance < amount) {
      return NextResponse.json({ error: `Overdraft rejected: Insufficient balance. Account balance is ₹${bankAccount.balance.toLocaleString()}` }, { status: 400 });
    }

    const newTx = {
      id: crypto.randomUUID(),
      type: body.type, // 'income' | 'expense'
      amount,
      category: body.category,
      date: body.date || new Date().toISOString(),
      bankAccountId: body.bankAccountId,
      description: body.description || '',
      reconcileStatus: body.reconcileStatus || 'pending',
      paymentMethod: body.paymentMethod || 'Bank Transfer',
      currency: body.currency || 'INR',
      department: body.department || '',
      project: body.project || '',
      employee: body.employee || '',
      vendor: body.vendor || '',
      customer: body.customer || '',
      taxRate: body.taxRate || 'GST 0%',
      dueDate: body.dueDate || body.date || new Date().toISOString().split('T')[0]
    };

    if (newTx.type === 'income') {
      bankAccount.balance += amount;
    } else if (newTx.type === 'expense') {
      bankAccount.balance -= amount;
    }

    db.transactions.push(newTx);
    saveDb();
    
    logAuditAction('sys-admin', 'create', 'Transaction', newTx.id, null, newTx);

    return NextResponse.json(newTx, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
