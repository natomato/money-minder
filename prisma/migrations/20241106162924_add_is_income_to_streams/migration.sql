/*
  Warnings:

  - Added the required column `isIncome` to the `Stream` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "amountPerYr" INTEGER NOT NULL,
    "isIncome" BOOLEAN NOT NULL,
    "streamBoundary" TEXT NOT NULL,
    "startDate" DATETIME,
    "stopDate" DATETIME,
    "startMomentId" TEXT,
    "stopMomentId" TEXT,
    "setDuration" INTEGER,
    "chartId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stream_startMomentId_fkey" FOREIGN KEY ("startMomentId") REFERENCES "Moment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stream_stopMomentId_fkey" FOREIGN KEY ("stopMomentId") REFERENCES "Moment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stream_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stream" ("amountPerYr", "chartId", "color", "createdAt", "id", "name", "setDuration", "startDate", "startMomentId", "stopDate", "stopMomentId", "streamBoundary", "updatedAt") SELECT "amountPerYr", "chartId", "color", "createdAt", "id", "name", "setDuration", "startDate", "startMomentId", "stopDate", "stopMomentId", "streamBoundary", "updatedAt" FROM "Stream";
DROP TABLE "Stream";
ALTER TABLE "new_Stream" RENAME TO "Stream";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
