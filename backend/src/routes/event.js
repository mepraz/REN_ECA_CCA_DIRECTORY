import { Router } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import mongoose from "mongoose";
import { authenticateUser, requireRole } from "../middleware/auth.js";
import Event, { EventImageCategory } from "../models/Event.js";
import Organization from "../models/Organization.js";
import { UserRole } from "../models/User.js";
import { isDriveUploadConfigured, uploadImageToDrive } from "../lib/googleDrive.js";
import { getEventUploadRoot } from "../lib/uploadPath.js";
const router = Router();
const MAX_IMAGE_SIZE = Number(process.env.EVENT_IMAGE_MAX_BYTES || 5 * 1024 * 1024);
const MAX_IMAGE_COUNT = Number(process.env.EVENT_IMAGE_MAX_COUNT || 20);
const ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadRoot = getEventUploadRoot();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_IMAGE_COUNT
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  }
});
router.use(authenticateUser, requireRole([UserRole.MAIN_ADMIN, UserRole.COLLEGE_ADMIN]));
const isValidObjectId = (id) => Boolean(id && mongoose.Types.ObjectId.isValid(id));
const getScopedQuery = (req) => {
  const query = { isDeleted: false };
  if (req.user?.role === UserRole.COLLEGE_ADMIN) {
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
    } catch {
      return value.split("\n").map((item) => item.trim()).filter(Boolean);
    }
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};
const parseImageMeta = (value) => {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const normalizeCategory = (category) => {
  if (category === EventImageCategory.BANNER || category === EventImageCategory.AUDIENCE) {
    return category;
  }
  return EventImageCategory.OTHER;
};
const saveLocalUpload = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
  const filePath = path.join(uploadRoot, filename);
  fs.writeFileSync(filePath, file.buffer);
  return {
    filename,
    path: filePath,
    url: `/uploads/events/${filename}`
  };
};
const buildImageRecords = async (files = [], meta = []) => {
  const useDrive = isDriveUploadConfigured();
  const warnings = [];
  const images = await Promise.all(
    files.map(async (file, index) => {
      let localFile;
      try {
        localFile = saveLocalUpload(file);
      } catch (error) {
        warnings.push(`Could not save ${file.originalname} locally: ${error.message || "Local upload failed"}`);
        return null;
      }
      let driveFile = null;
      if (useDrive) {
        try {
          driveFile = await uploadImageToDrive({ ...file, filename: localFile.filename });
        } catch (error) {
          warnings.push(
            `Saved ${file.originalname} locally, but Google Drive upload failed: ${error.message || "Drive upload failed"}`
          );
        }
      }
      return {
        category: normalizeCategory(meta[index]?.category),
        label: meta[index]?.label?.trim() || void 0,
        filename: localFile.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: driveFile?.driveFileId ? `google-drive:${driveFile.driveFileId}` : localFile.path,
        url: driveFile?.url || localFile.url,
        driveFileId: driveFile?.driveFileId,
        driveWebViewLink: driveFile?.driveWebViewLink || void 0,
        driveWebContentLink: driveFile?.driveWebContentLink || void 0,
        uploadedAt: /* @__PURE__ */ new Date()
      };
    })
  );
  return {
    images: images.filter((image) => Boolean(image)),
    warnings
  };
};
const resolveOrganizationId = async (req, requestedId) => {
  if (req.user?.role === UserRole.MAIN_ADMIN) {
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
const getAuthenticatedUserId = (req) => {
  if (!isValidObjectId(req.user?.userId)) {
    throw new Error("Your session is missing a valid user id. Please log in again.");
  }
  return new mongoose.Types.ObjectId(req.user.userId);
};
const ensureEventAccess = async (req, eventId) => {
  if (!isValidObjectId(eventId)) return null;
  const event = await Event.findOne({ _id: eventId, ...getScopedQuery(req) });
  return event;
};
router.get("/organizations", async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.user?.role === UserRole.COLLEGE_ADMIN) {
      query._id = req.user.organizationId;
    }
    const organizations = await Organization.find(query).select("name address").sort({ name: 1 });
    return res.status(200).json(organizations);
  } catch (error) {
    console.error("List event organizations error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/gallery", async (req, res) => {
  try {
    const { organizationId, category, search } = req.query;
    const query = getScopedQuery(req);
    if (req.user?.role === UserRole.MAIN_ADMIN && isValidObjectId(String(organizationId))) {
      query.organizationId = organizationId;
    }
    if (search) {
      query.programName = { $regex: String(search), $options: "i" };
    }
    const events = await Event.find(query).populate("organizationId", "name").sort({ programDate: -1 }).select("programName programDate organizationId images");
    const selectedCategory = typeof category === "string" && category !== "all" ? category : null;
    const images = events.flatMap(
      (event) => event.images.filter((image) => !selectedCategory || image.category === selectedCategory).map((image) => ({
        _id: image._id,
        category: image.category,
        label: image.label,
        url: image.url,
        originalName: image.originalName,
        eventId: event._id,
        programName: event.programName,
        programDate: event.programDate,
        organization: event.organizationId
      }))
    );
    return res.status(200).json(images);
  } catch (error) {
    console.error("Gallery error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const { organizationId, search, category } = req.query;
    const query = getScopedQuery(req);
    if (req.user?.role === UserRole.MAIN_ADMIN && isValidObjectId(String(organizationId))) {
      query.organizationId = organizationId;
    }
    if (search) {
      query.$or = [
        { programName: { $regex: String(search), $options: "i" } },
        { programNature: { $regex: String(search), $options: "i" } }
      ];
    }
    if (typeof category === "string" && category !== "all") {
      query["images.category"] = category;
    }
    const events = await Event.find(query).populate("organizationId", "name address").populate("createdBy", "name email").sort({ programDate: -1, createdAt: -1 });
    return res.status(200).json(events);
  } catch (error) {
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
      { path: "updatedBy", select: "name email" }
    ]);
    return res.status(200).json(event);
  } catch (error) {
    console.error("Get event error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.post(
  "/",
  upload.array("images", MAX_IMAGE_COUNT),
  async (req, res) => {
    try {
      const organizationId = await resolveOrganizationId(req, req.body.organizationId);
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(400).json({ error: "Organization not found" });
      }
      if (!organization.isActive) {
        return res.status(400).json({ error: "Cannot create an event for an inactive organization" });
      }
      const { programName, participantsCount, programDate, programNature, guestDetails, description } = req.body;
      if (!programName || !programDate || !programNature) {
        return res.status(400).json({ error: "Program name, date, and nature are required" });
      }
      const createdBy = getAuthenticatedUserId(req);
      const imageResult = await buildImageRecords(
        req.files || [],
        parseImageMeta(req.body.imageMeta)
      );
      const event = new Event({
        organizationId,
        programName,
        participantsCount: Number(participantsCount) || 0,
        winners: parseWinners(req.body.winners),
        programDate,
        programNature,
        guestDetails,
        description,
        images: imageResult.images,
        createdBy
      });
      await event.save();
      await Organization.findByIdAndUpdate(organizationId, {
        $inc: { totalEvents: 1, totalImages: imageResult.images.length }
      });
      return res.status(201).json({ event, warnings: imageResult.warnings });
    } catch (error) {
      console.error("Create event error:", error);
      return res.status(400).json({ error: error.message || "Unable to create event" });
    }
  }
);
router.put(
  "/:id",
  upload.array("images", MAX_IMAGE_COUNT),
  async (req, res) => {
    try {
      const event = await ensureEventAccess(req, String(req.params.id));
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const oldOrganizationId = String(event.organizationId);
      const oldImageCount = event.images.length;
      const nextOrganizationId = await resolveOrganizationId(req, req.body.organizationId || oldOrganizationId);
      const keepImageIds = typeof req.body.keepImageIds === "string" ? new Set(JSON.parse(req.body.keepImageIds)) : null;
      const retainedImages = keepImageIds ? event.images.filter((image) => image._id && keepImageIds.has(String(image._id))) : event.images;
      const imageResult = await buildImageRecords(
        req.files || [],
        parseImageMeta(req.body.imageMeta)
      );
      const updatedBy = getAuthenticatedUserId(req);
      event.organizationId = new mongoose.Types.ObjectId(nextOrganizationId);
      event.programName = req.body.programName;
      event.participantsCount = Number(req.body.participantsCount) || 0;
      event.winners = parseWinners(req.body.winners);
      event.programDate = req.body.programDate;
      event.programNature = req.body.programNature;
      event.guestDetails = req.body.guestDetails;
      event.description = req.body.description;
      event.images = [...retainedImages, ...imageResult.images];
      event.updatedBy = updatedBy;
      await event.save();
      if (oldOrganizationId !== nextOrganizationId) {
        await Organization.findByIdAndUpdate(oldOrganizationId, {
          $inc: { totalEvents: -1, totalImages: -oldImageCount }
        });
        await Organization.findByIdAndUpdate(nextOrganizationId, {
          $inc: { totalEvents: 1, totalImages: event.images.length }
        });
      } else if (oldImageCount !== event.images.length) {
        await Organization.findByIdAndUpdate(nextOrganizationId, {
          $inc: { totalImages: event.images.length - oldImageCount }
        });
      }
      return res.status(200).json({ event, warnings: imageResult.warnings });
    } catch (error) {
      console.error("Update event error:", error);
      return res.status(400).json({ error: error.message || "Unable to update event" });
    }
  }
);
router.delete("/:id", async (req, res) => {
  try {
    const event = await ensureEventAccess(req, String(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    event.isDeleted = true;
    event.deletedAt = /* @__PURE__ */ new Date();
    event.deletedBy = getAuthenticatedUserId(req);
    await event.save();
    await Organization.findByIdAndUpdate(event.organizationId, {
      $inc: { totalEvents: -1, totalImages: -event.images.length }
    });
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: "Upload failed" });
});
export default router;
