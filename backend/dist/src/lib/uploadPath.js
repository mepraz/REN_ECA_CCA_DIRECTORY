"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventUploadRoot = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const defaultUploadRoot = path_1.default.join(process.cwd(), "uploads", "events");
const configuredUploadRoot = process.env.GOOGLE_DRIVE_UPLOAD_DIR
    ? path_1.default.resolve(process.env.GOOGLE_DRIVE_UPLOAD_DIR)
    : defaultUploadRoot;
let resolvedUploadRoot = null;
const getEventUploadRoot = () => {
    if (resolvedUploadRoot)
        return resolvedUploadRoot;
    try {
        fs_1.default.mkdirSync(configuredUploadRoot, { recursive: true });
        resolvedUploadRoot = configuredUploadRoot;
    }
    catch (error) {
        console.warn(`[events] Could not use GOOGLE_DRIVE_UPLOAD_DIR (${configuredUploadRoot}). Falling back to ${defaultUploadRoot}.`, error.message);
        fs_1.default.mkdirSync(defaultUploadRoot, { recursive: true });
        resolvedUploadRoot = defaultUploadRoot;
    }
    return resolvedUploadRoot;
};
exports.getEventUploadRoot = getEventUploadRoot;
