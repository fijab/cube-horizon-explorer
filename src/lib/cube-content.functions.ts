import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { parseCubeStories, type CubeStory } from './cube-content';
const hosts:Record<string,string>={eu:'api.storyblok.com',us:'api-us.storyblok.com',ap:'api-ap.storyblok.com',ca:'api-ca.storyblok.com',cn:'app.storyblokchina.cn'};
export const getCubeContent = createServerFn({method:'GET'}).handler(async ():Promise<{stories:CubeStory[];error:string|null}>=>{
 const gatewayKey=process.env['LOVABLE_API_KEY'];const contentKey=process.env['STORYBLOK_API_KEY_2'];
 const isPrerendering=process.env['TSS_PRERENDERING']==='true';
 if(!contentKey){
  if(isPrerendering)throw new Error('Static build requires STORYBLOK_API_KEY_2 in the build environment.');
  return {stories:[],error:'Storyblok content is not connected.'};
 }
 const query='starts_with=cube-&version=published&per_page=100';
 // Inside Lovable the key is a connector key routed through the gateway; external
 // builds supply the Storyblok public token directly, so no gateway key is needed.
 const host=hosts[(process.env['STORYBLOK_REGION']||'eu').toLowerCase()]??hosts.eu;
 const url=gatewayKey?`https://connector-gateway.lovable.dev/storyblok/stories?${query}`:`https://${host}/v2/cdn/stories?${query}&token=${encodeURIComponent(contentKey)}`;
 const headers:Record<string,string>=gatewayKey?{Authorization:`Bearer ${gatewayKey}`,'X-Connection-Api-Key':contentKey}:{};
 try{const response=await fetch(url,{headers,signal:AbortSignal.timeout(10000)});
 if(!response.ok){const body=await response.text();console.error(`Storyblok request failed [${response.status}]: ${body}`);throw new Error(`Storyblok content unavailable (${response.status})`);}
 const stories=parseCubeStories(await response.json());
 if(stories.length===0)throw new Error('No published cube face stories were returned by Storyblok.');
 return {stories,error:null};
 }catch(error){console.error('Storyblok content read failed',error);if(isPrerendering)throw error;return {stories:[],error:'Storyblok content is temporarily unavailable.'};}
});
// Static hosting has no server-function endpoint: keep the build's snapshot
// until an explicit editor invalidation or the next rebuild.
export const cubeContentOptions=queryOptions({queryKey:['cube-content'],queryFn:()=>getCubeContent(),staleTime:Infinity,refetchOnMount:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
