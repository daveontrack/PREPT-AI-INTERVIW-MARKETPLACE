-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN "stripeInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_stripeInvoiceId_key" ON "CreditTransaction"("stripeInvoiceId");
