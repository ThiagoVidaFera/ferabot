-- CreateTable
CREATE TABLE "CampanhaGrupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" INTEGER NOT NULL,
    "campanha" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'send_text',
    "alvo" TEXT NOT NULL DEFAULT 'all',
    "texto" TEXT NOT NULL,
    "agendadoPara" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimoErro" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EntregaGrupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externoId" INTEGER NOT NULL,
    "campanhaId" TEXT NOT NULL,
    "groupId" TEXT,
    "jid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detalhe" TEXT,
    "concluidoEm" DATETIME,
    CONSTRAINT "EntregaGrupo_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "CampanhaGrupo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntregaGrupo_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvioDiario" (
    "dia" TEXT NOT NULL PRIMARY KEY,
    "enviados" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fonte" TEXT NOT NULL DEFAULT 'waha',
    "tamanho" INTEGER NOT NULL DEFAULT 0,
    "ehAdmin" BOOLEAN NOT NULL DEFAULT false,
    "fotoUrl" TEXT,
    "syncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Group" ("ativo", "createdAt", "externalId", "id", "name") SELECT "ativo", "createdAt", "externalId", "id", "name" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_externalId_key" ON "Group"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CampanhaGrupo_jobId_key" ON "CampanhaGrupo"("jobId");

-- CreateIndex
CREATE INDEX "CampanhaGrupo_status_idx" ON "CampanhaGrupo"("status");

-- CreateIndex
CREATE INDEX "CampanhaGrupo_agendadoPara_idx" ON "CampanhaGrupo"("agendadoPara");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaGrupo_externoId_key" ON "EntregaGrupo"("externoId");

-- CreateIndex
CREATE INDEX "EntregaGrupo_campanhaId_idx" ON "EntregaGrupo"("campanhaId");

-- CreateIndex
CREATE INDEX "EntregaGrupo_status_idx" ON "EntregaGrupo"("status");
