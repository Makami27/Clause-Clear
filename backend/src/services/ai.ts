import Anthropic from "@anthropic-ai/sdk";
import { getActivePrompt, TaskType } from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export interface RedFlagResult {
  clauseText: string;
  issue: string;
  explanation: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
  clauseLocation?: string;
}

export interface AnalysisResult {
  summary: string;
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  keyTerms: { term: string; explanation: string }[];
}

async function callClaude(taskType: TaskType, userContent: string): Promise<string> {
  const prompt = getActivePrompt(taskType);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: prompt.systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

function extractJson<T>(raw: string): T {
  // Claude may wrap JSON in markdown fences despite instructions — strip them.
  const cleaned = raw.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function analyzeContract(contractText: string): Promise<AnalysisResult> {
  const userContent = `Analyze this contract. Respond with ONLY valid JSON, no preamble, matching this shape:
{
  "summary": string,
  "overallRisk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "keyTerms": [{ "term": string, "explanation": string }]
}

CONTRACT TEXT:
${contractText}`;

  const raw = await callClaude("analysis", userContent);
  return extractJson<AnalysisResult>(raw);
}

export async function detectRedFlags(contractText: string): Promise<RedFlagResult[]> {
  const userContent = `Scan this contract for red flags. Respond with ONLY valid JSON, no preamble, matching this shape:
{
  "redFlags": [
    {
      "clauseText": string,
      "issue": string,
      "explanation": string,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "recommendation": string,
      "clauseLocation": string
    }
  ]
}

CONTRACT TEXT:
${contractText}`;

  const raw = await callClaude("red_flags", userContent);
  const parsed = extractJson<{ redFlags: RedFlagResult[] }>(raw);
  return parsed.redFlags;
}

export async function chatAboutContract(
  contractText: string,
  history: { role: "user" | "assistant"; content: string }[],
  question: string
): Promise<string> {
  const prompt = getActivePrompt("chat");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `${prompt.systemPrompt}\n\nCONTRACT TEXT:\n${contractText}`,
    messages: [...history, { role: "user", content: question }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}
