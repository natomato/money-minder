-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "stopDate" DATETIME NOT NULL,
    "savings" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Chart_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "amountPerYr" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "chartId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Moment_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
