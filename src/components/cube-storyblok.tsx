import { StoryblokComponent, StoryblokRichText, storyblokEditable, storyblokInit, type SbRichTextDoc, type SbBlokData } from '@storyblok/react';
import type { CubeBlock } from '@/lib/cube-content';
function Teaser({blok}:{blok:CubeBlock}){return <div {...storyblokEditable(blok._editable ? { _editable: blok._editable } : {})}><h1 className="mt-6 font-display text-6xl leading-none text-foreground md:text-8xl">{blok.headline}</h1><p className="mt-8 text-lg text-muted-foreground">{blok.intro}</p></div>;}
function ReadingSection({blok}:{blok:CubeBlock}){return <section {...storyblokEditable(blok._editable ? { _editable: blok._editable } : {})} className="mt-20 border-t border-border pt-10">{blok.heading&&<h2 className="font-display text-4xl text-foreground">{blok.heading}</h2>}{blok.text&&<StoryblokRichText document={JSON.parse(blok.text) as SbRichTextDoc} className="cube-reading mt-4 leading-relaxed text-muted-foreground"/>}</section>;}
storyblokInit({components:{teaser:Teaser,cube_section:ReadingSection}});
export function CubeStoryBlocks({blocks}:{blocks:CubeBlock[]}){return blocks.map(blok=><StoryblokComponent key={blok._uid} blok={blok as SbBlokData}/>);}
