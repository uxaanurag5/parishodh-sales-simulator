-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CriterionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "criterionKey" TEXT NOT NULL,
    "met" BOOLEAN NOT NULL,
    "evidence" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CriterionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SimSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CriterionResult" ("criterionKey", "evidence", "id", "met", "score", "sessionId") SELECT "criterionKey", "evidence", "id", "met", "score", "sessionId" FROM "CriterionResult";
DROP TABLE "CriterionResult";
ALTER TABLE "new_CriterionResult" RENAME TO "CriterionResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
