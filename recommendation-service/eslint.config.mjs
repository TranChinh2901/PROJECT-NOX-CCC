import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores(["dist/**", "node_modules/**", "*.config.mjs"]),
]);
