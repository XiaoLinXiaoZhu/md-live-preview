import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3002,
    forwardConsole: {
      unhandledErrors: true,
      logLevels: ["error", "warn"],
    },
  },
  root: ".",
});
