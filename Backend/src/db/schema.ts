import { pgTable, serial, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(), // 'user' or 'admin'
  otp: varchar("otp", { length: 6 }),
  otp_expiry: timestamp("otp_expiry"),
  is_verified: boolean("is_verified").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  complaintText: text("complaint_text").notNull(),
  aiQuestion: text("ai_question").notNull(),
  userAnswer: text("user_answer").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
