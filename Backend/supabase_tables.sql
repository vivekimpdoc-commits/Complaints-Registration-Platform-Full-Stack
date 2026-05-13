-- Supabase SQL Editor Script for Complaints Registration Platform

-- 1. Create 'users' table
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" varchar(255) NOT NULL,
  "password" text NOT NULL,
  "role" varchar(20) DEFAULT 'user' NOT NULL,
  "otp" varchar(6),
  "otp_expiry" timestamp,
  "is_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- 2. Create 'complaints' table
CREATE TABLE IF NOT EXISTS "complaints" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "complaint_text" text NOT NULL,
  "ai_question" text NOT NULL,
  "user_answer" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "complaints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
