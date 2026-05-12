import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  // throw new Error("DATABASE_URL is not set");
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

const queryClient = postgres(process.env.DATABASE_URL || "");
export const db = drizzle(queryClient, { schema });
