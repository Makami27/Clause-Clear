import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { chatAboutContract } from "../services/ai";
import { aiRateLimit } from "../middleware/rateLimit";

const router = Router();

const messageSchema = z.object({
  contractId: z.string(),
  sessionId: z.string().optional(),
  question: z.string().min(1),
});

router.post("/message", requireAuth, aiRateLimit, async (req: AuthedRequest, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { contractId, sessionId, question } = parsed.data;

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, userId: req.userId },
  });
  if (!contract || !contract.rawText) {
    return res.status(404).json({ error: "Contract not found" });
  }

  let session = sessionId
    ? await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: req.userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: req.userId!, contractId },
      include: { messages: true },
    });
  }

  const history = session.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const answer = await chatAboutContract(contract.rawText, history, question);

  await prisma.chatMessage.createMany({
    data: [
      { sessionId: session.id, role: "user", content: question },
      { sessionId: session.id, role: "assistant", content: answer },
    ],
  });

  res.json({ sessionId: session.id, answer });
});

export default router;
