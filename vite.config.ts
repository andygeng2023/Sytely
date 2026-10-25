import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set VITE_BASE_PATH=/Sytely/ for a project site at username.github.io/Sytely/.
// Use "/" for a custom domain or a root-domain deployment.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: { host: "0.0.0.0" },
  build: {
    target: "es2022",
    sourcemap: false,
    emptyOutDir: true,
  },
});