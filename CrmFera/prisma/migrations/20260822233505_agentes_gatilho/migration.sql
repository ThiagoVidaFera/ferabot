-- Gatilhos do agente (playbook dos agentes, 2026-08-22).
-- ADD COLUMN em vez do RedefineTables que o Prisma gera: mesmo resultado,
-- sem recriar a tabela que AgentAction e AgentPromptVersion referenciam.
ALTER TABLE "Agent" ADD COLUMN "gatilhoTag" TEXT;
ALTER TABLE "Agent" ADD COLUMN "gatilhoEstagio" TEXT;
ALTER TABLE "Agent" ADD COLUMN "gatilhoOrigem" TEXT;
ALTER TABLE "Agent" ADD COLUMN "prioridade" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agent" ADD COLUMN "delayQuebraMs" INTEGER NOT NULL DEFAULT 2500;
