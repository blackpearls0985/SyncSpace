-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'FREE';
