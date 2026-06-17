"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriveUploadFolder = exports.uploadImageToDrive = exports.exchangeCodeForRefreshToken = exports.getGoogleAuthUrl = exports.isDriveUploadConfigured = void 0;
const stream_1 = require("stream");
const googleapis_1 = require("googleapis");
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const getGoogleErrorMessage = (error) => {
    const status = error?.code || error?.response?.status;
    const reason = error?.errors?.[0]?.reason || error?.response?.data?.error;
    const message = error?.message || "Google Drive request failed";
    if (status === 401 || reason === "invalid_grant") {
        return "Google Drive refresh token is invalid or expired. Reconnect from /api/google/auth.";
    }
    if (status === 403 && String(message).toLowerCase().includes("drive api")) {
        return "Google Drive API is not enabled for this Google Cloud project.";
    }
    if (status === 403) {
        return "The connected Google account does not have permission to write to the Drive folder.";
    }
    if (status === 404) {
        return "Google Drive folder was not found. Check GOOGLE_DRIVE_FOLDER_ID and make sure the connected Google account can access it.";
    }
    return message;
};
const getOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Google OAuth env is not configured");
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
};
const isDriveUploadConfigured = () => {
    return Boolean(process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REDIRECT_URI &&
        process.env.GOOGLE_DRIVE_FOLDER_ID &&
        process.env.GOOGLE_REFRESH_TOKEN);
};
exports.isDriveUploadConfigured = isDriveUploadConfigured;
const getGoogleAuthUrl = (state) => {
    const oauth2Client = getOAuthClient();
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [DRIVE_FILE_SCOPE],
        state,
    });
};
exports.getGoogleAuthUrl = getGoogleAuthUrl;
const exchangeCodeForRefreshToken = async (code) => {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error("Google did not return a refresh token. Revoke app access and try again.");
    }
    return tokens.refresh_token;
};
exports.exchangeCodeForRefreshToken = exchangeCodeForRefreshToken;
const uploadImageToDrive = async (file) => {
    if (!(0, exports.isDriveUploadConfigured)()) {
        throw new Error("Google Drive upload is not configured");
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = googleapis_1.google.drive({ version: "v3", auth: oauth2Client });
    try {
        const created = await drive.files.create({
            requestBody: {
                name: file.filename,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
            },
            media: {
                mimeType: file.mimetype,
                body: stream_1.Readable.from(file.buffer),
            },
            fields: "id,name,mimeType,size,webViewLink,webContentLink",
            supportsAllDrives: true,
        });
        const fileId = created.data.id;
        if (!fileId) {
            throw new Error("Google Drive did not return a file id");
        }
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
            supportsAllDrives: true,
        });
        const uploaded = await drive.files.get({
            fileId,
            fields: "id,name,mimeType,size,webViewLink,webContentLink",
            supportsAllDrives: true,
        });
        return {
            driveFileId: fileId,
            driveWebViewLink: uploaded.data.webViewLink,
            driveWebContentLink: uploaded.data.webContentLink,
            url: `https://drive.google.com/uc?export=view&id=${fileId}`,
        };
    }
    catch (error) {
        throw new Error(getGoogleErrorMessage(error));
    }
};
exports.uploadImageToDrive = uploadImageToDrive;
const getDriveUploadFolder = async () => {
    if (!(0, exports.isDriveUploadConfigured)()) {
        throw new Error("Google Drive upload is not configured");
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = googleapis_1.google.drive({ version: "v3", auth: oauth2Client });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    let folder;
    try {
        folder = await drive.files.get({
            fileId: folderId,
            fields: "id,name,mimeType,webViewLink,capabilities(canAddChildren)",
            supportsAllDrives: true,
        });
    }
    catch (error) {
        throw new Error(getGoogleErrorMessage(error));
    }
    if (folder.data.mimeType !== "application/vnd.google-apps.folder") {
        throw new Error("GOOGLE_DRIVE_FOLDER_ID does not point to a Google Drive folder");
    }
    if (folder.data.capabilities?.canAddChildren === false) {
        throw new Error("The connected Google account cannot add files to this Drive folder");
    }
    return folder.data;
};
exports.getDriveUploadFolder = getDriveUploadFolder;
