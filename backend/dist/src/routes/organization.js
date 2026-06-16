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
// Apply authentication & MAIN_ADMIN check to all routes in this file
router.use(auth_js_1.authenticateUser);
router.use((0, auth_js_1.requireRole)([User_js_1.UserRole.MAIN_ADMIN]));
// GET /api/organizations - List organizations
router.get("/", async (req, res) => {
    try {
        const orgs = await Organization_js_1.default.find()
            .populate("adminId", "name email isActive")
            .sort({ createdAt: -1 });
        return res.status(200).json(orgs);
    }
    catch (error) {
        console.error("List Organizations Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/organizations - Create organization & college admin simultaneously
router.post("/", async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { name, address, email, adminName, adminEmail, password } = req.body;
        if (!name || !address || !adminName || !adminEmail || !password) {
            return res.status(400).json({ error: "All fields except organization email are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        // Check if admin email already exists
        const existingUser = await User_js_2.default.findOne({ email: adminEmail.toLowerCase() }).session(session);
        if (existingUser) {
            return res.status(400).json({ error: "Admin email is already registered" });
        }
        // Create a temporary dummy admin ID first or create user without organizationId, then update
        // Let's generate an ObjectId for organization and user to link them perfectly
        const orgId = new mongoose_1.default.Types.ObjectId();
        const userId = new mongoose_1.default.Types.ObjectId();
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create Admin User
        const newAdmin = new User_js_2.default({
            _id: userId,
            name: adminName,
            email: adminEmail.toLowerCase(),
            password: hashedPassword,
            role: User_js_1.UserRole.COLLEGE_ADMIN,
            organizationId: String(orgId),
            isActive: true,
        });
        // Create Organization
        const newOrg = new Organization_js_1.default({
            _id: orgId,
            name,
            address,
            email: email ? email.toLowerCase() : undefined,
            isActive: true,
            adminId: userId,
            totalEvents: 0,
            totalImages: 0,
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
                email: newAdmin.email,
            },
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Create Organization Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
// PUT /api/organizations/:id - Edit organization details
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, email } = req.body;
        if (!name || !address) {
            return res.status(400).json({ error: "Name and address are required" });
        }
        const org = await Organization_js_1.default.findById(id);
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        org.name = name;
        org.address = address;
        org.email = email ? email.toLowerCase() : undefined;
        await org.save();
        return res.status(200).json({
            message: "Organization updated successfully",
            organization: org,
        });
    }
    catch (error) {
        console.error("Edit Organization Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// PATCH /api/organizations/:id/status - Toggle organization active status
router.patch("/:id/status", async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { id } = req.params;
        const org = await Organization_js_1.default.findById(id).session(session);
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        const newStatus = !org.isActive;
        org.isActive = newStatus;
        await org.save({ session });
        // Update associated admin user's status to match the organization's status
        if (org.adminId) {
            await User_js_2.default.findByIdAndUpdate(org.adminId, { isActive: newStatus }, { session });
        }
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({
            message: `Organization is now ${newStatus ? "activated" : "deactivated"}`,
            isActive: newStatus,
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Toggle Organization Status Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/organizations/:id/reset-password - Reset College Admin password
router.post("/:id/reset-password", async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        const org = await Organization_js_1.default.findById(id);
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Update Admin User password
        const adminUser = await User_js_2.default.findByIdAndUpdate(org.adminId, { password: hashedPassword }, { new: true });
        if (!adminUser) {
            return res.status(404).json({ error: "Associated admin user not found" });
        }
        return res.status(200).json({ message: "Admin password reset successfully" });
    }
    catch (error) {
        console.error("Reset Admin Password Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
