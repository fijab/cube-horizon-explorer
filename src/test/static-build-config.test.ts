import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lovable.dev/vite-tanstack-config', () => ({
  defineConfig: (options: { nitro: boolean; tanstackStart: { pages: { path: string }[]; prerender: { enabled: boolean } } }) => options,
}));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('Static build environment', () => {
  it('skips Worker packaging outside Lovable and prerenders the cube', async () => {
    vi.stubEnv('LOVABLE_SANDBOX', '');
    vi.stubEnv('DEV_SERVER__PROJECT_PATH', '');
    const { default: config } = await import('../../vite.config');
    expect(config).toMatchObject({ nitro: false, tanstackStart: { pages: [{ path: '/' }], prerender: { enabled: true } } });
  });

  it('preserves managed packaging in Lovable', async () => {
    vi.stubEnv('LOVABLE_SANDBOX', '1');
    vi.stubEnv('DEV_SERVER__PROJECT_PATH', '');
    const { default: config } = await import('../../vite.config');
    expect(config).toMatchObject({ nitro: true });
  });
});