async function test() {
  const mod = await import('kuromoji/src/loader/BrowserDictionaryLoader.js');
  console.log(mod);
}
