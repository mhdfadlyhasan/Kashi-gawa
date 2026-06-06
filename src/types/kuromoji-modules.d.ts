declare module 'kuromoji/src/loader/BrowserDictionaryLoader.js' {
  class BrowserDictionaryLoader {
    constructor(dic_path: string);
    loadArrayBuffer(url: string, callback: (err: any, buffer: ArrayBuffer | null) => void): void;
  }
  export = BrowserDictionaryLoader;
}
