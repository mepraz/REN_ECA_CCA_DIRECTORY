import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnect } from "./lib/mongodb.js";
import authRoutes from "./routes/auth.js";
import organizationRoutes from "./routes/organization.js";
import userRoutes from "./routes/user.js";
import eventRoutes from "./routes/event.js";
import googleRoutes from "./routes/google.js";
import { getEventUploadRoot } from "./lib/uploadPath.js";
const app = express();
const PORT = process.env.PORT || 5e3;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const uploadRoot = getEventUploadRoot();
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads/events", express.static(uploadRoot));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/google", googleRoutes);
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    uptime: process.uptime()
  });
});

const startServer = async () => {
  try {
    await dbConnect();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database on startup:", err);
    process.exit(1);
  }
};

startServer();
