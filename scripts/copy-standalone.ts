import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const standaloneDir = resolve(".next/standalone");

await mkdir(resolve(standaloneDir, ".next"), { recursive: true });
await cp(resolve(".next/static"), resolve(standaloneDir, ".next/static"), {
  recursive: true,
  force: true,
});
await cp(resolve("public"), resolve(standaloneDir, "public"), {
  recursive: true,
  force: true,
});
