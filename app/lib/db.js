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
    // --- FY 2024 ---
    // Q1 2024 (Jan - Mar)
    { id: 'tx-24-q1-1', type: 'income', amount: 4500000, category: 'Sales Revenue', date: '2024-02-15', bankAccountId: 'bank-1', description: 'Q1 Corporate Licensing', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', project: 'ERP System Upgrade', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2024-02-10' },
    { id: 'tx-24-q1-2', type: 'expense', amount: 1200000, category: 'Salary', date: '2024-03-01', bankAccountId: 'bank-1', description: 'Q1 Core Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Amit Kumar', taxRate: 'GST 0%', dueDate: '2024-03-01' },
    // Q2 2024 (Apr - Jun)
    { id: 'tx-24-q2-1', type: 'income', amount: 5000000, category: 'Sales Revenue', date: '2024-05-10', bankAccountId: 'bank-2', description: 'Q2 Subscriptions Inbound', reconcileStatus: 'reconciled', paymentMethod: 'Online Gateway', currency: 'INR', department: 'Sales', customer: 'Tata Motors', taxRate: 'GST 18%', dueDate: '2024-05-01' },
    { id: 'tx-24-q2-2', type: 'expense', amount: 1500000, category: 'Marketing', date: '2024-06-15', bankAccountId: 'bank-1', description: 'Q2 Campaign Ads', reconcileStatus: 'reconciled', paymentMethod: 'Credit Card', currency: 'INR', department: 'Marketing', vendor: 'Office Space Inc', taxRate: 'GST 18%', dueDate: '2024-06-10' },
    // Q3 2024 (Jul - Sep)
    { id: 'tx-24-q3-1', type: 'income', amount: 6000000, category: 'Sales Revenue', date: '2024-08-20', bankAccountId: 'bank-1', description: 'Q3 Enterprise Consulting', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Infosys Tech', taxRate: 'GST 18%', dueDate: '2024-08-15' },
    { id: 'tx-24-q3-2', type: 'expense', amount: 800000, category: 'Utilities', date: '2024-09-05', bankAccountId: 'bank-2', description: 'AWS Production Hosting', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'IT', vendor: 'AWS Cloud Services', taxRate: 'GST 18%', dueDate: '2024-09-05' },
    // Q4 2024 (Oct - Dec)
    { id: 'tx-24-q4-1', type: 'income', amount: 7000000, category: 'Sales Revenue', date: '2024-11-15', bankAccountId: 'bank-1', description: 'Q4 Product Shipments', reconcileStatus: 'reconciled', paymentMethod: 'NEFT', currency: 'INR', department: 'Sales', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2024-11-10' },
    { id: 'tx-24-q4-2', type: 'expense', amount: 2000000, category: 'Salary', date: '2024-12-20', bankAccountId: 'bank-1', description: 'Dec Winter Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Neha Sharma', taxRate: 'GST 0%', dueDate: '2024-12-20' },

    // --- FY 2025 ---
    // Q1 2025 (Jan - Mar)
    { id: 'tx-25-q1-1', type: 'income', amount: 5500000, category: 'Sales Revenue', date: '2025-01-15', bankAccountId: 'bank-1', description: 'Q1 Renewal Inflow', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Tata Motors', taxRate: 'GST 18%', dueDate: '2025-01-10' },
    { id: 'tx-25-q1-2', type: 'expense', amount: 1200000, category: 'Salary', date: '2025-02-28', bankAccountId: 'bank-1', description: 'Feb Standard Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Rahul Singh', taxRate: 'GST 0%', dueDate: '2025-02-28' },
    // Q2 2025 (Apr - Jun)
    { id: 'tx-25-q2-1', type: 'income', amount: 6500000, category: 'Sales Revenue', date: '2025-04-18', bankAccountId: 'bank-2', description: 'Q2 Licensing Deal', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2025-04-15' },
    { id: 'tx-25-q2-2', type: 'expense', amount: 1800000, category: 'Marketing', date: '2025-05-22', bankAccountId: 'bank-1', description: 'Spring Ad Spend', reconcileStatus: 'reconciled', paymentMethod: 'NEFT', currency: 'INR', department: 'Marketing', vendor: 'Airtel Enterprise', taxRate: 'GST 18%', dueDate: '2025-05-20' },
    // Q3 2025 (Jul - Sep)
    { id: 'tx-25-q3-1', type: 'income', amount: 8000000, category: 'Sales Revenue', date: '2025-07-12', bankAccountId: 'bank-1', description: 'Q3 Enterprise Consulting', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Infosys Tech', taxRate: 'GST 18%', dueDate: '2025-07-10' },
    { id: 'tx-25-q3-2', type: 'expense', amount: 1000000, category: 'Software', date: '2025-08-30', bankAccountId: 'bank-2', description: 'Software SaaS Subscriptions', reconcileStatus: 'reconciled', paymentMethod: 'Credit Card', currency: 'INR', department: 'IT', vendor: 'AWS Cloud Services', taxRate: 'GST 18%', dueDate: '2025-08-30' },
    // Q4 2025 (Oct - Dec)
    { id: 'tx-25-q4-1', type: 'income', amount: 9000000, category: 'Sales Revenue', date: '2025-10-01', bankAccountId: 'bank-1', description: 'Q4 Core Inbound Order', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2025-09-30' },
    { id: 'tx-25-q4-2', type: 'expense', amount: 1200000, category: 'Salary', date: '2025-10-05', bankAccountId: 'bank-1', description: 'Oct Standard Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Amit Kumar', taxRate: 'GST 0%', dueDate: '2025-10-05' },

    // --- FY 2026 ---
    // Q1 2026 (Jan - Mar)
    { id: 'tx-26-q1-1', type: 'income', amount: 7500000, category: 'Sales Revenue', date: '2026-01-20', bankAccountId: 'bank-1', description: 'Q1 Global Shipments', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Tata Motors', taxRate: 'GST 18%', dueDate: '2026-01-15' },
    { id: 'tx-26-q1-2', type: 'expense', amount: 1500000, category: 'Rent', date: '2026-02-15', bankAccountId: 'bank-1', description: 'Corporate Office Rental', reconcileStatus: 'reconciled', paymentMethod: 'Cheque', currency: 'INR', department: 'Operations', vendor: 'Office Space Inc', taxRate: 'GST 18%', dueDate: '2026-02-15' },
    // Q2 2026 (Apr - Jun)
    { id: 'tx-26-q2-1', type: 'income', amount: 8500000, category: 'Sales Revenue', date: '2026-04-10', bankAccountId: 'bank-2', description: 'Q2 Enterprise Deal', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'Sales', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2026-04-05' },
    { id: 'tx-26-q2-2', type: 'expense', amount: 2500000, category: 'Salary', date: '2026-05-15', bankAccountId: 'bank-1', description: 'May General Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Neha Sharma', taxRate: 'GST 0%', dueDate: '2026-05-15' },
    // Q3 2026 (Jul - Sep)
    { id: 'tx-26-q3-1', type: 'income', amount: 9500000, category: 'Sales Revenue', date: '2026-07-05', bankAccountId: 'bank-1', description: 'Q3 Enterprise Licenses', reconcileStatus: 'reconciled', paymentMethod: 'NEFT', currency: 'INR', department: 'Sales', customer: 'Infosys Tech', taxRate: 'GST 18%', dueDate: '2026-07-01' },
    { id: 'tx-26-q3-2', type: 'expense', amount: 1400000, category: 'Software', date: '2026-08-12', bankAccountId: 'bank-2', description: 'SaaS Tooling Renewals', reconcileStatus: 'reconciled', paymentMethod: 'Cheque', currency: 'INR', department: 'IT', vendor: 'AWS Cloud Services', taxRate: 'GST 18%', dueDate: '2026-08-12' },
    // Q4 2026 (Oct - Dec)
    { id: 'tx-26-q4-1', type: 'income', amount: 12000000, category: 'Sales Revenue', date: '2026-10-15', bankAccountId: 'bank-1', description: 'Q4 Annual License Inbound', reconcileStatus: 'reconciled', paymentMethod: 'RTGS', currency: 'INR', department: 'Sales', customer: 'Reliance Industries', taxRate: 'GST 18%', dueDate: '2026-10-10' },
    { id: 'tx-26-q4-2', type: 'expense', amount: 3000000, category: 'Salary', date: '2026-11-20', bankAccountId: 'bank-1', description: 'Nov General Payroll', reconcileStatus: 'reconciled', paymentMethod: 'Bank Transfer', currency: 'INR', department: 'HR', employee: 'Amit Kumar', taxRate: 'GST 0%', dueDate: '2026-11-20' },
  ],
  auditLogs: [],
  bankAccounts: [
    { id: 'bank-1', name: 'HDFC Current', balance: 150000000 },
    { id: 'bank-2', name: 'ICICI Treasury', balance: 100000000 }
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
  },
  vendors: [
    { id: 'v-1', name: 'AWS Cloud Services' },
    { id: 'v-2', name: 'Office Space Inc' },
    { id: 'v-3', name: 'Airtel Enterprise' }
  ],
  customers: [
    { id: 'c-1', name: 'Reliance Industries' },
    { id: 'c-2', name: 'Tata Motors' },
    { id: 'c-3', name: 'Infosys Tech' }
  ],
  projects: [
    { id: 'p-1', name: 'Office Relocation' },
    { id: 'p-2', name: 'ERP System Upgrade' }
  ],
  employees: [
    { id: 'e-1', name: 'Amit Kumar' },
    { id: 'e-2', name: 'Neha Sharma' },
    { id: 'e-3', name: 'Rahul Singh' }
  ],
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
