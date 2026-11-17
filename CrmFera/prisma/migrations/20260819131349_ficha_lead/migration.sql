-- CreateTable
CREATE TABLE "Ficha" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT,
    "dados" JSONB NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" DATETIME NOT NULL,
    "aberturas" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "Ficha_expiraEm_idx" ON "Ficha"("expiraEm");
