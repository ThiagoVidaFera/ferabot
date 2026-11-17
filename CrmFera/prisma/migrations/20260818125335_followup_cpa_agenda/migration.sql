-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "agenda" TEXT;
ALTER TABLE "Agent" ADD COLUMN "alvo" TEXT;
ALTER TABLE "Agent" ADD COLUMN "ultimaRodada" DATETIME;

-- CreateTable
CREATE TABLE "CustoAds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "origem" TEXT NOT NULL,
    "campanha" TEXT,
    "custoCents" INTEGER NOT NULL,
    "impressoes" INTEGER NOT NULL DEFAULT 0,
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "fonte" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "detalhe" TEXT,
    "enviadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CustoAds_externalId_key" ON "CustoAds"("externalId");

-- CreateIndex
CREATE INDEX "CustoAds_data_idx" ON "CustoAds"("data");

-- CreateIndex
CREATE INDEX "CustoAds_origem_idx" ON "CustoAds"("origem");

-- CreateIndex
CREATE UNIQUE INDEX "CustoAds_data_origem_campanha_key" ON "CustoAds"("data", "origem", "campanha");

-- CreateIndex
CREATE INDEX "Notificacao_enviadaEm_idx" ON "Notificacao"("enviadaEm");

-- CreateIndex
CREATE UNIQUE INDEX "Notificacao_tipo_chave_key" ON "Notificacao"("tipo", "chave");
