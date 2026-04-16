import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sessionRoutes from "./routes/session";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to accept localhost on any port for development
const corsOrigin = process.env.FRONTEND_URL || /(localhost|127\.0\.0\.1)/;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/api/session", sessionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
