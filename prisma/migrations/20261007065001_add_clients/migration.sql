-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientId" TEXT;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create one client per distinct existing project client name and link the projects.
INSERT INTO "Client" ("id", "name", "updatedAt")
SELECT 'c' || substr(md5(random()::text || "clientName"), 1, 24), "clientName", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT trim("clientName") AS "clientName" FROM "Project" WHERE trim("clientName") <> '') AS names
ON CONFLICT ("name") DO NOTHING;

UPDATE "Project" p SET "clientId" = c."id" FROM "Client" c WHERE c."name" = trim(p."clientName") AND p."clientId" IS NULL;
