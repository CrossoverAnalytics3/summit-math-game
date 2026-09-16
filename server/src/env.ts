import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Load before the database or adapter reads configuration. Existing environment
// variables take precedence. A private external file may be referenced by path.
if (process.env.NODE_ENV !== "test") {
  const envFile = process.env.SUMMIT_ENV_FILE ?? fileURLToPath(new URL("../../.env", import.meta.url));
  if (existsSync(envFile)) loadEnvFile(envFile);
}
