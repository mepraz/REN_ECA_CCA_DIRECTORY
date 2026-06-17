import fs from "fs";
import path from "path";
import os from "os";
const defaultUploadRoot = path.join(process.cwd(), "uploads", "events");
const configuredUploadRoot = process.env.GOOGLE_DRIVE_UPLOAD_DIR ? path.resolve(process.env.GOOGLE_DRIVE_UPLOAD_DIR) : defaultUploadRoot;
let resolvedUploadRoot = null;
const getEventUploadRoot = () => {
  if (resolvedUploadRoot) return resolvedUploadRoot;
  try {
    fs.mkdirSync(configuredUploadRoot, { recursive: true });
    resolvedUploadRoot = configuredUploadRoot;
  } catch (error) {
    console.warn(
      `[events] Could not use GOOGLE_DRIVE_UPLOAD_DIR (${configuredUploadRoot}). Trying default path.`,
      error.message
    );
    try {
      fs.mkdirSync(defaultUploadRoot, { recursive: true });
      resolvedUploadRoot = defaultUploadRoot;
    } catch (fallbackError) {
      console.warn(
        `[events] Could not use default path (${defaultUploadRoot}). Falling back to temp directory.`,
        fallbackError.message
      );
      const tmpDir = path.join(os.tmpdir(), "reliance-uploads");
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
        resolvedUploadRoot = tmpDir;
      } catch (tmpError) {
        console.error("[events] Fatal: could not create any writeable directory.", tmpError.message);
        throw tmpError;
      }
    }
  }
  return resolvedUploadRoot;
};
export {
  getEventUploadRoot
};
