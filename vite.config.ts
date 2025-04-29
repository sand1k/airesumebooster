import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Async function to load plugins
async function getDevPlugins() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographer = await import("@replit/vite-plugin-cartographer");
    return [cartographer.cartographer()];
  }
  return [];
}

export default defineConfig(async ({ mode }) => {
  // Load env file based on `mode` in the root directory
  const env = loadEnv(mode, process.cwd(), '');
  const devPlugins = await getDevPlugins();

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...devPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: path.resolve(__dirname, "client"),
    envDir: __dirname, // Point to the root directory for env files
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: 5000,
      host: "0.0.0.0",
      proxy: {
        '/api': {
          target: process.env.NODE_ENV === 'production' 
            ? 'http://localhost:5000'  // In production, API is on same server
            : 'http://localhost:5001', // In development, separate API server
          changeOrigin: true,
        }
      }
    }
  }
});
