import path from "node:path";

export const appWebDir = process.env.APP_WEB_DIR ?? path.resolve(process.cwd(), "..");
export const appDataDir = path.join(appWebDir, "data");
export const baselineDir = path.resolve(process.cwd(), "./data-baseline");
