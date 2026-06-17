import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, AuthenticatedRequest, requireRole } from "../middleware/auth.js";
import { UserRole } from "../models/User.js";
import {
  exchangeCodeForRefreshToken,
  getDriveUploadFolder,
  getGoogleAuthUrl,
  isDriveUploadConfigured,
} from "../lib/googleDrive.js";
import { updateEnvFileValue } from "../lib/envFile.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_change_it_immediately";

router.get(
  "/auth",
  authenticateUser as any,
  requireRole([UserRole.MAIN_ADMIN]) as any,
  (req: AuthenticatedRequest, res: Response): any => {
    try {
      const state = jwt.sign(
        {
          userId: req.user?.userId,
          purpose: "google-drive-oauth",
        },
        JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.redirect(getGoogleAuthUrl(state));
    } catch (error: any) {
      console.error("Google auth URL error:", error);
      return res.status(400).json({ error: error.message || "Unable to start Google OAuth" });
    }
  }
);

router.get("/callback", async (req, res): Promise<any> => {
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

    const decoded = jwt.verify(state, JWT_SECRET) as { purpose?: string };
    if (decoded.purpose !== "google-drive-oauth") {
      return res.status(400).json({ error: "Invalid Google OAuth state" });
    }

    const refreshToken = await exchangeCodeForRefreshToken(code);
    updateEnvFileValue("GOOGLE_REFRESH_TOKEN", refreshToken);

    return res.status(200).send(`
      <html>
        <body style="font-family: system-ui, sans-serif; padding: 32px;">
          <h1>Google Drive connected</h1>
          <p>The refresh token was saved to backend/.env. Restart the backend server before uploading event images.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google callback error:", error);
    return res.status(400).json({ error: error.message || "Unable to complete Google OAuth" });
  }
});

router.get(
  "/status",
  authenticateUser as any,
  requireRole([UserRole.MAIN_ADMIN]) as any,
  async (_req: AuthenticatedRequest, res: Response): Promise<any> => {
    const configured = isDriveUploadConfigured();
    let folder: Awaited<ReturnType<typeof getDriveUploadFolder>> | null = null;
    let folderError: string | null = null;

    if (configured) {
      try {
        folder = await getDriveUploadFolder();
      } catch (error: any) {
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
  }
);

export default router;
