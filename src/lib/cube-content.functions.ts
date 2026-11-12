import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { parseCubeStories, type CubeStory } from './cube-content';
export const getCubeContent = createServerFn({method:'GET'}).handler(async ():Promise<{stories:CubeStory[];error:string|null}>=>{
 const gatewayKey=process.env['LOVABLE_API_KEY'];const contentKey=process.env['STORYBLOK_API_KEY_2'];
 if(!gatewayKey||!contentKey)return {stories:[],error:'Storyblok content is not connected.'};
 try{const response=await fetch('https://connector-gateway.lovable.dev/storyblok/stories?starts_with=cube-&version=published&per_page=100',{headers:{Authorization:`Bearer ${gatewayKey}`,'X-Connection-Api-Key':contentKey},signal:AbortSignal.timeout(10000)});
 if(!response.ok){const body=await response.text();console.error(`Storyblok request failed [${response.status}]: ${body}`);return {stories:[],error:`Storyblok content unavailable (${response.status}).`};}
 return {stories:parseCubeStories(await response.json()),error:null};
 }catch(error){console.error('Storyblok content read failed',error);return {stories:[],error:'Storyblok content is temporarily unavailable.'};}
});
export const cubeContentOptions=queryOptions({queryKey:['cube-content'],queryFn:()=>getCubeContent(),staleTime:60000});
