import path from "path";

// Simplified Vite config without React plugins (works around local
// plugin resolution issues on this machine).
export default () => ({
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
