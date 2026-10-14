import { copyFile, mkdir } from "node:fs/promises";

await mkdir("hosting/dist", { recursive: true });
await copyFile("hosting/_worker.js", "hosting/dist/_worker.js");
