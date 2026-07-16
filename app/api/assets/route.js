import { NextResponse } from 'next/server';
import { db, saveDb } from '../../lib/db';
import { logAuditAction } from '../../middleware/auditLogger';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let results = db.assets;

  if (type) results = results.filter(a => a.type === type);
  if (status) results = results.filter(a => a.status === status);
  if (category) results = results.filter(a => a.category === category);

  return NextResponse.json(results);
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Input Validation
    if (!body.type || !body.name || isNaN(Number(body.purchasePrice)) || !body.depreciationMethod || isNaN(Number(body.usefulLifeMonths))) {
      return NextResponse.json({ error: 'Missing or invalid fields: type, name, purchasePrice, depreciationMethod, usefulLifeMonths' }, { status: 400 });
    }

    const newAsset = {
      id: crypto.randomUUID(),
      type: body.type,
      name: body.name,
      category: body.category || 'Uncategorized',
      purchasePrice: Number(body.purchasePrice),
      purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
      currentValue: Number(body.purchasePrice), // Initial value
      depreciationMethod: body.depreciationMethod,
      usefulLifeMonths: Number(body.usefulLifeMonths),
      location: body.location || '',
      ownerId: body.ownerId || 'corp',
      status: body.status || 'active'
    };

    db.assets.push(newAsset);
    saveDb();
    
    // Hardcoded actorId for now since auth is mock
    logAuditAction('sys-admin', 'create', 'Asset', newAsset.id, null, newAsset);

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
