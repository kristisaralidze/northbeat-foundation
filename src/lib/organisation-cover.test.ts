import { describe, expect, it } from 'vitest';
import { approvedCover, blockedImageHost, coverSafetyReason, extractCover, publicIPv4, publicWebsite, shouldDiscoverCover } from './organisation-cover';
describe('organisation cover rules', () => {
  it('prefers Open Graph over Twitter and resolves relative URLs', () => { expect(extractCover('<meta name="twitter:image" content="/twitter.jpg"><meta content="/og.jpg" property="og:image">', 'https://example.com/')).toBe('https://example.com/og.jpg'); });
  it('uses Twitter when Open Graph is absent', () => { expect(extractCover('<meta name="twitter:image" content="https://example.com/a.jpg">', 'https://example.com')).toBe('https://example.com/a.jpg'); });
  it('returns nothing without an image', () => { expect(extractCover('<title>Example</title>', 'https://example.com')).toBeNull(); });
  it('never overwrites an existing image', () => { expect(shouldDiscoverCover(null, 'https://example.com', 'https://example.com/manual.jpg', false)).toBe(false); });
  it('preserves explicit admin removal', () => { expect(shouldDiscoverCover(null, 'https://example.com', null, true)).toBe(false); });
  it('discovers only on new or changed websites', () => { expect(shouldDiscoverCover(null, 'https://example.com', null, false)).toBe(true); expect(shouldDiscoverCover('https://example.com', 'https://example.com', null, false)).toBe(false); });
  it('rejects local targets and private addresses', () => { expect(publicWebsite('http://127.0.0.1')).toBeNull(); expect(publicWebsite('http://host.local')).toBeNull(); expect(publicIPv4('10.0.0.1')).toBe(false); expect(publicIPv4('172.16.0.1')).toBe(false); expect(publicIPv4('8.8.8.8')).toBe(true); });
});
describe('cover approval safety', () => {
  const safe = { title: 'Example', name: 'Example', website: 'https://example.org', finalUrl: 'https://example.org', pageText: 'Health research', alt: 'Laboratory', image: 'https://example.org/cover.jpg', width: 800 };
  it('requires at least 800 pixels of width', () => { expect(coverSafetyReason({ ...safe, width: 799 })).toContain('minimum is 800px'); expect(coverSafetyReason(safe)).toBeNull(); });
  it.each(['casino', 'bonus', 'deposit', 'slot', 'betting', 'loan offer', 'crypto giveaway', 'adult'])('rejects unsafe page or alt content: %s', word => { expect(coverSafetyReason({ ...safe, pageText: word })).toContain('Unsafe content'); expect(coverSafetyReason({ ...safe, alt: word })).toContain('Unsafe content'); });
  it('rejects known advertising and redirect image domains', () => { expect(blockedImageHost('https://ads.doubleclick.net/x.jpg')).toBe(true); expect(coverSafetyReason({ ...safe, image: 'https://bit.ly/image' })).toContain('advertising'); });
  it('rejects an unrelated title on a changed domain', () => { expect(coverSafetyReason({ ...safe, title: 'Unrelated', finalUrl: 'https://unrelated.org' })).toContain('do not match'); });
  it('allows the stored domain when the page title is present', () => { expect(coverSafetyReason({ ...safe, title: 'Welcome' })).toBeNull(); });
  it('never publicly exposes pending or rejected images', () => { expect(approvedCover(safe.image, 'pending')).toBeNull(); expect(approvedCover(safe.image, 'rejected')).toBeNull(); expect(approvedCover(safe.image, 'approved')).toBe(safe.image); });
});