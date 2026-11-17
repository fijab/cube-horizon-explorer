// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss, nitro etc. — do NOT add them manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // External static builds use TanStack's Node preview renderer, not Nitro's
  // Cloudflare Worker wrapper. Lovable still needs its managed Worker output.
  nitro: process.env['LOVABLE_SANDBOX'] === '1' || Boolean(process.env['DEV_SERVER__PROJECT_PATH']),
  tanstackStart: {
    server: { entry: "server" },
    // Static output: "/" is rendered to HTML at build time with published Storyblok content baked in.
    pages: [{ path: "/" }],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});
