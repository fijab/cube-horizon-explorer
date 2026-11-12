import {describe,it,expect} from 'vitest';
import {faceKeyForStory,parseCubeStories} from '@/lib/cube-content';
describe('Cube content',()=>{
 it('maps all six entries to cube faces',()=>{const keys=['front','right','back','left','top','bottom'];expect(parseCubeStories({stories:keys.map((key,id)=>({id,full_slug:`cube-${key}`,content:{_uid:key,component:'cube_face',body:[]}}))}).map(faceKeyForStory)).toEqual(keys);});
 it('excludes unrelated stories',()=>{expect(parseCubeStories({stories:[{id:1,full_slug:'home',content:{_uid:'home',component:'cube_face',body:[]}}]})).toEqual([]);});
});
