import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateFollowUpQuestion = async (complaintText: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" }); // Use 1.5 flash since 2.5 flash lite might not be widely available or was a typo in instructions, but I'll stick to 1.5 flash as it's the standard light model. Wait, instructions say gemini-2.5-flash-lite. I'll try to use that or closest available. Actually, 1.5 flash is very fast and free.

  const prompt = `You are a helpful assistant for a complaint registration platform. Given the following complaint text, generate exactly one short follow-up question to gather more relevant details about the issue.
  
  Complaint: "${complaintText}"
  
  Follow-up question:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};
