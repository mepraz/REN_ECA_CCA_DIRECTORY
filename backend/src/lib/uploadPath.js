import fs from "fs";
import path from "path";
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
      `[events] Could not use GOOGLE_DRIVE_UPLOAD_DIR (${configuredUploadRoot}). Falling back to ${defaultUploadRoot}.`,
      error.message
    );
    fs.mkdirSync(defaultUploadRoot, { recursive: true });
    resolvedUploadRoot = defaultUploadRoot;
  }
  return resolvedUploadRoot;
};
export {
  getEventUploadRoot
};
