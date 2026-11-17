import { pathToFileURL } from 'node:url';

export async function checkStoryblokBuild(env, fetchContent = fetch) {
  const required = ['LOVABLE_API_KEY', 'STORYBLOK_API_KEY_2'];
  const missing = required.filter(name => !env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing Cloudflare BUILD environment variables: ${missing.join(', ')}. Add them in Cloudflare build settings, not only Worker runtime secrets. Lovable credentials do not automatically sync to Cloudflare. STORYBLOK_API_KEY_2 must be the linked connector key, not a raw Storyblok token.`);
  }
  const response = await fetchContent('https://connector-gateway.lovable.dev/storyblok/stories?starts_with=cube-&version=published&per_page=100', {
    headers: { Authorization: `Bearer ${env.LOVABLE_API_KEY}`, 'X-Connection-Api-Key': env.STORYBLOK_API_KEY_2 },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    // Provider bodies may contain credential metadata; never print them in CI.
    throw new Error(`Storyblok build check failed (HTTP ${response.status}). Verify both build credentials belong to the linked Storyblok delivery connection.`);
  }
  const payload = await response.json();
  const faces = new Set(['cube-front', 'cube-right', 'cube-back', 'cube-left', 'cube-top', 'cube-bottom']);
  const stories = Array.isArray(payload.stories) ? payload.stories.filter(story => faces.has(story.full_slug) && story.content?.component === 'cube_face') : [];
  if (!stories.length) throw new Error('Storyblok build check returned no published cube face stories. Publish the cube stories in the connected space.');
  return stories.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const count = await checkStoryblokBuild(process.env);
    console.log(`[Storyblok build check] ${count} published cube faces available.`);
  } catch (error) {
    console.error(`[Storyblok build check] ${error instanceof Error ? error.message : 'Content check failed.'}`);
    process.exitCode = 1;
  }
}