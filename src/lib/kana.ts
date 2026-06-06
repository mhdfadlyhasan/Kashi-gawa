export type ReadingMode = 'normal' | 'hiragana' | 'katakana' | 'romaji';

const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

export function katakanaToHiragana(str: string): string {
  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - KATAKANA_TO_HIRAGANA_OFFSET);
      }
      return char;
    })
    .join('');
}

const ROMAJI_MAP: Record<string, string> = {
  // Hiragana
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  // Small kana
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo', っ: 'tsu', ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
  // Katakana (same romaji)
  ア: 'a', イ: 'i', ウ: 'u', エ: 'e', オ: 'o',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'wo', ン: 'n',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  ャ: 'ya', ュ: 'yu', ョ: 'yo', ッ: 'tsu', ァ: 'a', ィ: 'i', ゥ: 'u', ェ: 'e', ォ: 'o',
};

const COMPOUND_ROMAJI: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  キャ: 'kya', キュ: 'kyu', キョ: 'kyo',
  シャ: 'sha', シュ: 'shu', ショ: 'sho',
  チャ: 'cha', チュ: 'chu', チョ: 'cho',
  ニャ: 'nya', ニュ: 'nyu', ニョ: 'nyo',
  ヒャ: 'hya', ヒュ: 'hyu', ヒョ: 'hyo',
  ミャ: 'mya', ミュ: 'myu', ミョ: 'myo',
  リャ: 'rya', リュ: 'ryu', リョ: 'ryo',
  ギャ: 'gya', ギュ: 'gyu', ギョ: 'gyo',
  ジャ: 'ja', ジュ: 'ju', ジョ: 'jo',
  ヂャ: 'ja', ヂュ: 'ju', ヂョ: 'jo',
  ビャ: 'bya', ビュ: 'byu', ビョ: 'byo',
  ピャ: 'pya', ピュ: 'pyu', ピョ: 'pyo',
};

export function kanaToRomaji(str: string): string {
  const hiragana = katakanaToHiragana(str);
  let result = '';
  let i = 0;
  while (i < hiragana.length) {
    // Check for sokuon (small tsu) - doubles the next consonant
    if (hiragana[i] === 'っ' || hiragana[i] === 'ッ') {
      if (i + 1 < hiragana.length) {
        const next = hiragana[i + 1];
        const nextRomaji = ROMAJI_MAP[next];
        if (nextRomaji) {
          result += nextRomaji[0]; // double the first consonant
          i++;
          continue;
        }
      }
      result += 'tsu';
      i++;
      continue;
    }

    // Check for compound (2-char sequence)
    if (i + 1 < hiragana.length) {
      const compound = hiragana[i] + hiragana[i + 1];
      if (COMPOUND_ROMAJI[compound]) {
        result += COMPOUND_ROMAJI[compound];
        i += 2;
        continue;
      }
    }

    // Check for long vowel mark (katakana only)
    if (hiragana[i] === 'ー') {
      result += result.slice(-1);
      i++;
      continue;
    }

    const romaji = ROMAJI_MAP[hiragana[i]];
    if (romaji) {
      result += romaji;
    } else {
      result += hiragana[i];
    }
    i++;
  }
  return result;
}

export function convertReading(reading: string, mode: ReadingMode): string {
  if (!reading) return '';
  switch (mode) {
    case 'hiragana':
      return katakanaToHiragana(reading);
    case 'katakana':
      return reading;
    case 'romaji':
      return kanaToRomaji(reading);
    default:
      return reading;
  }
}
