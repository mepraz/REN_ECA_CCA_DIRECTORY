"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_js_1 = require("../middleware/auth.js");
const User_js_1 = require("../models/User.js");
const User_js_2 = __importDefault(require("../models/User.js"));
const Organization_js_1 = __importDefault(require("../models/Organization.js"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Enforce MAIN_ADMIN check on all user management routes
router.use(auth_js_1.authenticateUser);
router.use((0, auth_js_1.requireRole)([User_js_1.UserRole.MAIN_ADMIN]));
/**
 * @route   POST /api/users
 * @desc    Create a new College Admin (User)
 * @access  Private (MAIN_ADMIN)
 */
router.post("/", async (req, res) => {
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
        const existingUser = await User_js_2.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }
        // Validate organization existence
        const organization = await Organization_js_1.default.findById(organizationId);
        if (!organization) {
            return res.status(400).json({ error: "Invalid organization selected" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = new User_js_2.default({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: User_js_1.UserRole.COLLEGE_ADMIN,
            organizationId: new mongoose_1.default.Types.ObjectId(organizationId),
            isActive: true,
            isDeleted: false,
        });
        await newUser.save();
        // Link the created user back to the Organization's adminId
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
                isActive: newUser.isActive,
            },
        });
    }
    catch (error) {
        console.error("Create User Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   GET /api/users
 * @desc    Get all active college admin users (with pagination, filtering, searching)
 * @access  Private (MAIN_ADMIN)
 */
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const organizationId = req.query.organizationId || "";
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
        // Filter active (non-soft-deleted) college admins
        const query = {
            isDeleted: false,
            role: User_js_1.UserRole.COLLEGE_ADMIN,
        };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (organizationId) {
            query.organizationId = new mongoose_1.default.Types.ObjectId(organizationId);
        }
        const skip = (page - 1) * limit;
        const users = await User_js_2.default.find(query)
            .populate("organizationId", "name address")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);
        const total = await User_js_2.default.countDocuments(query);
        return res.status(200).json({
            users,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        console.error("Get Users Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID
 * @access  Private (MAIN_ADMIN)
 */
router.get("/:id", async (req, res) => {
    try {
        const user = await User_js_2.default.findOne({ _id: req.params.id, isDeleted: false })
            .populate("organizationId", "name address")
            .select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.error("Get User Details Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   PATCH /api/users/:id
 * @desc    Edit User Details (name, email, organizationId, status)
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id", async (req, res) => {
    try {
        const { name, email, organizationId, isActive } = req.body;
        const { id } = req.params;
        const user = await User_js_2.default.findOne({ _id: id, isDeleted: false });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (name)
            user.name = name;
        if (email && email.toLowerCase() !== user.email) {
            // Email changed, verify uniqueness
            const existingUser = await User_js_2.default.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ error: "Email is already registered" });
            }
            user.email = email.toLowerCase();
        }
        if (organizationId) {
            const organization = await Organization_js_1.default.findById(organizationId);
            if (!organization) {
                return res.status(400).json({ error: "Invalid organization selected" });
            }
            user.organizationId = new mongoose_1.default.Types.ObjectId(organizationId);
            organization.adminId = user._id;
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
    }
    catch (error) {
        console.error("Edit User Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   PATCH /api/users/:id/reset-password
 * @desc    Reset College Admin Password
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id/reset-password", async (req, res) => {
    try {
        const { password } = req.body;
        const { id } = req.params;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        const user = await User_js_2.default.findOne({ _id: id, isDeleted: false });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (MAIN_ADMIN)
 */
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_js_2.default.findOne({ _id: id, isDeleted: false });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.isActive = !user.isActive;
        await user.save();
        return res.status(200).json({
            message: `User is now ${user.isActive ? "activated" : "deactivated"}`,
            isActive: user.isActive,
        });
    }
    catch (error) {
        console.error("Toggle User Status Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Private (MAIN_ADMIN)
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_js_2.default.findOne({ _id: id, isDeleted: false });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save();
        // Detach user from being admin of any organization if needed, or keep for records.
        await Organization_js_1.default.updateMany({ adminId: user._id }, { $unset: { adminId: 1 } });
        return res.status(200).json({ message: "User deleted successfully (soft delete)" });
    }
    catch (error) {
        console.error("Delete User Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
exports.default = router;
