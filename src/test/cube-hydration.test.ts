import { describe, expect, it, vi } from 'vitest';
import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import { getRouter } from '@/router';
import { cubeContentOptions } from '@/lib/cube-content.functions';

describe('Static Storyblok content', () => {
  it('restores the build snapshot without requesting a server function', async () => {
    const server = getRouter();
    const snapshot = { stories: [{ id: 1, full_slug: 'cube-top', content: { _uid: 'top', component: 'cube_face', body: [{ _uid: 'teaser', component: 'teaser', headline: 'About FIJAB' }] } }], error: null };
    server.options.context?.queryClient.setQueryData(['cube-content'], snapshot);
    const serialized = await server.options.dehydrate?.();
    expect(serialized).toBeDefined();
    if (!serialized) throw new Error('Router did not serialize its content');
    const client = getRouter();
    await client.options.hydrate?.(JSON.parse(JSON.stringify(serialized)));
    const fetchContent = vi.fn().mockRejectedValue(new Error('No server on static hosting'));
    const restored = await client.options.context?.queryClient.ensureQueryData({ ...cubeContentOptions, queryFn: fetchContent });
    expect(restored).toEqual(snapshot);
    expect(fetchContent).not.toHaveBeenCalled();
  });

  it('keeps build content fresh and does not automatically refetch on mount, focus, or reconnect', () => {
    const client = new QueryClient();
    const snapshot = { stories: [], error: null };
    client.setQueryData(['cube-content'], snapshot);
    const saved = JSON.stringify(dehydrate(client));
    const restored = new QueryClient();
    hydrate(restored, JSON.parse(saved));
    const query = restored.getQueryCache().find({ queryKey: ['cube-content'] });
    const staleTime = cubeContentOptions.staleTime;
    expect(staleTime).toBe(Infinity);
    if (typeof staleTime !== 'number') throw new Error('Static content requires a numeric freshness duration');
    expect(query?.isStaleByTime(staleTime)).toBe(false);
    expect(cubeContentOptions.refetchOnMount).toBe(false);
    expect(cubeContentOptions.refetchOnWindowFocus).toBe(false);
    expect(cubeContentOptions.refetchOnReconnect).toBe(false);
  });
});