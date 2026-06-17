-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageKey" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL,
    "socialAccountId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "post_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "posts_userId_scheduledAt_idx" ON "posts"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "media_assets_postId_idx" ON "media_assets"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "post_publications_postId_socialAccountId_key" ON "post_publications"("postId", "socialAccountId");

-- CreateIndex
CREATE INDEX "post_publications_status_scheduledAt_idx" ON "post_publications"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
