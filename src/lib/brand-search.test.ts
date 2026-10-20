import { expect,it } from 'vitest';
import { BRAND_SEARCH_DELAY,BRAND_SEARCH_MIN,brandSuggestions } from './brand-search';
it('starts search at two characters with a 300ms debounce',()=>{expect(BRAND_SEARCH_MIN).toBe(2);expect(BRAND_SEARCH_DELAY).toBe(300);});
it('limits search suggestions to five',()=>{expect(brandSuggestions(Array.from({length:8},(_,i)=>({name:`Brand ${i}`,domain:`brand${i}.fi`,icon:'https://cdn.brandfetch.io/logo.png'})))).toHaveLength(5);});
it('rejects unsafe domains and logo URLs',()=>{expect(brandSuggestions([{name:'Bad',domain:'evil.com/path'},{name:'Good',domain:'good.fi',icon:'javascript:alert(1)'}])).toEqual([{name:'Good',domain:'good.fi',logo:null}]);});