"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnvFileValue = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getBackendEnvPath = () => {
    const cwdBackendEnv = path_1.default.join(process.cwd(), ".env");
    const nestedBackendEnv = path_1.default.join(process.cwd(), "backend", ".env");
    if (fs_1.default.existsSync(cwdBackendEnv))
        return cwdBackendEnv;
    if (fs_1.default.existsSync(nestedBackendEnv))
        return nestedBackendEnv;
    return cwdBackendEnv;
};
const updateEnvFileValue = (key, value, envPath = getBackendEnvPath()) => {
    const current = fs_1.default.existsSync(envPath) ? fs_1.default.readFileSync(envPath, "utf8") : "";
    const escapedValue = value.replace(/\r?\n/g, "");
    const line = `${key}=${escapedValue}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    const next = pattern.test(current)
        ? current.replace(pattern, line)
        : `${current.trimEnd()}\n${line}\n`;
    fs_1.default.writeFileSync(envPath, next);
    process.env[key] = escapedValue;
};
exports.updateEnvFileValue = updateEnvFileValue;