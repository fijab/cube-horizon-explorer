import { pathToFileURL } from 'node:url';

const hosts = { eu: 'api.storyblok.com', us: 'api-us.storyblok.com', ap: 'api-ap.storyblok.com', ca: 'api-ca.storyblok.com', cn: 'app.storyblokchina.cn' };

// Lovable uses the connector gateway (needs LOVABLE_API_KEY); external builds
// only need STORYBLOK_API_KEY_2 holding the Storyblok public access token.
export function storyblokRequest(env) {
  const query = 'starts_with=cube-&version=published&per_page=100';
  if (env.LOVABLE_API_KEY?.trim()) {
    return { url: `https://connector-gateway.lovable.dev/storyblok/stories?${query}`, headers: { Authorization: `Bearer ${env.LOVABLE_API_KEY}`, 'X-Connection-Api-Key': env.STORYBLOK_API_KEY_2 } };
  }
  const host = hosts[(env.STORYBLOK_REGION || 'eu').trim().toLowerCase()] ?? hosts.eu;
  return { url: `https://${host}/v2/cdn/stories?${query}&token=${encodeURIComponent(env.STORYBLOK_API_KEY_2)}`, headers: {} };
}

export async function checkStoryblokBuild(env, fetchContent = fetch) {
  if (!env.STORYBLOK_API_KEY_2?.trim()) {
    throw new Error('Missing build environment variable STORYBLOK_API_KEY_2. Set it to your Storyblok public access token in the host\'s build settings.');
  }
  const { url, headers } = storyblokRequest(env);
  const response = await fetchContent(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    // Provider bodies may contain credential metadata; never print them in CI.
    throw new Error(`Storyblok build check failed (HTTP ${response.status}). Verify STORYBLOK_API_KEY_2 is a valid public access token for the cube space (set STORYBLOK_REGION if the space is not in the EU).`);
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
