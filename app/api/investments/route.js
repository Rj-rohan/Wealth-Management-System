import { NextResponse } from 'next/server';
import { db, saveDb } from '../../lib/db';
import { logAuditAction } from '../../middleware/auditLogger';

export async function GET() {
  return NextResponse.json(db.investments);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const amountInvested = Number(body.amountInvested);
    const quantity = Number(body.quantity);
    const buyPrice = Number(body.buyPrice);

    // Validation
    if (!body.instrumentName || !body.ticker || isNaN(amountInvested) || isNaN(quantity) || isNaN(buyPrice)) {
      return NextResponse.json({ error: 'Missing or invalid fields: instrumentName, ticker, amountInvested, quantity, buyPrice' }, { status: 400 });
    }
    
    // Default approvalStatus to 'pending' if it requires CFO sign-off
    const approvalStatus = amountInvested > 1000000 ? 'pending' : 'approved';

    const newInvestment = {
      id: crypto.randomUUID(),
      portfolioId: body.portfolioId || 'corp-1',
      instrumentName: body.instrumentName,
      ticker: body.ticker,
      amountInvested,
      quantity,
      buyPrice,
      currentValue: amountInvested,
      targetReturnPct: Number(body.targetReturnPct) || 0,
      expectedExitDate: body.expectedExitDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      status: body.status || 'bought',
      approvalStatus,
      approvedBy: approvalStatus === 'approved' ? 'auto' : null,
      approvedAt: approvalStatus === 'approved' ? new Date().toISOString() : null,
      notes: body.notes || ''
    };

    db.investments.push(newInvestment);
    saveDb();
    
    logAuditAction('sys-admin', 'create', 'Investment', newInvestment.id, null, newInvestment);

    return NextResponse.json(newInvestment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
