import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL ?? "file:./data/crm.db" },
  migrations: { path: "prisma/migrations", seed: "npx tsx prisma/seed.ts" },
});
