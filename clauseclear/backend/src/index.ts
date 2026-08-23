import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import contractRoutes from "./routes/contracts";
import chatRoutes from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/chat", chatRoutes);

// Central error handler — catches thrown errors from async route handlers
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`ClauseClear API listening on port ${PORT}`);
});
