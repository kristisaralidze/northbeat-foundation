import { describe, expect, it } from 'vitest';
import { extractCover, publicIPv4, publicWebsite, shouldDiscoverCover } from './organisation-cover';
describe('organisation cover rules', () => {
  it('prefers Open Graph over Twitter and resolves relative URLs', () => { expect(extractCover('<meta name="twitter:image" content="/twitter.jpg"><meta content="/og.jpg" property="og:image">', 'https://example.com/')).toBe('https://example.com/og.jpg'); });
  it('uses Twitter when Open Graph is absent', () => { expect(extractCover('<meta name="twitter:image" content="https://example.com/a.jpg">', 'https://example.com')).toBe('https://example.com/a.jpg'); });
  it('returns nothing without an image', () => { expect(extractCover('<title>Example</title>', 'https://example.com')).toBeNull(); });
  it('never overwrites an existing image', () => { expect(shouldDiscoverCover(null, 'https://example.com', 'https://example.com/manual.jpg', false)).toBe(false); });
  it('preserves explicit admin removal', () => { expect(shouldDiscoverCover(null, 'https://example.com', null, true)).toBe(false); });
  it('discovers only on new or changed websites', () => { expect(shouldDiscoverCover(null, 'https://example.com', null, false)).toBe(true); expect(shouldDiscoverCover('https://example.com', 'https://example.com', null, false)).toBe(false); });
  it('rejects local targets and private addresses', () => { expect(publicWebsite('http://127.0.0.1')).toBeNull(); expect(publicWebsite('http://host.local')).toBeNull(); expect(publicIPv4('10.0.0.1')).toBe(false); expect(publicIPv4('172.16.0.1')).toBe(false); expect(publicIPv4('8.8.8.8')).toBe(true); });
});