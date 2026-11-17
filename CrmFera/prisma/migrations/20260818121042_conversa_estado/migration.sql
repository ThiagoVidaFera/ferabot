-- CreateTable
CREATE TABLE "ConversationState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'andamento',
    "ator" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConversationState_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationState_contactId_key" ON "ConversationState"("contactId");

-- CreateIndex
CREATE INDEX "ConversationState_estado_idx" ON "ConversationState"("estado");
