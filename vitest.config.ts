import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: "@",
        replacement: root,
      },
      {
        find: /^ajv\/(.*)$/,
        replacement: path.join(root, "node_modules/ajv/$1"),
      },
      {
        find: "ajv-formats",
        replacement: path.join(root, "node_modules/ajv-formats/dist/index.js"),
      },
    ],
  },
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
