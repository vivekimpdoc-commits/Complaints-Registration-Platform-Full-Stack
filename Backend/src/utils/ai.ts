import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateFollowUpQuestion = async (complaintText: string) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a helpful assistant for a complaint registration platform. Given the following complaint text, generate exactly one short follow-up question to gather more relevant details about the issue.
  
  Complaint: "${complaintText}"
  
  Follow-up question:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};
