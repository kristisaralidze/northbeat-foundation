import desktop from '@/assets/northbeat-atmosphere.webp.asset.json';
import phone from '@/assets/northbeat-atmosphere-phone.webp.asset.json';

/** Decorative, responsive copy of the Design Lab fabric photograph. */
export function AtmosphericImage({ className = '', eager = false }: { className?: string; eager?: boolean }) {
  return <picture aria-hidden="true" className={`nb-atmospheric-image ${className}`}>
    <source media="(max-width: 767px)" srcSet={phone.url} />
    <img src={desktop.url} alt="" width={1536} height={1024} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />
  </picture>;
}