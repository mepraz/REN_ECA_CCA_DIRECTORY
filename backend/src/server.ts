import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnect } from "./lib/mongodb.js";
import authRoutes from "./routes/auth.js";
import organizationRoutes from "./routes/organization.js";

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Middlewares
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Connection to DB
dbConnect().catch((err) => {
  console.error("Failed to connect to database on startup:", err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
