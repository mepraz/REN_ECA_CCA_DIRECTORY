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
router.post("/", async (req, res) => {
  try {
    const { name, email, password, organizationId } = req.body;
    if (!name || !email || !password || !organizationId) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(400).json({ error: "Invalid organization selected" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.COLLEGE_ADMIN,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      isActive: true,
      isDeleted: false
    });
    await newUser.save();
    organization.adminId = newUser._id;
    await organization.save();
    return res.status(201).json({
      message: "College Admin created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error("Create User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const organizationId = req.query.organizationId || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const query = {
      isDeleted: false,
      role: UserRole.COLLEGE_ADMIN
    };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (organizationId) {
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
    }
    const skip = (page - 1) * limit;
    const users = await User.find(query).populate("organizationId", "name address").sort({ [sortBy]: sortOrder }).skip(skip).limit(limit);
    const total = await User.countDocuments(query);
    return res.status(200).json({
      users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).populate("organizationId", "name address").select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get User Details Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const { name, email, organizationId, isActive } = req.body;
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (name) user.name = name;
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: "Email is already registered" });
      }
      user.email = email.toLowerCase();
    }
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(400).json({ error: "Invalid organization selected" });
      }
      user.organizationId = new mongoose.Types.ObjectId(organizationId);
      organization.adminId = user._id;
      await organization.save();
    }
    if (isActive !== void 0) {
      user.isActive = isActive;
    }
    await user.save();
    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Edit User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.patch("/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isActive = !user.isActive;
    await user.save();
    return res.status(200).json({
      message: `User is now ${user.isActive ? "activated" : "deactivated"}`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error("Toggle User Status Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isDeleted = true;
    user.deletedAt = /* @__PURE__ */ new Date();
    await user.save();
    await Organization.updateMany({ adminId: user._id }, { $unset: { adminId: 1 } });
    return res.status(200).json({ message: "User deleted successfully (soft delete)" });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
export default router;
