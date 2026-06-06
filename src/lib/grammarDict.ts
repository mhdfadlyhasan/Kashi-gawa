export const GRAMMAR_DICT: Record<string, string> = {
  'えない': 'potential negative',
  'て': 'te-form (connective)',
  'た': 'past tense',
  'ます': 'polite form',
  'ました': 'polite past',
  'ません': 'polite negative',
  'ませんでした': 'polite past negative',
  'る': 'dictionary form',
  'ない': 'negative',
  'られる': 'passive / potential',
  'させる': 'causative',
  'よう': 'volitional',
  'ば': 'conditional',
  'たら': 'past conditional',
  'ながら': 'while doing',
  'ばかり': 'just did',
  'っぱなし': 'leave in a state',
  '切る': 'do to completion',
  '始める': 'begin to do',
  '終わる': 'finish doing',
  '続ける': 'continue doing',
  '易い': 'easy to do',
  '難い': 'difficult to do',
  'がち': 'tend to do',
  '気味': 'slightly tend to',
  'っこない': 'never / not at all',
  '得る': 'possible to do',
  'かける': 'start to do / half-done',
  '出す': 'start doing suddenly',
  '過ぎる': 'do too much',
  '直す': 'do again / redo',
  '合う': 'do together / do for each other',
  '込む': 'go deeply into',
  '上げる': 'raise / finish completely',
};

export function findGrammarExplanation(surfaceForm: string): string | null {
  for (const [suffix, explanation] of Object.entries(GRAMMAR_DICT)) {
    if (surfaceForm.endsWith(suffix)) {
      return explanation;
    }
  }
  return null;
}
