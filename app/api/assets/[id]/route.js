import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';
import { logAuditAction } from '../../../middleware/auditLogger';

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const assetIndex = db.assets.findIndex(a => a.id === id);
    
    if (assetIndex === -1) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const oldAsset = { ...db.assets[assetIndex] };
    
    // Prevent ID overwrite
    const { id: _, ...rest } = body;
    const updatedAsset = { ...oldAsset, ...rest };
    db.assets[assetIndex] = updatedAsset;

    saveDb();
    logAuditAction('sys-admin', 'update', 'Asset', id, oldAsset, updatedAsset);

    return NextResponse.json(updatedAsset);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const assetIndex = db.assets.findIndex(a => a.id === id);
  
  if (assetIndex === -1) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const oldAsset = { ...db.assets[assetIndex] };
  
  // Soft-delete
  db.assets[assetIndex].status = 'disposed';
  
  saveDb();
  logAuditAction('sys-admin', 'delete', 'Asset', id, oldAsset, db.assets[assetIndex]);

  return NextResponse.json({ message: 'Asset archived' });
}
