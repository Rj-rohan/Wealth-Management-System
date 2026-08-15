-- Markets workspace merge
-- Adds the three entities the Markets/Research features need, all keyed to the
-- existing users table so a single account owns planning and markets data.

-- CreateTable
CREATE TABLE "investor_profiles" (
    "user_id" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "risk_appetite" TEXT NOT NULL,
    "horizon" INTEGER NOT NULL,
    "monthly_investment" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "goal" TEXT NOT NULL,
    "existing_portfolio" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "buffett_advice" TEXT NOT NULL,
    "equity_allocation" INTEGER NOT NULL,
    "debt_allocation" INTEGER NOT NULL,
    "gold_allocation" INTEGER NOT NULL,
    "max_stock_pe" INTEGER NOT NULL,
    "min_dividend_yield" DECIMAL(6,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tracker_holdings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "buy_price" DECIMAL(14,2) NOT NULL,
    "current_price" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "assessed_on" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracker_holdings_user_id_idx" ON "tracker_holdings"("user_id");

-- CreateIndex
CREATE INDEX "watchlist_items_user_id_idx" ON "watchlist_items"("user_id");

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_holdings" ADD CONSTRAINT "tracker_holdings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
