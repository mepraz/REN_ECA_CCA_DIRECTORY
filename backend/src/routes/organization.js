import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticateUser, requireRole } from "../middleware/auth.js";
import { UserRole } from "../models/User.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import mongoose from "mongoose";
const router = Router();
router.use(authenticateUser);
router.use(requireRole([UserRole.MAIN_ADMIN]));
router.get("/", async (req, res) => {
  try {
    const orgs = await Organization.find().populate("adminId", "name email isActive").sort({ createdAt: -1 });
    return res.status(200).json(orgs);
  } catch (error) {
    console.error("List Organizations Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { name, address, email, adminName, adminEmail, password } = req.body;
    if (!name || !address || !adminName || !adminEmail || !password) {
      return res.status(400).json({ error: "All fields except organization email are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() }).session(session);
    if (existingUser) {
      return res.status(400).json({ error: "Admin email is already registered" });
    }
    const orgId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new User({
      _id: userId,
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: UserRole.COLLEGE_ADMIN,
      organizationId: String(orgId),
      isActive: true
    });
    const newOrg = new Organization({
      _id: orgId,
      name,
      address,
      email: email ? email.toLowerCase() : void 0,
      isActive: true,
      adminId: userId,
      totalEvents: 0,
      totalImages: 0
    });
    await newAdmin.save({ session });
    await newOrg.save({ session });
    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({
      message: "Organization and College Admin created successfully",
      organization: newOrg,
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create Organization Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, email } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }
    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    org.name = name;
    org.address = address;
    org.email = email ? email.toLowerCase() : void 0;
    await org.save();
    return res.status(200).json({
      message: "Organization updated successfully",
      organization: org
    });
  } catch (error) {
    console.error("Edit Organization Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.patch("/:id/status", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    const org = await Organization.findById(id).session(session);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const newStatus = !org.isActive;
    org.isActive = newStatus;
    await org.save({ session });
    if (org.adminId) {
      await User.findByIdAndUpdate(
        org.adminId,
        { isActive: newStatus },
        { session }
      );
    }
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      message: `Organization is now ${newStatus ? "activated" : "deactivated"}`,
      isActive: newStatus
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Toggle Organization Status Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const org = await Organization.findById(id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const adminUser = await User.findByIdAndUpdate(
      org.adminId,
      { password: hashedPassword },
      { new: true }
    );
    if (!adminUser) {
      return res.status(404).json({ error: "Associated admin user not found" });
    }
    return res.status(200).json({ message: "Admin password reset successfully" });
  } catch (error) {
    console.error("Reset Admin Password Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
