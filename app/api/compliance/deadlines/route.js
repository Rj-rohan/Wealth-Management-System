import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';

export async function GET() {
  return NextResponse.json(db.deadlines || []);
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title || !body.dueDate || !body.type) {
      return NextResponse.json({ error: 'Missing required fields: title, dueDate, type' }, { status: 400 });
    }
    const newDeadline = {
      id: crypto.randomUUID(),
      title: body.title,
      dueDate: body.dueDate,
      type: body.type,
      status: body.status || 'upcoming'
    };
    if (!db.deadlines) db.deadlines = [];
    db.deadlines.push(newDeadline);
    saveDb();
    return NextResponse.json(newDeadline, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
