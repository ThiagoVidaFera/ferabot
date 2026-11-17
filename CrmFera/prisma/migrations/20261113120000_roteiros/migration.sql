-- CreateTable
CREATE TABLE "Roteiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "titulo" TEXT NOT NULL,
    "headline" TEXT,
    "palavra" TEXT,
    "mecanica" TEXT,
    "origem" TEXT,
    "beats" TEXT NOT NULL DEFAULT '[]',
    "pendencias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'a_gravar',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Roteiro_slug_key" ON "Roteiro"("slug");

-- CreateIndex
CREATE INDEX "Roteiro_conta_status_idx" ON "Roteiro"("conta", "status");
