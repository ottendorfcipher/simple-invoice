import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    let result;
    
    if (status) {
      result = db.all(
        'SELECT * FROM invoices WHERE status = ? ORDER BY createdAt DESC',
        [status]
      );
    } else {
      result = db.all(
        'SELECT * FROM invoices ORDER BY createdAt DESC'
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    // Generate invoice number if not provided
    const invoiceNumber = body.invoiceNumber || `INV-${Date.now()}`;
    
    const id = nanoid();
    const now = new Date().toISOString();
    
    db.run(`
      INSERT INTO invoices (
        id, invoiceNumber, status, issueDate, dueDate, subtotal, tax, total,
        currency, customer, company, lineItems, notes, invoiceTitle, 
        footerMessage, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      invoiceNumber,
      body.status || 'draft',
      body.issueDate || new Date().toISOString().split('T')[0],
      body.dueDate || null,
      body.subtotal || 0,
      body.tax || 0,
      body.total || 0,
      body.currency || 'USD',
      JSON.stringify(body.customer || {}),
      JSON.stringify(body.company || {}),
      JSON.stringify(body.lineItems || []),
      body.notes || null,
      body.invoiceTitle || 'Invoice',
      body.footerMessage || null,
      now,
      now
    ]);
    
    const result = db.get('SELECT * FROM invoices WHERE id = ?', [id]);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
