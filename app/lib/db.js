import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

const initialDb = {
  assets: [
    { id: '1', type: 'physical', name: 'Headquarters Building', category: 'Real Estate', purchasePrice: 50000000, purchaseDate: '2020-01-15', currentValue: 48000000, depreciationMethod: 'straight-line', usefulLifeMonths: 360, location: 'Mumbai', ownerId: 'corp', status: 'active' },
    { id: '2', type: 'digital', name: 'Cloud Infrastructure', category: 'Software', purchasePrice: 2000000, purchaseDate: '2023-05-10', currentValue: 1500000, depreciationMethod: 'declining-balance', usefulLifeMonths: 60, location: 'AWS', ownerId: 'it-dept', status: 'active' },
  ],
  investments: [
    { id: '1', portfolioId: 'corp-1', instrumentName: 'TCS Shares', ticker: 'TCS', amountInvested: 15000000, quantity: 4000, buyPrice: 3750, currentValue: 16000000, targetReturnPct: 15, expectedExitDate: '2026-12-31', status: 'held', approvalStatus: 'approved', approvedBy: 'CFO', approvedAt: '2024-01-20', notes: 'Core holding' },
  ],
  transactions: [
    { id: '1', type: 'income', amount: 5000000, category: 'Sales Revenue', date: '2024-10-01', bankAccountId: 'bank-1', description: 'Q3 Sales', reconcileStatus: 'reconciled' },
    { id: '2', type: 'expense', amount: 1200000, category: 'Salaries', date: '2024-10-05', bankAccountId: 'bank-1', description: 'Oct Payroll', reconcileStatus: 'reconciled' },
  ],
  auditLogs: [],
  bankAccounts: [
    { id: 'bank-1', name: 'HDFC Current', balance: 25000000 },
    { id: 'bank-2', name: 'ICICI Treasury', balance: 15000000 }
  ],
  deadlines: [
    { id: '1', title: 'GST Filing (GSTR-1)', dueDate: '2024-11-11', type: 'tax', status: 'pending' },
    { id: '2', title: 'TDS Return (Q2)', dueDate: '2024-11-30', type: 'tax', status: 'pending' },
    { id: '3', title: 'Statutory Audit', dueDate: '2024-12-31', type: 'audit', status: 'upcoming' }
  ],
  company: {
    name: 'Apex Wealth Corp',
    taxBracket: '30%',
    cfoName: 'Rohan Sharma',
    incorporationDate: '2015-06-12',
    pan: 'AAACA1234A'
  }
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading db.json, falling back to initial data', e);
  }
  
  // Write initial structure
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to create db.json', e);
  }
  return initialDb;
}

export const db = readDb();

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save to db.json', e);
  }
}
