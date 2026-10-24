import {describe,it,expect} from 'vitest';
import {analyseLogoPixels} from './logo-check';
const pixels=(visible:number,value:number)=>Array.from({length:100},(_,i)=>i<visible?[value,value,value,255]:[0,0,0,0]).flat();
describe('stored logo check rules',()=>{
  it('is blank below 3% visible and not at 3%',()=>{expect(analyseLogoPixels(pixels(2,0)).blank).toBe(true);expect(analyseLogoPixels(pixels(3,0)).blank).toBe(false);});
  it('rejects a more than 95% light square',()=>{expect(analyseLogoPixels(pixels(96,255)).blank).toBe(true);expect(analyseLogoPixels(pixels(95,255)).blank).toBe(false);});
  it('uses dark tone at 5% dark logo pixels, light below',()=>{const p=pixels(100,255);for(let i=0;i<5;i++)p.splice(i*4,3,0,0,0);expect(analyseLogoPixels(p).tone).toBe('dark');p.splice(0,3,255,255,255);expect(analyseLogoPixels(p).tone).toBe('light');});
});