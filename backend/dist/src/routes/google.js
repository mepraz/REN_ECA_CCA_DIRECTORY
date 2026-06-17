"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_js_1 = require("../middleware/auth.js");
const User_js_1 = require("../models/User.js");
const googleDrive_js_1 = require("../lib/googleDrive.js");
const envFile_js_1 = require("../lib/envFile.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_change_it_immediately";
router.get("/auth", auth_js_1.authenticateUser, (0, auth_js_1.requireRole)([User_js_1.UserRole.MAIN_ADMIN]), (req, res) => {
    try {
        const state = jsonwebtoken_1.default.sign({
            userId: req.user?.userId,
            purpose: "google-drive-oauth",
        }, JWT_SECRET, { expiresIn: "10m" });
        return res.redirect((0, googleDrive_js_1.getGoogleAuthUrl)(state));
    }
    catch (error) {
        console.error("Google auth URL error:", error);
        return res.status(400).json({ error: error.message || "Unable to start Google OAuth" });
    }
});
router.get("/callback", async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            return res.status(400).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 32px;">
            <h1>Google Drive was not connected</h1>
            <p>Google returned this OAuth error: ${String(error)}</p>
            <p>Start again from <code>/api/google/auth</code> while logged in as MAIN_ADMIN.</p>
          </body>
        </html>
      `);
        }
        if (!code || typeof code !== "string") {
            return res.status(400).send(`
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 32px;">
            <h1>Missing Google OAuth code</h1>
            <p>This callback URL only works after Google redirects back to it.</p>
            <p>Start from <code>/api/google/auth</code> while logged in as MAIN_ADMIN.</p>
          </body>
        </html>
      `);
        }
        if (!state || typeof state !== "string") {
            return res.status(400).json({ error: "Missing Google OAuth state" });
        }
        const decoded = jsonwebtoken_1.default.verify(state, JWT_SECRET);
        if (decoded.purpose !== "google-drive-oauth") {
            return res.status(400).json({ error: "Invalid Google OAuth state" });
        }
        const refreshToken = await (0, googleDrive_js_1.exchangeCodeForRefreshToken)(code);
        (0, envFile_js_1.updateEnvFileValue)("GOOGLE_REFRESH_TOKEN", refreshToken);
        return res.status(200).send(`
      <html>
        <body style="font-family: system-ui, sans-serif; padding: 32px;">
          <h1>Google Drive connected</h1>
          <p>The refresh token was saved to backend/.env. Restart the backend server before uploading event images.</p>
        </body>
      </html>
    `);
    }
    catch (error) {
        console.error("Google callback error:", error);
        return res.status(400).json({ error: error.message || "Unable to complete Google OAuth" });
    }
});
router.get("/status", auth_js_1.authenticateUser, (0, auth_js_1.requireRole)([User_js_1.UserRole.MAIN_ADMIN]), async (_req, res) => {
    const configured = (0, googleDrive_js_1.isDriveUploadConfigured)();
    let folder = null;
    let folderError = null;
    if (configured) {
        try {
            folder = await (0, googleDrive_js_1.getDriveUploadFolder)();
        }
        catch (error) {
            folderError = error.message || "Unable to access Google Drive folder";
        }
    }
    return res.status(200).json({
        configured,
        hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        hasRedirectUri: Boolean(process.env.GOOGLE_REDIRECT_URI),
        hasFolderId: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
        hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
        folder: folder
            ? {
                id: folder.id,
                name: folder.name,
                webViewLink: folder.webViewLink,
                canAddChildren: folder.capabilities?.canAddChildren,
            }
            : null,
        folderError,
    });
});
exports.default = router;
