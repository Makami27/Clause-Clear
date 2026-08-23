import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { extractText } from "../services/extract";
import { analyzeContract, detectRedFlags } from "../services/ai";
import { aiRateLimit, uploadRateLimit } from "../middleware/rateLimit";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file."));
    }
    cb(null, true);
  },
});

const FREE_MONTHLY_LIMIT = 3;

router.post("/upload", requireAuth, uploadRateLimit, upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  if (user.plan === "FREE" && user.contractsUsedThisMonth >= FREE_MONTHLY_LIMIT) {
    return res.status(403).json({
      error: `Free plan limit reached (${FREE_MONTHLY_LIMIT}/month). Upgrade to analyze more contracts.`,
    });
  }

  let rawText: string;
  try {
    rawText = await extractText(req.file.buffer, req.file.mimetype);
  } catch (err) {
    return res.status(422).json({ error: "Could not read text from this file. It may be scanned/image-based." });
  }

  if (rawText.trim().length < 50) {
    return res.status(422).json({ error: "This file doesn't contain enough readable text to analyze." });
  }

  const contract = await prisma.contract.create({
    data: {
      userId: req.userId!,
      fileName: req.file.originalname,
      fileUrl: "", // populate once real object storage (S3/R2) is wired up
      fileType: req.file.mimetype,
      rawText,
      status: "UPLOADED",
    },
  });

  await prisma.user.update({
    where: { id: req.userId },
    data: { contractsUsedThisMonth: { increment: 1 } },
  });

  res.status(201).json({ contract: { id: contract.id, fileName: contract.fileName, status: contract.status } });
});

router.post("/:id/analyze", requireAuth, aiRateLimit, async (req: AuthedRequest, res) => {
  const contract = await prisma.contract.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }
  if (!contract.rawText) {
    return res.status(422).json({ error: "Contract has no extracted text to analyze" });
  }

  await prisma.contract.update({ where: { id: contract.id }, data: { status: "PROCESSING" } });

  try {
    const [analysis, redFlags] = await Promise.all([
      analyzeContract(contract.rawText),
      detectRedFlags(contract.rawText),
    ]);

    await prisma.$transaction([
      prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: "ANALYZED",
          summary: analysis.summary,
          overallRisk: analysis.overallRisk,
        },
      }),
      prisma.redFlag.deleteMany({ where: { contractId: contract.id } }),
      ...redFlags.map((flag) =>
        prisma.redFlag.create({
          data: {
            contractId: contract.id,
            clauseText: flag.clauseText,
            issue: flag.issue,
            explanation: flag.explanation,
            riskLevel: flag.riskLevel,
            recommendation: flag.recommendation,
            clauseLocation: flag.clauseLocation,
          },
        })
      ),
    ]);

    res.json({ status: "ANALYZED", summary: analysis.summary, overallRisk: analysis.overallRisk, redFlagCount: redFlags.length });
  } catch (err) {
    await prisma.contract.update({ where: { id: contract.id }, data: { status: "FAILED" } });
    console.error("Analysis failed:", err);
    res.status(502).json({ error: "Analysis failed. Please try again." });
  }
});

router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const contract = await prisma.contract.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { redFlags: true },
  });
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }
  res.json({ contract });
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const contracts = await prisma.contract.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true, status: true, overallRisk: true, createdAt: true },
  });
  res.json({ contracts });
});

export default router;
