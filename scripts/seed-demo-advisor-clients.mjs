import pg from "pg";
const { Client } = pg;

const rawUrl = process.env.DATABASE_URL || "postgresql://postgres:system@localhost:5432/wealth_management";

async function main() {
  console.log("Connecting to PostgreSQL...");
  const client = new Client({ connectionString: rawUrl });
  await client.connect();
  console.log("Connected successfully.");

  try {
    // 1. Get all existing users in the system to update their profiles to Rahul Deshmukh
    const usersRes = await client.query("SELECT id, email FROM users");
    const existingUsers = usersRes.rows;
    console.log(`Found ${existingUsers.length} user(s) in the database:`, existingUsers);

    // Target advisor user IDs: all existing users plus canonical ID
    const userIdsToUpdate = existingUsers.map((u) => u.id);

    // If no user exists, create one
    if (userIdsToUpdate.length === 0) {
      const newUserId = "7bdc421d-4a2f-43cb-8961-61a5a1451260";
      await client.query(
        `INSERT INTO users (id, email, password_hash, email_verified, two_factor_enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          newUserId,
          "rahul.deshmukh@example.com",
          "7e044425073cdc0ea9ec8aae2b34bcc7:306bbaca109daf3d2353dcd0f0c984f1b7278b048e8cb7cae018a843bd5345505f62f63eaf659de33845234a131fcc4c05084044a9a3d700d80723545cd8c2f5",
          true,
          false,
        ]
      );
      userIdsToUpdate.push(newUserId);
    }

    const primaryAdvisorId = userIdsToUpdate[0];

    // 2. Populate Advisor Profile & Details for all user accounts
    for (const userId of userIdsToUpdate) {
      console.log(`Populating advisor profile for user ID: ${userId}...`);

      // 2a. advisor_profiles
      await client.query(
        `INSERT INTO advisor_profiles (
          id, user_id, email, full_name, profile_photo, phone, bio, location,
          date_of_birth, gender, nationality, address, city, state, country, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender,
          nationality = EXCLUDED.nationality,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          updated_at = now()`,
        [
          userId,
          "rahul.deshmukh@example.com",
          "Rahul Deshmukh",
          "",
          "+91 98765 43210",
          "Financial advisor specializing in personal wealth management, retirement planning, investment planning, and long-term financial goal management.",
          "Pune, Maharashtra, India",
          "1985-06-15",
          "male",
          "Indian",
          "FC Road, Shivaji Nagar, Pune, Maharashtra",
          "Pune",
          "Maharashtra",
          "India",
        ]
      );

      // 2b. advisor_professional_details
      const feeStructure = JSON.stringify({
        hourly: "1500",
        financial_planning: "5000",
        portfolio_review: "2500",
        retirement_planning: "3500",
        tax_planning: "2000",
      });

      await client.query(
        `INSERT INTO advisor_professional_details (
          id, advisor_id, job_title, organization, years_of_experience,
          professional_summary, consultation_mode, office_name, office_address,
          office_city, office_state, office_country, postal_code, fee_structure, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now()
        )
        ON CONFLICT (advisor_id) DO UPDATE SET
          job_title = EXCLUDED.job_title,
          organization = EXCLUDED.organization,
          years_of_experience = EXCLUDED.years_of_experience,
          professional_summary = EXCLUDED.professional_summary,
          consultation_mode = EXCLUDED.consultation_mode,
          office_name = EXCLUDED.office_name,
          office_address = EXCLUDED.office_address,
          office_city = EXCLUDED.office_city,
          office_state = EXCLUDED.office_state,
          office_country = EXCLUDED.office_country,
          postal_code = EXCLUDED.postal_code,
          fee_structure = EXCLUDED.fee_structure,
          updated_at = now()`,
        [
          userId,
          "Certified Financial Planner",
          "Meridian Wealth Advisors",
          10,
          "Financial advisor specializing in personal wealth management, retirement planning, investment planning, and long-term financial goal management.",
          "hybrid",
          "Meridian Wealth Advisors",
          "FC Road, Shivaji Nagar",
          "Pune",
          "Maharashtra",
          "India",
          "411005",
          feeStructure,
        ]
      );

      // 2c. advisor_qualifications
      await client.query(`DELETE FROM advisor_qualifications WHERE advisor_id = $1`, [userId]);
      await client.query(
        `INSERT INTO advisor_qualifications (id, advisor_id, degree, institution, year, field_of_study)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
        [userId, "MBA in Finance", "Savitribai Phule Pune University", 2010, "Finance"]
      );

      // 2d. advisor_certifications
      await client.query(`DELETE FROM advisor_certifications WHERE advisor_id = $1`, [userId]);
      await client.query(
        `INSERT INTO advisor_certifications (id, advisor_id, name, issuing_body, issue_date, expiry_date, credential_id)
         VALUES 
          (gen_random_uuid()::text, $1, 'Certified Financial Planner (CFP)', 'Financial Planning Standards Board', '2012-05-10', '2027-05-10', 'DEMO-CFP-1001'),
          (gen_random_uuid()::text, $1, 'NISM Investment Adviser Certification', 'National Institute of Securities Markets', '2014-08-15', '2027-08-15', 'DEMO-NISM-2002')`,
        [userId]
      );

      // 2e. advisor_licenses
      await client.query(`DELETE FROM advisor_licenses WHERE advisor_id = $1`, [userId]);
      await client.query(
        `INSERT INTO advisor_licenses (id, advisor_id, name, license_number, issuing_authority, expiry_date)
         VALUES (gen_random_uuid()::text, $1, 'Demo / Test Profile', 'Demo / Test Profile', 'Demo Account', '2028-12-31')`,
        [userId]
      );

      // 2f. advisor_languages
      await client.query(`DELETE FROM advisor_languages WHERE advisor_id = $1`, [userId]);
      await client.query(
        `INSERT INTO advisor_languages (id, advisor_id, language, proficiency)
         VALUES 
          (gen_random_uuid()::text, $1, 'English', 'fluent'),
          (gen_random_uuid()::text, $1, 'Marathi', 'native'),
          (gen_random_uuid()::text, $1, 'Hindi', 'fluent')`,
        [userId]
      );

      // 2g. advisor_expertise
      await client.query(`DELETE FROM advisor_expertise WHERE advisor_id = $1`, [userId]);
      await client.query(
        `INSERT INTO advisor_expertise (id, advisor_id, area, level)
         VALUES 
          (gen_random_uuid()::text, $1, 'Wealth Management', 'expert'),
          (gen_random_uuid()::text, $1, 'Retirement Planning', 'expert'),
          (gen_random_uuid()::text, $1, 'Investment Planning', 'expert'),
          (gen_random_uuid()::text, $1, 'Financial Goal Planning', 'expert')`,
        [userId]
      );

      // 2h. advisor_availability
      const workingDays = JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
      const workingHours = JSON.stringify("09:00 AM – 06:00 PM (Sat: 10:00 AM – 02:00 PM)");

      await client.query(
        `INSERT INTO advisor_availability (
          id, advisor_id, working_days, working_hours, timezone, consultation_duration, vacation_mode, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2::jsonb, $3::jsonb, $4, $5, $6, now()
        )
        ON CONFLICT (advisor_id) DO UPDATE SET
          working_days = EXCLUDED.working_days,
          working_hours = EXCLUDED.working_hours,
          timezone = EXCLUDED.timezone,
          consultation_duration = EXCLUDED.consultation_duration,
          vacation_mode = EXCLUDED.vacation_mode,
          updated_at = now()`,
        [userId, workingDays, workingHours, "Asia/Kolkata", 45, false]
      );
    }

    console.log("Advisor Rahul Deshmukh populated across all accounts successfully.");

    // 3. Populate The Three Fictional Clients
    const clientsData = [
      {
        id: "c_rahul_kulkarni",
        first_name: "Rahul",
        last_name: "Kulkarni",
        name: "Rahul Kulkarni",
        email: "rahul.kulkarni@example.com",
        phone: "+91 90000 10001",
        status: "active",
        risk_profile: "moderate",
        age: 29,
        gender: "Male",
        occupation: "Software Engineer",
        location: "Pune, Maharashtra, India",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        marital_status: "Single",
        dependents: 1,
        net_worth: 850000,
        assets: 950000,
        liabilities: 100000,
        income: 1200000,
        expenses: 660000,
        monthly_income: 100000,
        monthly_expenses: 55000,
        monthly_savings: 45000,
        emergency_fund_val: 120000,
        risk_score: 65,
        allocation: { equity: 58, fixedIncome: 16, cash: 21, alternatives: 5, realEstate: 0 },
        tags: ["Demo", "Software Engineer", "Single", "Moderate-Growth"],
        goals: [
          {
            id: "goal_rk_1",
            label: "Emergency Fund",
            type: "emergency_fund",
            target_amount: 330000,
            current_savings: 120000,
            target_date: "2027-12-31T00:00:00.000Z",
            monthly_contribution: 12000,
            progress: 36,
            priority: "high",
            status: "on_track",
          },
          {
            id: "goal_rk_2",
            label: "House Purchase",
            type: "house",
            target_amount: 5000000,
            current_savings: 550000,
            target_date: "2032-12-31T00:00:00.000Z",
            monthly_contribution: 45000,
            progress: 11,
            priority: "high",
            status: "on_track",
          },
          {
            id: "goal_rk_3",
            label: "Retirement",
            type: "retirement",
            target_amount: 20000000,
            current_savings: 400000,
            target_date: "2056-12-31T00:00:00.000Z",
            monthly_contribution: 20000,
            progress: 2,
            priority: "medium",
            status: "on_track",
          },
        ],
        financial_profile: {
          income: { total: 100000, salary: 100000, businessIncome: 0, rentalIncome: 0, investmentIncome: 0, otherIncome: 0 },
          expenses: { total: 55000, housing: 22000, transportation: 6000, food: 12000, insurance: 4000, entertainment: 4000, education: 0, healthcare: 3000, miscellaneous: 4000 },
          debts: { homeLoan: 0, personalLoan: 100000, vehicleLoan: 0, creditCard: 0, educationLoan: 0, total: 100000, debtRatio: 0.11, totalEmi: 3500, emiBurden: 0.035, debtReductionProgress: 40 },
          emergency_fund: { current: 120000, recommended: 330000, coverageMonths: 2.2 },
          health_score: 78,
          savings_rate: 0.45,
          monthly_surplus: 45000,
        },
        risk_profile_data: {
          risk_level: "moderate",
          risk_score: 65,
          investment_experience: "intermediate",
          risk_capacity: "medium",
          risk_tolerance: "medium",
          financial_stability: "stable",
          investment_horizon: "long",
          recommended_allocation: { equity: 60, fixedIncome: 25, cash: 10, alternatives: 5, realEstate: 0 },
          suitable_categories: ["Flexi Cap Funds", "Large & Mid Cap Mutual Funds", "Direct Equity", "Corporate Debt"],
        },
        portfolio: {
          total_value: 950000,
          total_cost: 820000,
          total_return: 15.8,
          holdings: [
            { id: "h_rk_1", name: "Bank Savings Account (HDFC)", ticker: "CASH-HDFC", type: "cash", sector: "Cash & Equivalents", geography: "India", riskLevel: "low", costBasis: 200000, currentValue: 200000, returnPct: 4.0, quantity: 1 },
            { id: "h_rk_2", name: "Fixed Deposits (SBI)", ticker: "FD-SBI", type: "fixed_deposit", sector: "Banking / Debt", geography: "India", riskLevel: "low", costBasis: 150000, currentValue: 150000, returnPct: 7.1, quantity: 1 },
            { id: "h_rk_3", name: "Parag Parikh Flexi Cap Fund", ticker: "PPFCF", type: "mutual_fund", sector: "Multi-Cap Equity", geography: "India", riskLevel: "medium", costBasis: 200000, currentValue: 250000, returnPct: 25.0, quantity: 3800 },
            { id: "h_rk_4", name: "Mirae Asset Large Cap Fund", ticker: "MALCF", type: "mutual_fund", sector: "Large Cap Equity", geography: "India", riskLevel: "medium", costBasis: 130000, currentValue: 150000, returnPct: 15.4, quantity: 1800 },
            { id: "h_rk_5", name: "Direct Stocks (TCS, Infosys, HDFC Bank)", ticker: "IT-BLUECHIP", type: "stock", sector: "Information Technology", geography: "India", riskLevel: "medium", costBasis: 100000, currentValue: 150000, returnPct: 50.0, quantity: 45 },
            { id: "h_rk_6", name: "Digital Gold / SGB", ticker: "SGB-GOLD", type: "gold", sector: "Precious Metals", geography: "India", riskLevel: "low", costBasis: 40000, currentValue: 50000, returnPct: 25.0, quantity: 8 },
          ],
        },
      },
      {
        id: "c_priya_patil",
        first_name: "Priya",
        last_name: "Patil",
        name: "Priya Patil",
        email: "priya.patil@example.com",
        phone: "+91 90000 10002",
        status: "active",
        risk_profile: "moderate",
        age: 41,
        gender: "Female",
        occupation: "Business Owner",
        location: "Pune, Maharashtra, India",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        marital_status: "Married",
        dependents: 2,
        net_worth: 3700000,
        assets: 6200000,
        liabilities: 2500000,
        income: 1800000,
        expenses: 1140000,
        monthly_income: 150000,
        monthly_expenses: 95000,
        monthly_savings: 55000,
        emergency_fund_val: 300000,
        risk_score: 50,
        allocation: { equity: 16, fixedIncome: 8, cash: 5, alternatives: 6, realEstate: 65 },
        tags: ["Demo", "Business Owner", "Married", "Moderate"],
        goals: [
          {
            id: "goal_pp_1",
            label: "Children Education",
            type: "education",
            target_amount: 2500000,
            current_savings: 600000,
            target_date: "2035-12-31T00:00:00.000Z",
            monthly_contribution: 20000,
            progress: 24,
            priority: "high",
            status: "on_track",
          },
          {
            id: "goal_pp_2",
            label: "Retirement",
            type: "retirement",
            target_amount: 30000000,
            current_savings: 1500000,
            target_date: "2045-12-31T00:00:00.000Z",
            monthly_contribution: 45000,
            progress: 5,
            priority: "high",
            status: "on_track",
          },
          {
            id: "goal_pp_3",
            label: "Home Loan Reduction",
            type: "wealth_creation",
            target_amount: 2200000,
            current_savings: 300000,
            target_date: "2030-12-31T00:00:00.000Z",
            monthly_contribution: 30000,
            progress: 14,
            priority: "high",
            status: "on_track",
          },
        ],
        financial_profile: {
          income: { total: 150000, salary: 0, businessIncome: 130000, rentalIncome: 20000, investmentIncome: 0, otherIncome: 0 },
          expenses: { total: 95000, housing: 35000, transportation: 10000, food: 20000, insurance: 8000, entertainment: 5000, education: 12000, healthcare: 5000, miscellaneous: 0 },
          debts: { homeLoan: 2200000, personalLoan: 300000, vehicleLoan: 0, creditCard: 0, educationLoan: 0, total: 2500000, debtRatio: 0.40, totalEmi: 25000, emiBurden: 0.17, debtReductionProgress: 35 },
          emergency_fund: { current: 300000, recommended: 570000, coverageMonths: 3.2 },
          health_score: 72,
          savings_rate: 0.37,
          monthly_surplus: 55000,
        },
        risk_profile_data: {
          risk_level: "moderate",
          risk_score: 50,
          investment_experience: "intermediate",
          risk_capacity: "medium",
          risk_tolerance: "medium",
          financial_stability: "stable",
          investment_horizon: "medium",
          recommended_allocation: { equity: 40, fixedIncome: 35, cash: 10, alternatives: 5, realEstate: 10 },
          suitable_categories: ["Balanced Advantage Funds", "Multi Asset Allocation", "Fixed Deposits", "Sovereign Gold Bonds"],
        },
        portfolio: {
          total_value: 6200000,
          total_cost: 5100000,
          total_return: 21.5,
          holdings: [
            { id: "h_pp_1", name: "Bank Savings Account", ticker: "CASH-BANK", type: "cash", sector: "Cash & Equivalents", geography: "India", riskLevel: "low", costBasis: 300000, currentValue: 300000, returnPct: 4.0, quantity: 1 },
            { id: "h_pp_2", name: "Fixed Deposits (HDFC Bank)", ticker: "FD-HDFC", type: "fixed_deposit", sector: "Banking / Debt", geography: "India", riskLevel: "low", costBasis: 500000, currentValue: 500000, returnPct: 7.2, quantity: 1 },
            { id: "h_pp_3", name: "ICICI Prudential Balanced Advantage", ticker: "ICICI-BAF", type: "mutual_fund", sector: "Hybrid / Balanced", geography: "India", riskLevel: "medium", costBasis: 500000, currentValue: 600000, returnPct: 20.0, quantity: 9500 },
            { id: "h_pp_4", name: "SBI Equity Hybrid Fund", ticker: "SBI-HYB", type: "mutual_fund", sector: "Hybrid Equity", geography: "India", riskLevel: "medium", costBasis: 350000, currentValue: 400000, returnPct: 14.3, quantity: 4200 },
            { id: "h_pp_5", name: "Physical Gold & SGB", ticker: "GOLD-PHYS", type: "gold", sector: "Precious Metals", geography: "India", riskLevel: "low", costBasis: 300000, currentValue: 400000, returnPct: 33.3, quantity: 65 },
            { id: "h_pp_6", name: "Commercial & Residential Property (Pune)", ticker: "RE-PUNE", type: "bond", sector: "Real Estate", geography: "India", riskLevel: "low", costBasis: 3150000, currentValue: 4000000, returnPct: 27.0, quantity: 1 },
          ],
        },
      },
      {
        id: "c_amit_shah",
        first_name: "Amit",
        last_name: "Shah",
        name: "Amit Shah",
        email: "amit.shah@example.com",
        phone: "+91 90000 10003",
        status: "active",
        risk_profile: "aggressive",
        age: 36,
        gender: "Male",
        occupation: "IT Consultant",
        location: "Mumbai, Maharashtra, India",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        marital_status: "Married",
        dependents: 1,
        net_worth: 4000000,
        assets: 4500000,
        liabilities: 500000,
        income: 3000000,
        expenses: 1200000,
        monthly_income: 250000,
        monthly_expenses: 100000,
        monthly_savings: 150000,
        emergency_fund_val: 500000,
        risk_score: 82,
        allocation: { equity: 78, fixedIncome: 4, cash: 11, alternatives: 7, realEstate: 0 },
        tags: ["Demo", "IT Consultant", "Married", "Aggressive"],
        goals: [
          {
            id: "goal_as_1",
            label: "Early Retirement",
            type: "retirement",
            target_amount: 50000000,
            current_savings: 3500000,
            target_date: "2048-12-31T00:00:00.000Z",
            monthly_contribution: 80000,
            progress: 7,
            priority: "high",
            status: "on_track",
          },
          {
            id: "goal_as_2",
            label: "Property Purchase",
            type: "house",
            target_amount: 8000000,
            current_savings: 1200000,
            target_date: "2030-12-31T00:00:00.000Z",
            monthly_contribution: 85000,
            progress: 15,
            priority: "high",
            status: "on_track",
          },
        ],
        financial_profile: {
          income: { total: 250000, salary: 220000, businessIncome: 0, rentalIncome: 0, investmentIncome: 30000, otherIncome: 0 },
          expenses: { total: 100000, housing: 40000, transportation: 12000, food: 20000, insurance: 10000, entertainment: 8000, education: 5000, healthcare: 5000, miscellaneous: 0 },
          debts: { homeLoan: 0, personalLoan: 0, vehicleLoan: 500000, creditCard: 0, educationLoan: 0, total: 500000, debtRatio: 0.11, totalEmi: 12000, emiBurden: 0.05, debtReductionProgress: 60 },
          emergency_fund: { current: 500000, recommended: 600000, coverageMonths: 5.0 },
          health_score: 85,
          savings_rate: 0.60,
          monthly_surplus: 150000,
        },
        risk_profile_data: {
          risk_level: "aggressive",
          risk_score: 82,
          investment_experience: "advanced",
          risk_capacity: "high",
          risk_tolerance: "high",
          financial_stability: "very_stable",
          investment_horizon: "long",
          recommended_allocation: { equity: 75, fixedIncome: 10, cash: 5, alternatives: 10, realEstate: 0 },
          suitable_categories: ["Mid & Small Cap Funds", "Direct Equities", "International Equities", "Alternative Investments"],
        },
        portfolio: {
          total_value: 4500000,
          total_cost: 3400000,
          total_return: 32.3,
          holdings: [
            { id: "h_as_1", name: "Bank Savings Account (Kotak)", ticker: "CASH-KOTAK", type: "cash", sector: "Cash & Equivalents", geography: "India", riskLevel: "low", costBasis: 500000, currentValue: 500000, returnPct: 4.0, quantity: 1 },
            { id: "h_as_2", name: "Corporate Fixed Deposits (Bajaj Finance)", ticker: "FD-BAJAJ", type: "fixed_deposit", sector: "NBFC / Debt", geography: "India", riskLevel: "low", costBasis: 200000, currentValue: 200000, returnPct: 8.0, quantity: 1 },
            { id: "h_as_3", name: "Axis Small Cap Fund", ticker: "AXIS-SC", type: "mutual_fund", sector: "Small Cap Equity", geography: "India", riskLevel: "high", costBasis: 700000, currentValue: 1000000, returnPct: 42.8, quantity: 12500 },
            { id: "h_as_4", name: "UTI Nifty 50 Index Fund", ticker: "UTI-NIFTY", type: "etf", sector: "Large Cap Index", geography: "India", riskLevel: "medium", costBasis: 800000, currentValue: 1000000, returnPct: 25.0, quantity: 6200 },
            { id: "h_as_5", name: "Direct Stocks (Reliance, Tata Motors, L&T)", ticker: "EQUITY-LARGE", type: "stock", sector: "Conglomerate & Auto", geography: "India", riskLevel: "high", costBasis: 1000000, currentValue: 1500000, returnPct: 50.0, quantity: 250 },
            { id: "h_as_6", name: "Sovereign Gold Bonds (RBI)", ticker: "SGB-2024", type: "gold", sector: "Precious Metals", geography: "India", riskLevel: "low", costBasis: 200000, currentValue: 300000, returnPct: 50.0, quantity: 48 },
          ],
        },
      },
    ];

    for (const c of clientsData) {
      console.log(`Populating client: ${c.name} (${c.id})...`);

      // Insert or update clients
      await client.query(
        `INSERT INTO clients (
          id, advisor_id, first_name, last_name, name, email, phone, status,
          risk_profile, age, occupation, location, net_worth, assets, liabilities,
          income, expenses, allocation, tags, joined_date, last_contact, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, now() - interval '90 days', now(), now()
        )
        ON CONFLICT (id) DO UPDATE SET
          advisor_id = EXCLUDED.advisor_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          status = EXCLUDED.status,
          risk_profile = EXCLUDED.risk_profile,
          age = EXCLUDED.age,
          occupation = EXCLUDED.occupation,
          location = EXCLUDED.location,
          net_worth = EXCLUDED.net_worth,
          assets = EXCLUDED.assets,
          liabilities = EXCLUDED.liabilities,
          income = EXCLUDED.income,
          expenses = EXCLUDED.expenses,
          allocation = EXCLUDED.allocation,
          tags = EXCLUDED.tags,
          updated_at = now()`,
        [
          c.id,
          primaryAdvisorId,
          c.first_name,
          c.last_name,
          c.name,
          c.email,
          c.phone,
          c.status,
          c.risk_profile,
          c.age,
          c.occupation,
          c.location,
          c.net_worth,
          c.assets,
          c.liabilities,
          c.income,
          c.expenses,
          JSON.stringify(c.allocation),
          JSON.stringify(c.tags),
        ]
      );

      // Financial profile
      await client.query(
        `INSERT INTO financial_profiles (
          id, client_id, income, expenses, debts, emergency_fund, health_score,
          savings_rate, monthly_surplus, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7, $8, now()
        )
        ON CONFLICT (client_id) DO UPDATE SET
          income = EXCLUDED.income,
          expenses = EXCLUDED.expenses,
          debts = EXCLUDED.debts,
          emergency_fund = EXCLUDED.emergency_fund,
          health_score = EXCLUDED.health_score,
          savings_rate = EXCLUDED.savings_rate,
          monthly_surplus = EXCLUDED.monthly_surplus,
          updated_at = now()`,
        [
          c.id,
          JSON.stringify(c.financial_profile.income),
          JSON.stringify(c.financial_profile.expenses),
          JSON.stringify(c.financial_profile.debts),
          JSON.stringify(c.financial_profile.emergency_fund),
          c.financial_profile.health_score,
          c.financial_profile.savings_rate,
          c.financial_profile.monthly_surplus,
        ]
      );

      // Risk profile
      await client.query(
        `INSERT INTO risk_profiles (
          id, client_id, risk_level, risk_score, investment_experience,
          risk_capacity, risk_tolerance, financial_stability, investment_horizon,
          recommended_allocation, suitable_categories, assessed_at, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, now(), now()
        )
        ON CONFLICT (client_id) DO UPDATE SET
          risk_level = EXCLUDED.risk_level,
          risk_score = EXCLUDED.risk_score,
          investment_experience = EXCLUDED.investment_experience,
          risk_capacity = EXCLUDED.risk_capacity,
          risk_tolerance = EXCLUDED.risk_tolerance,
          financial_stability = EXCLUDED.financial_stability,
          investment_horizon = EXCLUDED.investment_horizon,
          recommended_allocation = EXCLUDED.recommended_allocation,
          suitable_categories = EXCLUDED.suitable_categories,
          assessed_at = now(),
          updated_at = now()`,
        [
          c.id,
          c.risk_profile_data.risk_level,
          c.risk_profile_data.risk_score,
          c.risk_profile_data.investment_experience,
          c.risk_profile_data.risk_capacity,
          c.risk_profile_data.risk_tolerance,
          c.risk_profile_data.financial_stability,
          c.risk_profile_data.investment_horizon,
          JSON.stringify(c.risk_profile_data.recommended_allocation),
          JSON.stringify(c.risk_profile_data.suitable_categories),
        ]
      );

      // Portfolio data
      await client.query(
        `INSERT INTO portfolio_data (
          id, client_id, holdings, total_value, total_cost, total_return, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2::jsonb, $3, $4, $5, now()
        )
        ON CONFLICT (client_id) DO UPDATE SET
          holdings = EXCLUDED.holdings,
          total_value = EXCLUDED.total_value,
          total_cost = EXCLUDED.total_cost,
          total_return = EXCLUDED.total_return,
          updated_at = now()`,
        [
          c.id,
          JSON.stringify(c.portfolio.holdings),
          c.portfolio.total_value,
          c.portfolio.total_cost,
          c.portfolio.total_return,
        ]
      );

      // Client goals
      await client.query(`DELETE FROM client_goals WHERE client_id = $1`, [c.id]);
      for (const g of c.goals) {
        await client.query(
          `INSERT INTO client_goals (
            id, client_id, type, label, target_amount, current_savings,
            target_date, monthly_contribution, progress, priority, status, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now()
          )`,
          [
            g.id,
            c.id,
            g.type,
            g.label,
            g.target_amount,
            g.current_savings,
            g.target_date,
            g.monthly_contribution,
            g.progress,
            g.priority,
            g.status,
          ]
        );
      }

      // Sample upcoming appointment & sample note for realistic client view
      await client.query(`DELETE FROM appointments WHERE client_id = $1`, [c.id]);
      await client.query(
        `INSERT INTO appointments (id, client_id, client_name, title, type, start, duration, status, notes)
         VALUES (gen_random_uuid()::text, $1, $2, 'Quarterly Portfolio Review', 'video', now() + interval '3 days', 45, 'upcoming', 'Discuss asset allocation and goal progress.')`,
        [c.id, c.name]
      );

      await client.query(`DELETE FROM notes WHERE client_id = $1`, [c.id]);
      await client.query(
        `INSERT INTO notes (id, client_id, client_name, type, pinned, title, body)
         VALUES (gen_random_uuid()::text, $1, $2, 'private', true, 'Client Onboarding Note', 'Demo client initialized with complete financial goals, risk profile, and asset allocation.')`,
        [c.id, c.name]
      );

      // Seed Advisor Analysis
      let finAnalysis = "";
      let goalAnalysis = "";
      let overallAssessment = "";
      let summary = "";
      let adviceItems = [];

      if (c.id === "c_rahul_kulkarni") {
        finAnalysis = "The client has a stable IT salary (₹1.2L/month) with a 45% savings rate and moderate-growth risk profile (score 65). Liquid emergency fund is currently below the recommended 6-month threshold.";
        goalAnalysis = "Retirement (2056) is the primary long-term wealth goal. Emergency fund expansion (2027) and first house purchase (2032) are near-term milestones.";
        overallAssessment = "Prioritize establishing a 6-month emergency buffer before scaling equity SIPs, then automate monthly index and flexi-cap investments.";
        summary = `Hello Rahul, based on your financial position (Net Worth: ₹8.5L, Risk Profile: Moderate), your active goals, and your advisor Rahul Deshmukh's assessment: your customized wealth plan has been structured to optimize steady compound growth and capital insulation.`;
        adviceItems = [
          {
            title: "Emergency Liquidity Buffer Expansion",
            priority: "High",
            explanation: "Your advisor highlights establishing a full 6-month emergency reserve (₹3.3L) to safeguard your family against unexpected expenses without liquidating long-term investments.",
            action: "Allocate ₹12,000 monthly into high-yield liquid mutual funds and auto-sweep fixed deposits until target is reached.",
            relatedGoal: "Emergency Fund",
          },
          {
            title: "House Down-Payment Capital Accumulation",
            priority: "High",
            explanation: "Your advisor recommends ensuring adequate down-payment liquidity and debt comfort before committing to home purchase in 2032.",
            action: "Systematically accumulate required capital in safe, medium-term hybrid funds and multi-asset allocation instruments.",
            relatedGoal: "House Purchase",
          },
          {
            title: "Long-Term Retirement Compounding Strategy",
            priority: "Medium",
            explanation: "Retirement requires steady long-term compounding across diversified equities to outpace inflation over your 30-year horizon.",
            action: "Automate a dedicated monthly SIP of ₹20,000 across Nifty 50 Index and Flexi-Cap mutual funds.",
            relatedGoal: "Retirement",
          },
        ];
      } else if (c.id === "c_priya_patil") {
        finAnalysis = "The client is a business owner with substantial real estate assets and moderate risk tolerance (score 50). The debt ratio is 40% due to home loan liabilities.";
        goalAnalysis = "Children Education (2035) and Retirement (2045) are primary family goals. Home Loan Reduction (2030) is high priority to reduce recurring EMI burden.";
        overallAssessment = "Balance real estate illiquidity by increasing hybrid equity and debt fund allocations, while aggressively prepaying home loan principal.";
        summary = `Hello Priya, based on your financial position (Net Worth: ₹37L, Risk Profile: Moderate), your active goals, and your advisor Rahul Deshmukh's assessment: your customized wealth plan has been structured to improve liquidity and systematically reduce debt.`;
        adviceItems = [
          {
            title: "Home Loan Principal Prepayment Acceleration",
            priority: "High",
            explanation: "Your advisor highlights high-interest debt reduction as a crucial step to lower monthly EMI burden and improve monthly surplus.",
            action: "Accelerate principal prepayments by allocating ₹30,000 monthly toward the home loan to save substantial interest outlay.",
            relatedGoal: "Home Loan Reduction",
          },
          {
            title: "Children Higher Education Milestone Fund",
            priority: "High",
            explanation: "Your advisor recognizes education funding as an essential milestone that requires capital preservation combined with inflation-beating growth.",
            action: "Maintain ₹20,000 monthly SIP into balanced advantage and hybrid equity funds targeting 2035.",
            relatedGoal: "Children Education",
          },
          {
            title: "Retirement Corpus & Liquidity Diversification",
            priority: "High",
            explanation: "Your advisor recommends balancing your property-heavy portfolio with liquid financial assets for post-retirement flexibility.",
            action: "Deploy ₹45,000 monthly into multi-asset allocation funds, Sovereign Gold Bonds, and flexi-cap equities.",
            relatedGoal: "Retirement",
          },
        ];
      } else {
        finAnalysis = "The client has strong cash flow with high monthly savings (₹1.5L/month) and aggressive risk tolerance (score 82). The current asset allocation has good equity participation but high liability in vehicle debt.";
        goalAnalysis = "Early Retirement (2048) is the primary ambitious goal requiring aggressive equity compounding. Property Purchase (2030) is the intermediate goal requiring dedicated down-payment accumulation.";
        overallAssessment = "Optimize surplus deployment into high-growth equity funds, accelerate vehicle debt reduction, and maintain structured goal-based SIPs.";
        summary = `Hello Amit, based on your financial position (Net Worth: ₹40L, Risk Profile: Aggressive), your active goals, and your advisor Rahul Deshmukh's assessment: your customized wealth plan has been structured for high-growth compounding and strategic asset accumulation.`;
        adviceItems = [
          {
            title: "Aggressive Early Retirement Portfolio Strategy",
            priority: "High",
            explanation: "Your advisor has prioritized retirement planning as a primary long-term objective requiring focused accumulation and portfolio growth.",
            action: "Deploy ₹80,000 monthly into small-cap and mid-cap equity mutual funds, direct bluechip equities, and index ETFs.",
            relatedGoal: "Early Retirement",
          },
          {
            title: "Prime Property Purchase Down-Payment Fund",
            priority: "High",
            explanation: "Your advisor recommends building a dedicated liquid fund for the 2030 Mumbai property acquisition to minimize future mortgage leverage.",
            action: "Direct ₹85,000 monthly into short-term corporate debt funds, arbitrage funds, and fixed deposits.",
            relatedGoal: "Property Purchase",
          },
          {
            title: "Vehicle Debt Clearance & Cash Flow Optimization",
            priority: "Medium",
            explanation: "Your advisor suggests clearing the ₹5L vehicle loan ahead of schedule to free up an additional ₹12,000 in monthly disposable income.",
            action: "Utilize annual performance bonus or surplus savings to eliminate the vehicle loan within the next 12 months.",
            relatedGoal: "Overall Wealth Strategy",
          },
        ];
      }

      // Upsert advisor_analyses
      await client.query(`DELETE FROM advisor_analyses WHERE client_id = $1`, [c.id]);
      await client.query(
        `INSERT INTO advisor_analyses (
          id, advisor_id, client_id, financial_situation_analysis, goal_analysis, overall_assessment, created_at, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, now(), now()
        )`,
        [primaryAdvisorId, c.id, finAnalysis, goalAnalysis, overallAssessment]
      );

      // Upsert advisor_advice
      await client.query(`DELETE FROM advisor_advice WHERE client_id = $1`, [c.id]);
      await client.query(
        `INSERT INTO advisor_advice (
          id, advisor_id, client_id, summary, advice, raw_input, created_at, updated_at
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::jsonb, now(), now()
        )`,
        [
          primaryAdvisorId,
          c.id,
          summary,
          JSON.stringify(adviceItems),
          JSON.stringify({
            advisorAnalysis: { finAnalysis, goalAnalysis, overallAssessment },
            generatedAt: new Date().toISOString(),
          }),
        ]
      );

      // Sync into recommendations
      await client.query(`DELETE FROM recommendations WHERE client_id = $1`, [c.id]);
      for (const item of adviceItems) {
        const cat = item.relatedGoal.toLowerCase().includes("retire")
          ? "retirement"
          : item.relatedGoal.toLowerCase().includes("emergency")
          ? "emergency_fund"
          : item.relatedGoal.toLowerCase().includes("tax")
          ? "tax"
          : item.relatedGoal.toLowerCase().includes("loan") || item.relatedGoal.toLowerCase().includes("debt")
          ? "debt"
          : "investment";

        await client.query(
          `INSERT INTO recommendations (
            id, client_id, category, title, priority, explanation, expected_benefit, estimated_timeline, status, created_at, updated_at
          ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, 'pending', now(), now()
          )`,
          [
            c.id,
            cat,
            item.title,
            item.priority.toLowerCase(),
            item.explanation,
            item.action,
            `Aligned with ${item.relatedGoal}`,
          ]
        );
      }
    }

    console.log("All 3 clients successfully populated with complete financial, goal, and risk data!");
  } catch (err) {
    console.error("Error during seed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
