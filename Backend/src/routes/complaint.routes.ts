import express from "express";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { complaints, users } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { generateFollowUpQuestion } from "../utils/ai.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// POST /api/ai/question
router.post("/ai/question", authenticateToken, async (req: Request, res: Response) => {
  const { complaint_text } = req.body;

  if (!complaint_text) {
    return res.status(400).json({ error: "Complaint text is required." });
  }

  try {
    const question = await generateFollowUpQuestion(complaint_text);
    res.json({ question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate AI question." });
  }
});

// POST /api/complaints
router.post("/complaints", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { complaint_text, ai_question, user_answer } = req.body;

  if (!complaint_text || !ai_question || !user_answer) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [newComplaint] = await db.insert(complaints).values({
      userId: req.user!.id,
      complaintText: complaint_text,
      aiQuestion: ai_question,
      userAnswer: user_answer,
    }).returning();

    res.json(newComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save complaint." });
  }
});

// GET /api/complaints/my
router.get("/complaints/my", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userComplaints = await db.query.complaints.findMany({
      where: eq(complaints.userId, req.user!.id),
      orderBy: [desc(complaints.created_at)],
    });
    res.json(userComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// GET /api/admin/complaints
router.get("/admin/complaints", authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const allComplaints = await db.select({
      id: complaints.id,
      complaintText: complaints.complaintText,
      aiQuestion: complaints.aiQuestion,
      userAnswer: complaints.userAnswer,
      created_at: complaints.created_at,
      userName: users.name,
      userEmail: users.email,
    })
    .from(complaints)
    .innerJoin(users, eq(complaints.userId, users.id))
    .orderBy(desc(complaints.created_at));

    res.json(allComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch all complaints." });
  }
});

export default router;
