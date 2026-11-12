// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss, nitro etc. — do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Static output: "/" is rendered to HTML at build time with published Storyblok content baked in.
    pages: [{ path: "/" }],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});
