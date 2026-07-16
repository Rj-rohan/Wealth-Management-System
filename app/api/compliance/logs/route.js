import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get('actorId');
  const entityType = searchParams.get('entityType');

  let results = db.auditLogs;

  if (actorId) results = results.filter(l => l.actorId === actorId);
  if (entityType) results = results.filter(l => l.entityType === entityType);

  return NextResponse.json(results);
}
