import { z } from 'zod';
import type { SbRichTextDoc } from '@storyblok/react';
export const faceKeys = ['front','right','back','left','top','bottom'] as const;
export const blockSchema = z.object({ _uid:z.string(), component:z.enum(['teaser','cube_section']), headline:z.string().optional(), intro:z.string().optional(), heading:z.string().optional(), text:z.custom<SbRichTextDoc>(v => typeof v==='object' && v!==null && 'type' in v && v.type==='doc').optional(), _editable:z.string().optional() });
export const storySchema = z.object({id:z.number(),full_slug:z.string(),content:z.object({_uid:z.string(),component:z.literal('cube_face'),body:z.array(blockSchema),seo_title:z.string().optional(),seo_description:z.string().optional(),_editable:z.string().optional()})});
export type CubeStory = z.infer<typeof storySchema>;
export type CubeBlock = z.infer<typeof blockSchema>;
export function faceKeyForStory(story:CubeStory){return faceKeys.find(key=>story.full_slug===`cube-${key}`);}
export function parseCubeStories(value:unknown):CubeStory[]{return z.object({stories:z.array(z.unknown())}).parse(value).stories.flatMap(item=>{const p=storySchema.safeParse(item);return p.success && faceKeyForStory(p.data)?[p.data]:[];});}
