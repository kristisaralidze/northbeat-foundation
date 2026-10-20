import { describe, expect, it } from 'vitest';
import { BRANDFETCH_CLIENT_ID, organisationDomain, organisationLogoUrl } from './organisation-logo';
describe('organisation logos', () => {
  it('uses the supplied public client ID for organisation logos', () => {
    expect(BRANDFETCH_CLIENT_ID).toBe('1idCGaWDUDXkjAD579-');
    expect(organisationLogoUrl(null, 'https://curifylabs.com')).toBe('https://cdn.brandfetch.io/domain/curifylabs.com/w/128/h/128/fallback/404/type/icon?c=1idCGaWDUDXkjAD579-');
  });
  it('strips protocol, www and paths from website domains', () => {
    expect(organisationDomain('https://www.curifylabs.com/about?x=1')).toBe('curifylabs.com');
    expect(organisationDomain('www.curifylabs.com/about')).toBe('curifylabs.com');
    expect(organisationDomain('http://www.curifylabs.com:8080/')).toBe('curifylabs.com');
  });
  it('builds the specified 128px Brandfetch icon URL', () => {
    expect(organisationLogoUrl(null, 'https://www.curifylabs.com/about', 'test-client')).toBe('https://cdn.brandfetch.io/domain/curifylabs.com/w/128/h/128/fallback/404/type/icon?c=test-client');
  });
  it('always uses the uploaded logo instead of Brandfetch', () => {
    expect(organisationLogoUrl('https://images.example.org/upload.png', 'https://curifylabs.com', 'test-client')).toBe('https://images.example.org/upload.png');
  });
  it('does not request Brandfetch without an actual client ID', () => {
    expect(organisationLogoUrl(null, 'https://curifylabs.com', '')).toBeNull();
  });
  it('does not request a logo without a valid website', () => {
    for (const value of [null, '', 'javascript:alert(1)', 'not a domain', 'https://user:pass@example.org']) expect(organisationLogoUrl(null, value, 'test-client')).toBeNull();
  });
});import { brandfetchLogoUrl, acceptableLogoShape, acceptableLogoType } from './organisation-logo';
describe('logo choice rules', () => {
  it('defaults to the 256px icon with fallback=404', () => {
    expect(brandfetchLogoUrl('https://www.aalto.fi')).toBe('https://cdn.brandfetch.io/domain/aalto.fi/w/256/h/256/type/icon?c=1idCGaWDUDXkjAD579-&fallback=404');
  });
  it('builds dark logo and symbol versions', () => {
    expect(brandfetchLogoUrl('aalto.fi', 'logo-dark')).toBe('https://cdn.brandfetch.io/domain/aalto.fi/w/256/h/256/theme/dark/type/logo?c=1idCGaWDUDXkjAD579-&fallback=404');
    expect(brandfetchLogoUrl('aalto.fi', 'symbol')).toContain('/type/symbol?');
  });
  it('rejects logos wider than 3:1', () => { expect(acceptableLogoShape(300, 100)).toBe(true); expect(acceptableLogoShape(301, 100)).toBe(false); });
  it('rejects JPEG photos', () => { expect(acceptableLogoType('image/jpeg')).toBe(false); expect(acceptableLogoType('image/svg+xml')).toBe(true); expect(acceptableLogoType('image/png')).toBe(true); });
});
