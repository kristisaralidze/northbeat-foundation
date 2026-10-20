import { createFileRoute } from '@tanstack/react-router';
import { MissingAssets } from '@/components/admin/MissingAssets';
export const Route = createFileRoute('/admin/missing-assets')({
  head:()=>({meta:[{title:'Missing official assets | Northbeat admin'},{name:'description',content:'Review organisations needing official logos and covers.'},{property:'og:title',content:'Missing official assets | Northbeat admin'},{property:'og:description',content:'Review organisations needing official logos and covers.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
  component:MissingAssets,
});