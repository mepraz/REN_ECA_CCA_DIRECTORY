import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticateUser, requireRole, AuthenticatedRequest } from "../middleware/auth.js";
import { UserRole } from "../models/User.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import mongoose from "mongoose";

const router = Router();

// Enforce MAIN_ADMIN check on all user management routes
router.use(authenticateUser as any);
router.use(requireRole([UserRole.MAIN_ADMIN]) as any);

/**
 * @route   POST /api/users
 * @desc    Create a new College Admin (User)
 * @access  Private (MAIN_ADMIN)
 */
router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, email, password, organizationId } = req.body;

    // Validation
    if (!name || !email || !password || !organizationId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Validate organization existence
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
      organizationId: new mongoose.Types.ObjectId(organizationId) as any,
      isActive: true,
      isDeleted: false,
    });

    await newUser.save();

    // Link the created user back to the Organization's adminId
    organization.adminId = newUser._id as any;
    await organization.save();

    return res.status(201).json({
      message: "College Admin created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organizationId: newUser.organizationId,
        isActive: newUser.isActive,
      },
    });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all active college admin users (with pagination, filtering, searching)
 * @access  Private (MAIN_ADMIN)
 */
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const organizationId = (req.query.organizationId as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    // Filter active (non-soft-deleted) college admins
    const query: any = {
      isDeleted: false,
      role: UserRole.COLLEGE_ADMIN,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (organizationId) {
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate("organizationId", "name address")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Get Users Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID
 * @access  Private (MAIN_ADMIN)
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate("organizationId", "name address")
      .select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error("Get User Details Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   PATCH /api/users/:id
 * @desc    Edit User Details (name, email, organizationId, status)
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, email, organizationId, isActive } = req.body;
    const { id } = req.params;

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    
    if (email && email.toLowerCase() !== user.email) {
      // Email changed, verify uniqueness
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
      user.organizationId = new mongoose.Types.ObjectId(organizationId) as any;
      organization.adminId = user._id as any;
      await organization.save();
    }

    if (isActive !== undefined) {
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
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error("Edit User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   PATCH /api/users/:id/reset-password
 * @desc    Reset College Admin Password
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id/reset-password", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id/status", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
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
      isActive: user.isActive,
    });
  } catch (error: any) {
    console.error("Toggle User Status Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Private (MAIN_ADMIN)
 */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDeleted: false });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // Detach user from being admin of any organization if needed, or keep for records.
    await Organization.updateMany({ adminId: user._id }, { $unset: { adminId: 1 } });

    return res.status(200).json({ message: "User deleted successfully (soft delete)" });
  } catch (error: any) {
    console.error("Delete User Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
