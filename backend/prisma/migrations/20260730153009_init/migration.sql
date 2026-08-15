-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'client',
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "segment" TEXT NOT NULL DEFAULT 'Mass Market',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "user_id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "risk_profile" TEXT NOT NULL DEFAULT 'Balanced',
    "display_currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "household_profiles" (
    "user_id" TEXT NOT NULL,
    "marital_status" TEXT NOT NULL DEFAULT 'Single',
    "occupation" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "household_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TEXT NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_profiles" (
    "user_id" TEXT NOT NULL,
    "salary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "business" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "rental" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "other" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "income_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "insurance_profiles" (
    "user_id" TEXT NOT NULL,
    "life_coverage" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "health_coverage" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "disability_coverage_monthly" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "has_long_term_care" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "insurance_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "assumptions" (
    "user_id" TEXT NOT NULL,
    "inflation_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.03,
    "expected_return" DECIMAL(6,4) NOT NULL DEFAULT 0.07,
    "retirement_inflation" DECIMAL(6,4) NOT NULL DEFAULT 0.04,
    "education_inflation" DECIMAL(6,4) NOT NULL DEFAULT 0.06,

    CONSTRAINT "assumptions_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liabilities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "outstanding_balance" DECIMAL(14,2) NOT NULL,
    "interest_rate" DECIMAL(6,4) NOT NULL,
    "monthly_payment" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "liabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whs_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "net_worth" DECIMAL(14,2) NOT NULL,
    "monthly_savings" DECIMAL(14,2) NOT NULL,
    "savings_rate" DECIMAL(6,4) NOT NULL,
    "emergency_fund_coverage" DECIMAL(6,4) NOT NULL,
    "retirement_readiness" DECIMAL(6,4) NOT NULL,
    "goal_funding_status" DECIMAL(6,4) NOT NULL,
    "insurance_adequacy" DECIMAL(6,4) NOT NULL,
    "debt_ratio" DECIMAL(6,4) NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "whs_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor_client_consent" (
    "id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,

    CONSTRAINT "advisor_client_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "current_value" DECIMAL(14,2) NOT NULL,
    "is_liquid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "target_amount" DECIMAL(14,2) NOT NULL,
    "target_year" INTEGER NOT NULL,
    "already_saved" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "monthly_contribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "shortfall" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "alert_message" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expected_benefit" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "related_goal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_suitability_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "suitability_rationale" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_suitability_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_client_consent_advisor_id_client_id_key" ON "advisor_client_consent"("advisor_id", "client_id");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_profiles" ADD CONSTRAINT "household_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_profiles" ADD CONSTRAINT "income_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_profiles" ADD CONSTRAINT "insurance_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assumptions" ADD CONSTRAINT "assumptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whs_history" ADD CONSTRAINT "whs_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_client_consent" ADD CONSTRAINT "advisor_client_consent_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor_client_consent" ADD CONSTRAINT "advisor_client_consent_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_alerts" ADD CONSTRAINT "recommendation_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_alerts" ADD CONSTRAINT "recommendation_alerts_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_suitability_logs" ADD CONSTRAINT "compliance_suitability_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_suitability_logs" ADD CONSTRAINT "compliance_suitability_logs_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
