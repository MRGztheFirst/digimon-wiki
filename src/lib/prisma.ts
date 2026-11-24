import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

export function createPrisma() {
  const adapter = new PrismaBetterSqlite3(
    { url: process.env.DATABASE_URL ?? "file:./prisma/dev.db", readonly: !!process.env.VERCEL },
    { timestampFormat: "unixepoch-ms" },
  );
  return new PrismaClient({ adapter });
}
