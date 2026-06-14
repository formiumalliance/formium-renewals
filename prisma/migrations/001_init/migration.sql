-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER');

CREATE TYPE "DomainStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');

CREATE TYPE "AmcType" AS ENUM ('WEBSITE_MAINTENANCE', 'SEO', 'ADS_MANAGEMENT', 'HOSTING', 'DOMAIN_MANAGEMENT', 'CUSTOM');

CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING');

CREATE TYPE "AmcStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');

CREATE TYPE "ActivityType" AS ENUM ('DOMAIN_ADDED', 'DOMAIN_UPDATED', 'DOMAIN_DELETED', 'AMC_ADDED', 'AMC_UPDATED', 'AMC_DELETED', 'AMC_RENEWED', 'REMINDER_SENT', 'CLIENT_UPDATED');

CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

CREATE TYPE "EmailType" AS ENUM ('DOMAIN_EXPIRY_30', 'DOMAIN_EXPIRY_15', 'DOMAIN_EXPIRY_7', 'DOMAIN_EXPIRED', 'AMC_EXPIRY_30', 'AMC_EXPIRY_15', 'AMC_EXPIRY_7', 'AMC_EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "registrar" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "creationDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "domainCost" DOUBLE PRECISION,
    "loginUrl" TEXT,
    "notes" TEXT,
    "status" "DomainStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmcContract" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amcType" "AmcType" NOT NULL,
    "customType" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "status" "AmcStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AmcContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "domainId" TEXT,
    "amcContractId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL DEFAULT 'hello@formium.in',
    "additionalEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainAlerts" BOOLEAN NOT NULL DEFAULT true,
    "amcAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AmcContract" ADD CONSTRAINT "AmcContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_amcContractId_fkey" FOREIGN KEY ("amcContractId") REFERENCES "AmcContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
