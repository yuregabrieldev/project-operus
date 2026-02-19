import path from "path";

export default () => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
