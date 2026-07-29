import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      ".cursor/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "e2e/**",
      "next-env.d.ts",
      "src/app/api/visual/_worker-template/**",
      "src/app/api/visual/worker-*/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/alt-text": "warn",
      "no-console": ["warn", {
        "allow": ["warn", "error"]
      }],
      "prefer-const": "warn",
      "no-var": "error"
    }
  }
];

export default eslintConfig;
