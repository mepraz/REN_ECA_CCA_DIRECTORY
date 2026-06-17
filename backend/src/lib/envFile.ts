import fs from "fs";
import path from "path";

const getBackendEnvPath = () => {
  const nestedBackendEnv = path.join(process.cwd(), "backend", ".env");
  const cwdBackendEnv = path.join(process.cwd(), ".env");

  if (fs.existsSync(nestedBackendEnv)) return nestedBackendEnv;
  if (fs.existsSync(cwdBackendEnv)) return cwdBackendEnv;
  return cwdBackendEnv;
};

export const updateEnvFileValue = (key: string, value: string, envPath = getBackendEnvPath()) => {
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const escapedValue = value.replace(/\r?\n/g, "");
  const line = `${key}=${escapedValue}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(current)
    ? current.replace(pattern, line)
    : `${current.trimEnd()}\n${line}\n`;

  fs.writeFileSync(envPath, next);
  process.env[key] = escapedValue;
};
