import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: "../..",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "form-vendor": ["@hookform/resolvers", "react-hook-form", "zod"],
          "ui-vendor": [
            "@radix-ui/react-slot",
            "class-variance-authority",
            "clsx",
            "lucide-react",
            "tailwind-merge",
          ],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
