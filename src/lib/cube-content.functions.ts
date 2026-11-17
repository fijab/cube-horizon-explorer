import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { parseCubeStories, type CubeStory } from './cube-content';
export const getCubeContent = createServerFn({method:'GET'}).handler(async ():Promise<{stories:CubeStory[];error:string|null}>=>{
 const gatewayKey=process.env['LOVABLE_API_KEY'];const contentKey=process.env['STORYBLOK_API_KEY_2'];
 const isPrerendering=process.env['TSS_PRERENDERING']==='true';
 if(!gatewayKey||!contentKey){
  if(isPrerendering)throw new Error('Static build requires LOVABLE_API_KEY and STORYBLOK_API_KEY_2 in the build environment.');
  return {stories:[],error:'Storyblok content is not connected.'};
 }
 try{const response=await fetch('https://connector-gateway.lovable.dev/storyblok/stories?starts_with=cube-&version=published&per_page=100',{headers:{Authorization:`Bearer ${gatewayKey}`,'X-Connection-Api-Key':contentKey},signal:AbortSignal.timeout(10000)});
 if(!response.ok){const body=await response.text();console.error(`Storyblok request failed [${response.status}]: ${body}`);throw new Error(`Storyblok content unavailable (${response.status}): ${body}`);}
 const stories=parseCubeStories(await response.json());
 if(stories.length===0)throw new Error('No published cube face stories were returned by Storyblok.');
 return {stories,error:null};
 }catch(error){console.error('Storyblok content read failed',error);if(isPrerendering)throw error;return {stories:[],error:'Storyblok content is temporarily unavailable.'};}
});
// Static hosting has no server-function endpoint: keep the build's snapshot
// until an explicit editor invalidation or the next rebuild.
export const cubeContentOptions=queryOptions({queryKey:['cube-content'],queryFn:()=>getCubeContent(),staleTime:Infinity,refetchOnMount:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
