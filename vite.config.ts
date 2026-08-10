import { defineConfig, type Plugin } from "vite";

/**
 * Mutes Vite HMR browser spam:
 *   [vite] connecting...
 *   [vite] connected.
 * Strips those calls from the served client module (reliable) and
 * also patches console early as a safety net for related chatter.
 */
function quietDevConsole(): Plugin {
  const boot = `(() => {
  const mute = (args) => {
    for (const a of args) {
      if (typeof a !== "string") continue;
      if (a.includes("[vite]")) return true;
      if (a.startsWith("[Violation]")) return true;
    }
    return false;
  };
  for (const method of ["log", "info", "debug", "warn"]) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      if (mute(args)) return;
      original(...args);
    };
  }
})();`;

  return {
    name: "soe-quiet-dev-console",
    apply: "serve",
    enforce: "pre",
    transform(code, id) {
      // /@vite/client → …/vite/dist/client/client.mjs (Windows + Unix)
      const norm = id.replace(/\\/g, "/");
      const isViteClient =
        norm.includes("/vite/dist/client/client.mjs")
        || norm.endsWith("/vite/dist/client/client.mjs")
        || /\/@vite\/client(?:\?|$)/.test(norm);
      if (!isViteClient) return;

      let next = code
        // Direct status lines (Vite 6–8)
        .replace(/console\.debug\(\s*["'`]\[vite\] connecting\.\.\.["'`]\s*\);\s*/g, "")
        .replace(/console\.debug\(\s*[`'"]\[vite\] connected\.['"`]\s*\);\s*/g, "")
        // HMRClient debug logger → keep interface, drop chatter
        .replace(
          /debug:\s*\(\.\.\.msg\)\s*=>\s*console\.debug\(\s*["'`]\[vite\]["'`]\s*,\s*\.\.\.msg\s*\)/g,
          "debug: () => {}",
        );
      if (next === code) return;
      return { code: next, map: null };
    },
    transformIndexHtml: {
      order: "pre",
      handler() {
        return [{
          tag: "script",
          // Classic blocking — runs before module /@vite/client
          injectTo: "head-prepend",
          children: boot,
        }];
      },
    },
  };
}

export default defineConfig({
  plugins: [quietDevConsole()],
  logLevel: "warn",
  clearScreen: false,
  server: {
    hmr: true,
  },
});
