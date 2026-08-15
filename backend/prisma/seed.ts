import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Standard demo IDs referenced in tests, docs, and startup log
export const DEMO_CLIENT_ID = 'a1b2c3d4-0001-0001-0001-000000000001';
export const DEMO_ADVISOR_ID = 'a1b2c3d4-0002-0002-0002-000000000002';
export const EVELYN_CLIENT_ID = 'b33d026f-4c28-4ad0-85f2-1ab08e2f89e2';
export const RAJESH_CLIENT_ID = 'd55f026f-4c28-4ad0-85f2-1ab08e2f89e4';
export const SARAH_ADVISOR_ID = 'a11a026f-4c28-4ad0-85f2-1ab08e2f89e1';

async function main() {
  console.log('Starting seed...');

  const defaultPassword = await bcrypt.hash('demo1234', 10);

  // 1. Create Users
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@wms.demo' },
    update: {},
    create: {
      id: DEMO_CLIENT_ID,
      email: 'client@wms.demo',
      name: 'Demo Client',
      passwordHash: defaultPassword,
      role: 'client',
      onboardingComplete: true,
      segment: 'Mass Affluent',
    },
  });

  const advisorUser = await prisma.user.upsert({
    where: { email: 'advisor@wms.demo' },
    update: {},
    create: {
      id: DEMO_ADVISOR_ID,
      email: 'advisor@wms.demo',
      name: 'Demo Advisor',
      passwordHash: defaultPassword,
      role: 'advisor',
      onboardingComplete: true,
      segment: 'HNI',
    },
  });

  const evelynUser = await prisma.user.upsert({
    where: { email: 'evelyn.v@example.com' },
    update: {},
    create: {
      id: EVELYN_CLIENT_ID,
      email: 'evelyn.v@example.com',
      name: 'Evelyn Vandermark',
      passwordHash: defaultPassword,
      role: 'client',
      onboardingComplete: true,
      segment: 'Mass Affluent',
    },
  });

  const rajeshUser = await prisma.user.upsert({
    where: { email: 'rajesh.n@example.com' },
    update: {},
    create: {
      id: RAJESH_CLIENT_ID,
      email: 'rajesh.n@example.com',
      name: 'Rajesh Nair',
      passwordHash: defaultPassword,
      role: 'client',
      onboardingComplete: true,
      segment: 'HNI',
    },
  });

  const sarahUser = await prisma.user.upsert({
    where: { email: 'sarah.j@example.com' },
    update: {},
    create: {
      id: SARAH_ADVISOR_ID,
      email: 'sarah.j@example.com',
      name: 'Sarah Jenkins',
      passwordHash: defaultPassword,
      role: 'advisor',
      onboardingComplete: true,
      segment: 'HNI',
    },
  });

  console.log('Users seeded');

  // 2. Client Profiles
  await prisma.clientProfile.upsert({
    where: { userId: DEMO_CLIENT_ID },
    update: { displayCurrency: 'INR' },
    create: { userId: DEMO_CLIENT_ID, age: 34, riskProfile: 'Balanced', displayCurrency: 'INR' },
  });

  await prisma.clientProfile.upsert({
    where: { userId: EVELYN_CLIENT_ID },
    update: { displayCurrency: 'INR' },
    create: { userId: EVELYN_CLIENT_ID, age: 34, riskProfile: 'Moderate', displayCurrency: 'INR' },
  });

  await prisma.clientProfile.upsert({
    where: { userId: RAJESH_CLIENT_ID },
    update: { displayCurrency: 'INR' },
    create: { userId: RAJESH_CLIENT_ID, age: 48, riskProfile: 'Aggressive', displayCurrency: 'INR' },
  });

  // 3. Assumptions
  for (const uid of [DEMO_CLIENT_ID, EVELYN_CLIENT_ID, RAJESH_CLIENT_ID]) {
    await prisma.assumptions.upsert({
      where: { userId: uid },
      update: {},
      create: {
        userId: uid,
        inflationRate: 0.03,
        expectedReturn: 0.07,
        retirementInflation: 0.04,
        educationInflation: 0.06,
      },
    });
  }

  // 4. Advisor Client Consents
  await prisma.advisorClientConsent.upsert({
    where: { advisorId_clientId: { advisorId: DEMO_ADVISOR_ID, clientId: DEMO_CLIENT_ID } },
    update: {},
    create: { advisorId: DEMO_ADVISOR_ID, clientId: DEMO_CLIENT_ID },
  });

  await prisma.advisorClientConsent.upsert({
    where: { advisorId_clientId: { advisorId: SARAH_ADVISOR_ID, clientId: EVELYN_CLIENT_ID } },
    update: {},
    create: { advisorId: SARAH_ADVISOR_ID, clientId: EVELYN_CLIENT_ID },
  });

  await prisma.advisorClientConsent.upsert({
    where: { advisorId_clientId: { advisorId: SARAH_ADVISOR_ID, clientId: RAJESH_CLIENT_ID } },
    update: {},
    create: { advisorId: SARAH_ADVISOR_ID, clientId: RAJESH_CLIENT_ID },
  });

  // 5. Sample Institutions, Accounts, Holdings for DEMO_CLIENT_ID & Evelyn
  const demoInst = await prisma.institution.create({
    data: { userId: DEMO_CLIENT_ID, name: 'Chase Bank', type: 'Bank' },
  });

  const demoAcct = await prisma.account.create({
    data: { userId: DEMO_CLIENT_ID, institutionId: demoInst.id, name: 'Main Checking', type: 'Checking' },
  });

  await prisma.holding.create({
    data: { userId: DEMO_CLIENT_ID, accountId: demoAcct.id, name: 'Cash Reserves', category: 'Cash', currentValue: 15000, isLiquid: true },
  });

  await prisma.holding.create({
    data: { userId: DEMO_CLIENT_ID, accountId: demoAcct.id, name: 'S&P 500 Index ETF', category: 'Stocks', currentValue: 45000, isLiquid: false },
  });

  await prisma.liability.create({
    data: { userId: DEMO_CLIENT_ID, name: 'Sapphire Preferred Credit Card', category: 'Credit Card', outstandingBalance: 3200, interestRate: 0.2199, monthlyPayment: 150 },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'Emergency Savings Fund',
      category: 'Emergency Fund',
      priority: 'High',
      targetAmount: 25000,
      targetYear: 2027,
      alreadySaved: 15000,
      monthlyContribution: 500,
      shortfall: 7800,
    },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'Children Education Fund',
      category: 'Education',
      priority: 'High',
      targetAmount: 60000,
      targetYear: 2036,
      alreadySaved: 15000,
      monthlyContribution: 350,
      shortfall: 17364,
    },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'New Car Purchase',
      category: 'Purchase',
      priority: 'Medium',
      targetAmount: 30000,
      targetYear: 2028,
      alreadySaved: 5000,
      monthlyContribution: 300,
      shortfall: 18398,
    },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'Retirement Wealth Fund',
      category: 'Retirement',
      priority: 'Medium',
      targetAmount: 1200000,
      targetYear: 2055,
      alreadySaved: 100000,
      monthlyContribution: 1000,
      shortfall: 1904788,
    },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'Home Renovation Goal',
      category: 'Purchase',
      priority: 'Low',
      targetAmount: 40000,
      targetYear: 2026,
      alreadySaved: 35000,
      monthlyContribution: 600,
      shortfall: 0,
    },
  });

  await prisma.goal.create({
    data: {
      userId: DEMO_CLIENT_ID,
      name: 'Annual Family Vacation',
      category: 'General Savings',
      priority: 'Low',
      targetAmount: 15000,
      targetYear: 2026,
      alreadySaved: 15000,
      monthlyContribution: 400,
      shortfall: 0,
    },
  });

  await prisma.recommendationAlert.create({
    data: {
      userId: DEMO_CLIENT_ID,
      category: 'Debt Management',
      priority: 'High',
      alertMessage: 'Your credit card has an outstanding balance of ₹3,200 at 21.99% APR. Pay this off immediately.',
      reason: '21.99% guaranteed return beats market investments.',
      expectedBenefit: 'Saves ~₹700/year in interest.',
      action: 'Apply Debt Avalanche strategy.',
      status: 'Active',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
