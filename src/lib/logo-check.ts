import { brandfetchLogoUrl } from './organisation-logo';
export type LogoResult = { logo_resolved_url: string | null; logo_tone: 'dark' | 'light'; logo_status: 'ok' | 'light' | 'missing'; logo_check_error: string | null };
export function analyseLogoPixels(pixels: ArrayLike<number>) {
  const total = pixels.length / 4; let visible = 0, light = 0, dark = 0;
  for (let i=0;i<pixels.length;i+=4) {
    const a = pixels[i+3] ?? 0; if (a < 16) continue;
    visible++; const luminance = .2126*(pixels[i] ?? 0)+.7152*(pixels[i+1] ?? 0)+.0722*(pixels[i+2] ?? 0);
    if (luminance >= 240) light++; if (luminance < 128) dark++;
  }
  return { blank: !total || visible/total < .03 || (light/total > .95 && dark/total < .03), tone: dark/Math.max(1,visible) >= .05 ? 'dark' as const : 'light' as const };
}
export async function checkLogoUrl(url: string): Promise<LogoResult> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve,reject)=>{
      const img=new Image(); img.crossOrigin='anonymous'; const timer=setTimeout(()=>reject(new Error('Image timed out')),12000);
      img.onload=()=>{clearTimeout(timer);resolve(img);}; img.onerror=()=>{clearTimeout(timer);reject(new Error('Image could not be read with CORS'));}; img.src=url;
    });
    const canvas=document.createElement('canvas'); canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas unavailable');
    ctx.drawImage(image,0,0,128,128);const result=analyseLogoPixels(ctx.getImageData(0,0,128,128).data);
    return {logo_resolved_url:result.blank?null:url,logo_tone:result.tone,logo_status:result.blank?'missing':result.tone==='light'?'light':'ok',logo_check_error:result.blank?'Blank image':null};
  } catch(e) {return {logo_resolved_url:null,logo_tone:'dark',logo_status:'missing',logo_check_error:e instanceof Error?e.message:'Image unavailable'};}
}
export async function resolveOrganisationLogo(row: {website:string|null;logo_url:string|null;logo_choice:string|null;logo_image_source?:string|null;logo_manual_required?:boolean}): Promise<LogoResult> {
  if(row.logo_url && (row.logo_choice==='upload'||row.logo_image_source==='admin_upload')) return checkLogoUrl(row.logo_url);
  if(row.logo_manual_required)return {logo_resolved_url:null,logo_tone:'dark',logo_status:'missing',logo_check_error:'Official upload requested'};
  let last:LogoResult={logo_resolved_url:null,logo_tone:'dark',logo_status:'missing',logo_check_error:'No website'};
  for(const type of ['icon','logo']) {const url=brandfetchLogoUrl(row.website,type);if(!url)continue;last=await checkLogoUrl(url);if(last.logo_status!=='missing')return last;}
  return last;
}