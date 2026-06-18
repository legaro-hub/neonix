-- AlterTable
ALTER TABLE "media_assets" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_settings" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "post_publications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "social_accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_stats" (
    "id" UUID NOT NULL,
    "socialAccountId" UUID NOT NULL,
    "memberCount" INTEGER,
    "title" TEXT,
    "username" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "channel_stats_socialAccountId_createdAt_idx" ON "channel_stats"("socialAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_stats" ADD CONSTRAINT "channel_stats_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
