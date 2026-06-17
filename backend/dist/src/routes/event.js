"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_js_1 = require("../middleware/auth.js");
const Event_js_1 = __importStar(require("../models/Event.js"));
const Organization_js_1 = __importDefault(require("../models/Organization.js"));
const User_js_1 = require("../models/User.js");
const googleDrive_js_1 = require("../lib/googleDrive.js");
const uploadPath_js_1 = require("../lib/uploadPath.js");
const router = (0, express_1.Router)();
const MAX_IMAGE_SIZE = Number(process.env.EVENT_IMAGE_MAX_BYTES || 5 * 1024 * 1024);
const MAX_IMAGE_COUNT = Number(process.env.EVENT_IMAGE_MAX_COUNT || 20);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadRoot = (0, uploadPath_js_1.getEventUploadRoot)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_IMAGE_SIZE,
        files: MAX_IMAGE_COUNT,
    },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            cb(new Error("Only JPG, PNG, and WebP images are allowed"));
            return;
        }
        cb(null, true);
    },
});
router.use(auth_js_1.authenticateUser, (0, auth_js_1.requireRole)([User_js_1.UserRole.MAIN_ADMIN, User_js_1.UserRole.COLLEGE_ADMIN]));
const isValidObjectId = (id) => Boolean(id && mongoose_1.default.Types.ObjectId.isValid(id));
const getScopedQuery = (req) => {
    const query = { isDeleted: false };
    if (req.user?.role === User_js_1.UserRole.COLLEGE_ADMIN) {
        query.organizationId = req.user.organizationId;
    }
    return query;
};
const parseWinners = (value) => {
    if (Array.isArray(value)) {
        return value.map(String).map((item) => item.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map(String).map((item) => item.trim()).filter(Boolean);
            }
        }
        catch {
            return value.split("\n").map((item) => item.trim()).filter(Boolean);
        }
        return value.split("\n").map((item) => item.trim()).filter(Boolean);
    }
    return [];
};
const parseImageMeta = (value) => {
    if (typeof value !== "string")
        return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
const normalizeCategory = (category) => {
    if (category === Event_js_1.EventImageCategory.BANNER || category === Event_js_1.EventImageCategory.AUDIENCE) {
        return category;
    }
    return Event_js_1.EventImageCategory.OTHER;
};
const saveLocalUpload = (file) => {
    const extension = path_1.default.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto_1.default.randomBytes(8).toString("hex")}${extension}`;
    const filePath = path_1.default.join(uploadRoot, filename);
    fs_1.default.writeFileSync(filePath, file.buffer);
    return {
        filename,
        path: filePath,
        url: `/uploads/events/${filename}`,
    };
};
const buildImageRecords = async (files = [], meta = []) => {
    const useDrive = (0, googleDrive_js_1.isDriveUploadConfigured)();
    const warnings = [];
    const images = await Promise.all(files.map(async (file, index) => {
        let localFile;
        try {
            localFile = saveLocalUpload(file);
        }
        catch (error) {
            warnings.push(`Could not save ${file.originalname} locally: ${error.message || "Local upload failed"}`);
            return null;
        }
        let driveFile = null;
        if (useDrive) {
            try {
                driveFile = await (0, googleDrive_js_1.uploadImageToDrive)({ ...file, filename: localFile.filename });
            }
            catch (error) {
                warnings.push(`Saved ${file.originalname} locally, but Google Drive upload failed: ${error.message || "Drive upload failed"}`);
            }
        }
        return {
            category: normalizeCategory(meta[index]?.category),
            label: meta[index]?.label?.trim() || undefined,
            filename: localFile.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: driveFile?.driveFileId ? `google-drive:${driveFile.driveFileId}` : localFile.path,
            url: driveFile?.url || localFile.url,
            driveFileId: driveFile?.driveFileId,
            driveWebViewLink: driveFile?.driveWebViewLink || undefined,
            driveWebContentLink: driveFile?.driveWebContentLink || undefined,
            uploadedAt: new Date(),
        };
    }));
    return {
        images: images.filter((image) => Boolean(image)),
        warnings,
    };
};
const resolveOrganizationId = async (req, requestedId) => {
    if (req.user?.role === User_js_1.UserRole.MAIN_ADMIN) {
        if (!isValidObjectId(requestedId)) {
            throw new Error("A valid organization is required");
        }
        return requestedId;
    }
    if (!isValidObjectId(req.user?.organizationId)) {
        throw new Error("Your account is not assigned to an organization");
    }
    return req.user?.organizationId;
};
const ensureEventAccess = async (req, eventId) => {
    if (!isValidObjectId(eventId))
        return null;
    const event = await Event_js_1.default.findOne({ _id: eventId, ...getScopedQuery(req) });
    return event;
};
router.get("/organizations", async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.user?.role === User_js_1.UserRole.COLLEGE_ADMIN) {
            query._id = req.user.organizationId;
        }
        const organizations = await Organization_js_1.default.find(query).select("name address").sort({ name: 1 });
        return res.status(200).json(organizations);
    }
    catch (error) {
        console.error("List event organizations error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/gallery", async (req, res) => {
    try {
        const { organizationId, category, search } = req.query;
        const query = getScopedQuery(req);
        if (req.user?.role === User_js_1.UserRole.MAIN_ADMIN && isValidObjectId(String(organizationId))) {
            query.organizationId = organizationId;
        }
        if (search) {
            query.programName = { $regex: String(search), $options: "i" };
        }
        const events = await Event_js_1.default.find(query)
            .populate("organizationId", "name")
            .sort({ programDate: -1 })
            .select("programName programDate organizationId images");
        const selectedCategory = typeof category === "string" && category !== "all" ? category : null;
        const images = events.flatMap((event) => event.images
            .filter((image) => !selectedCategory || image.category === selectedCategory)
            .map((image) => ({
            _id: image._id,
            category: image.category,
            label: image.label,
            url: image.url,
            originalName: image.originalName,
            eventId: event._id,
            programName: event.programName,
            programDate: event.programDate,
            organization: event.organizationId,
        })));
        return res.status(200).json(images);
    }
    catch (error) {
        console.error("Gallery error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/", async (req, res) => {
    try {
        const { organizationId, search, category } = req.query;
        const query = getScopedQuery(req);
        if (req.user?.role === User_js_1.UserRole.MAIN_ADMIN && isValidObjectId(String(organizationId))) {
            query.organizationId = organizationId;
        }
        if (search) {
            query.$or = [
                { programName: { $regex: String(search), $options: "i" } },
                { programNature: { $regex: String(search), $options: "i" } },
            ];
        }
        if (typeof category === "string" && category !== "all") {
            query["images.category"] = category;
        }
        const events = await Event_js_1.default.find(query)
            .populate("organizationId", "name address")
            .populate("createdBy", "name email")
            .sort({ programDate: -1, createdAt: -1 });
        return res.status(200).json(events);
    }
    catch (error) {
        console.error("List events error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const event = await ensureEventAccess(req, String(req.params.id));
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        await event.populate([
            { path: "organizationId", select: "name address" },
            { path: "createdBy", select: "name email" },
            { path: "updatedBy", select: "name email" },
        ]);
        return res.status(200).json(event);
    }
    catch (error) {
        console.error("Get event error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/", upload.array("images", MAX_IMAGE_COUNT), async (req, res) => {
    try {
        const organizationId = await resolveOrganizationId(req, req.body.organizationId);
        const organization = await Organization_js_1.default.findById(organizationId);
        if (!organization) {
            return res.status(400).json({ error: "Organization not found" });
        }
        const { programName, participantsCount, programDate, programNature, guestDetails, description } = req.body;
        if (!programName || !programDate || !programNature) {
            return res.status(400).json({ error: "Program name, date, and nature are required" });
        }
        const imageResult = await buildImageRecords(req.files || [], parseImageMeta(req.body.imageMeta));
        const event = new Event_js_1.default({
            organizationId,
            programName,
            participantsCount: Number(participantsCount) || 0,
            winners: parseWinners(req.body.winners),
            programDate,
            programNature,
            guestDetails,
            description,
            images: imageResult.images,
            createdBy: req.user?.userId,
        });
        await event.save();
        await Organization_js_1.default.findByIdAndUpdate(organizationId, {
            $inc: { totalEvents: 1, totalImages: imageResult.images.length },
        });
        return res.status(201).json({ event, warnings: imageResult.warnings });
    }
    catch (error) {
        console.error("Create event error:", error);
        return res.status(400).json({ error: error.message || "Unable to create event" });
    }
});
router.put("/:id", upload.array("images", MAX_IMAGE_COUNT), async (req, res) => {
    try {
        const event = await ensureEventAccess(req, String(req.params.id));
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        const oldOrganizationId = String(event.organizationId);
        const oldImageCount = event.images.length;
        const nextOrganizationId = await resolveOrganizationId(req, req.body.organizationId || oldOrganizationId);
        const keepImageIds = typeof req.body.keepImageIds === "string"
            ? new Set(JSON.parse(req.body.keepImageIds))
            : null;
        const retainedImages = keepImageIds
            ? event.images.filter((image) => image._id && keepImageIds.has(String(image._id)))
            : event.images;
        const imageResult = await buildImageRecords(req.files || [], parseImageMeta(req.body.imageMeta));
        event.organizationId = new mongoose_1.default.Types.ObjectId(nextOrganizationId);
        event.programName = req.body.programName;
        event.participantsCount = Number(req.body.participantsCount) || 0;
        event.winners = parseWinners(req.body.winners);
        event.programDate = req.body.programDate;
        event.programNature = req.body.programNature;
        event.guestDetails = req.body.guestDetails;
        event.description = req.body.description;
        event.images = [...retainedImages, ...imageResult.images];
        event.updatedBy = new mongoose_1.default.Types.ObjectId(req.user?.userId);
        await event.save();
        if (oldOrganizationId !== nextOrganizationId) {
            await Organization_js_1.default.findByIdAndUpdate(oldOrganizationId, {
                $inc: { totalEvents: -1, totalImages: -oldImageCount },
            });
            await Organization_js_1.default.findByIdAndUpdate(nextOrganizationId, {
                $inc: { totalEvents: 1, totalImages: event.images.length },
            });
        }
        else if (oldImageCount !== event.images.length) {
            await Organization_js_1.default.findByIdAndUpdate(nextOrganizationId, {
                $inc: { totalImages: event.images.length - oldImageCount },
            });
        }
        return res.status(200).json({ event, warnings: imageResult.warnings });
    }
    catch (error) {
        console.error("Update event error:", error);
        return res.status(400).json({ error: error.message || "Unable to update event" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const event = await ensureEventAccess(req, String(req.params.id));
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        event.isDeleted = true;
        event.deletedAt = new Date();
        event.deletedBy = new mongoose_1.default.Types.ObjectId(req.user?.userId);
        await event.save();
        await Organization_js_1.default.findByIdAndUpdate(event.organizationId, {
            $inc: { totalEvents: -1, totalImages: -event.images.length },
        });
        return res.status(200).json({ message: "Event deleted successfully" });
    }
    catch (error) {
        console.error("Delete event error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.use((error, _req, res, _next) => {
    if (error instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: error.message });
    }
    if (error.message) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Upload failed" });
});
exports.default = router;
