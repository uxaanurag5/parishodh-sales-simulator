/*
  Warnings:

  - Added the required column `improvements` to the `CapabilityReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strengths` to the `CapabilityReport` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CapabilityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapabilityReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SimSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CapabilityReport" ("dimensions", "id", "overallScore", "sessionId", "verdict") SELECT "dimensions", "id", "overallScore", "sessionId", "verdict" FROM "CapabilityReport";
DROP TABLE "CapabilityReport";
ALTER TABLE "new_CapabilityReport" RENAME TO "CapabilityReport";
CREATE UNIQUE INDEX "CapabilityReport_sessionId_key" ON "CapabilityReport"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
