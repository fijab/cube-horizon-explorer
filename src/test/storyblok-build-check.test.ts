import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

// Load the standalone CI script without a declaration-only wrapper.
const source = readFileSync(`${process.cwd()}/scripts/check-storyblok.mjs`, 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { checkStoryblokBuild } = await import(/* @vite-ignore */ moduleUrl);

describe('Storyblok build prerequisites', () => {
  it('requires only STORYBLOK_API_KEY_2 before making any request', async () => {
    const request = vi.fn();
    await expect(checkStoryblokBuild({}, request)).rejects.toThrow('STORYBLOK_API_KEY_2');
    expect(request).not.toHaveBeenCalled();
  });
  it('reports provider status without exposing its response body', async () => {
    const request = vi.fn().mockResolvedValue(new Response('private provider detail', { status: 401 }));
    await expect(checkStoryblokBuild({ LOVABLE_API_KEY: 'test', STORYBLOK_API_KEY_2: 'test' }, request)).rejects.toThrow('HTTP 401');
  });
  it('builds with only STORYBLOK_API_KEY_2 by calling the Storyblok CDN directly', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ stories: [{ full_slug: 'cube-top', content: { component: 'cube_face' } }] }));
    await expect(checkStoryblokBuild({ STORYBLOK_API_KEY_2: 'tok' }, request)).resolves.toBe(1);
    expect(request.mock.calls[0]?.[0]).toContain('https://api.storyblok.com/v2/cdn/stories');
    expect(request.mock.calls[0]?.[0]).toContain('token=tok');
  });
  it('accepts published cube content', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ stories: [{ full_slug: 'cube-front', content: { component: 'cube_face' } }] }));
    await expect(checkStoryblokBuild({ LOVABLE_API_KEY: 'test', STORYBLOK_API_KEY_2: 'test' }, request)).resolves.toBe(1);
  });
});