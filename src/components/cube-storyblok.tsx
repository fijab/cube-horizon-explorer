import { StoryblokComponent, StoryblokRichText, storyblokEditable, storyblokInit, type SbBlokData } from '@storyblok/react';
import type { CubeBlock } from '@/lib/cube-content';
function Teaser({blok}:{blok:CubeBlock}){return <div {...storyblokEditable(blok)}><h1 className="mt-6 font-display text-6xl leading-none text-foreground md:text-8xl">{blok.headline}</h1><p className="mt-8 text-lg text-muted-foreground">{blok.intro}</p></div>;}
function ReadingSection({blok}:{blok:CubeBlock}){return <section {...storyblokEditable(blok)} className="mt-20 border-t border-border pt-10">{blok.heading&&<h2 className="font-display text-4xl text-foreground">{blok.heading}</h2>}{blok.text&&<StoryblokRichText document={blok.text} className="cube-reading mt-4 leading-relaxed text-muted-foreground"/>}</section>;}
storyblokInit({components:{teaser:Teaser,cube_section:ReadingSection}});
export function CubeStoryBlocks({blocks}:{blocks:CubeBlock[]}){return blocks.map(blok=><StoryblokComponent key={blok._uid} blok={blok as SbBlokData}/>);}
