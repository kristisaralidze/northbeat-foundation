import { createFileRoute } from '@tanstack/react-router';
import { BrandImport } from '@/components/admin/BrandImport';
export const Route = createFileRoute('/admin/brand-data')({
  head:()=>({meta:[{title:'Fetch brand data | Northbeat admin'},{name:'description',content:'Import official Brandfetch logos, images and colours.'},{property:'og:title',content:'Fetch brand data | Northbeat admin'},{property:'og:description',content:'Import official Brandfetch logos, images and colours.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
  component:BrandImport,
});