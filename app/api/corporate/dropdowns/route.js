import { NextResponse } from 'next/server';
import { db, saveDb } from '../../../lib/db';

export async function GET() {
  return NextResponse.json({
    vendors: db.vendors || [],
    customers: db.customers || [],
    projects: db.projects || [],
    employees: db.employees || [],
    departments: ["Sales", "Marketing", "HR", "Finance", "Operations", "IT", "Management", "Legal", "Procurement"],
    paymentMethods: ["Cash", "Bank Transfer", "UPI", "Credit Card", "Debit Card", "Cheque", "NEFT", "RTGS", "Online Gateway"],
    currencies: ["INR", "USD", "EUR", "GBP", "AED", "JPY"],
    transactionTypes: ["Income", "Expense", "Transfer", "Purchase", "Sale", "Investment", "Loan", "Repayment", "Adjustment", "Refund"],
    taxRates: ["GST 0%", "GST 5%", "GST 12%", "GST 18%", "GST 28%"],
    countries: ["India", "United States", "Germany", "United Kingdom", "UAE", "Japan"],
    states: { 
      "India": ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Gujarat"], 
      "United States": ["California", "New York", "Texas", "Florida"] 
    },
    cities: { 
      "Maharashtra": ["Mumbai", "Pune", "Nagpur"], 
      "Karnataka": ["Bengaluru", "Mysuru"], 
      "Delhi": ["New Delhi"], 
      "California": ["San Francisco", "Los Angeles"], 
      "New York": ["New York City", "Buffalo"] 
    }
  });
}

export async function POST(request) {
  try {
    const { type, name } = await request.json(); // type: 'vendors' | 'customers' | 'projects' | 'employees'
    if (!type || !name) {
      return NextResponse.json({ error: 'Missing type or name' }, { status: 400 });
    }
    if (!['vendors', 'customers', 'projects', 'employees'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!db[type]) db[type] = [];
    
    // Enforce duplicate check
    if (db[type].some(x => x.name.toLowerCase() === name.trim().toLowerCase())) {
      return NextResponse.json({ error: `${name} already exists in ${type}.` }, { status: 400 });
    }

    const newItem = {
      id: `${type[0]}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim()
    };
    db[type].push(newItem);
    saveDb();

    return NextResponse.json(newItem, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
