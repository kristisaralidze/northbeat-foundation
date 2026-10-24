declare module 'opentype.js';
declare module 'pngjs' {
  export class PNG { constructor(o: { width: number; height: number }); width: number; height: number; data: Buffer; static sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array }; write(p: PNG): Buffer } }
}
