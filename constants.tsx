
import { Word } from './types';

/**
 * DATA INPUT STRATEGY:
 * For 2,000+ words, you should ideally load this from a external JSON file.
 * Below is the structured format required for the app's injection.
 */
export const INITIAL_WORDS: Word[] = [
  { id: '1', term: 'Abate', definition: 'To become less active or intense.', partOfSpeech: 'verb', example: 'The storm began to abate after midnight.', synonyms: ['subside', 'ebb'] },
  { id: '2', term: 'Abjure', definition: 'To solemnly renounce a belief.', partOfSpeech: 'verb', example: 'He abjured his allegiance to the king.', synonyms: ['renounce', 'reject'] },
  { id: '3', term: 'Capricious', definition: 'Given to sudden changes of mood.', partOfSpeech: 'adjective', example: 'The weather here is notoriously capricious.', synonyms: ['fickle', 'volatile'] },
  { id: '4', term: 'Ephemeral', definition: 'Lasting for a very short time.', partOfSpeech: 'adjective', example: 'The beauty of the sunset was ephemeral.', synonyms: ['fleeting', 'transient'] },
  { id: '5', term: 'Laconic', definition: 'Using very few words.', partOfSpeech: 'adjective', example: 'His laconic reply left us wondering.', synonyms: ['terse', 'concise'] },
  { id: '6', term: 'Mitigate', definition: 'To make less severe.', partOfSpeech: 'verb', example: 'We took steps to mitigate the risks.', synonyms: ['alleviate', 'lessen'] },
  { id: '7', term: 'Pragmatic', definition: 'Dealing with things sensibly.', partOfSpeech: 'adjective', example: 'She took a pragmatic view of the problem.', synonyms: ['practical', 'realistic'] },
  { id: '8', term: 'Sycophant', definition: 'A self-seeking flatterer.', partOfSpeech: 'noun', example: 'The CEO was surrounded by sycophants.', synonyms: ['toady', 'flatterer'] },
  { id: '9', term: 'Zealous', definition: 'Great energy or enthusiasm.', partOfSpeech: 'adjective', example: 'The zealous detective found the clue.', synonyms: ['fervent', 'passionate'] },
  { id: '10', term: 'Abstain', definition: 'Restrain oneself from doing something.', partOfSpeech: 'verb', example: 'I decided to abstain from voting.', synonyms: ['refrain', 'forbear'] },
  { id: '11', term: 'Anachronism', definition: 'Something out of its proper time.', partOfSpeech: 'noun', example: 'The sword in the sci-fi movie was an anachronism.', synonyms: ['misplacement'] },
  { id: '12', term: 'Belligerent', definition: 'Hostile and aggressive.', partOfSpeech: 'adjective', example: 'The customer became belligerent when denied a refund.', synonyms: ['combative', 'pugnacious'] },
  { id: '13', term: 'Chicanery', definition: 'The use of trickery to achieve a purpose.', partOfSpeech: 'noun', example: 'The politician was accused of financial chicanery.', synonyms: ['deception', 'subterfuge'] },
  { id: '14', term: 'Desiccated', definition: 'Drained of emotional vitality; dried out.', partOfSpeech: 'adjective', example: 'The desiccated landscape cracked under the sun.', synonyms: ['dried', 'withered'] },
  { id: '15', term: 'Equivocate', definition: 'Use ambiguous language to conceal truth.', partOfSpeech: 'verb', example: 'The witness began to equivocate when asked about the time.', synonyms: ['prevaricate', 'stall'] },
  { id: '16', term: 'Gullible', definition: 'Easily persuaded to believe something.', partOfSpeech: 'adjective', example: 'He was so gullible he bought the "magic" beans.', synonyms: ['naive', 'credulous'] },
  { id: '17', term: 'Inimical', definition: 'Tending to obstruct or harm.', partOfSpeech: 'adjective', example: 'Actions inimical to our interests will be punished.', synonyms: ['harmful', 'hostile'] },
  { id: '18', term: 'Loquacious', definition: 'Tending to talk a great deal.', partOfSpeech: 'adjective', example: 'The loquacious barber kept me in the chair for an hour.', synonyms: ['talkative', 'garrulous'] },
  { id: '19', term: 'Opaque', definition: 'Not able to be seen through; not transparent.', partOfSpeech: 'adjective', example: 'The technical jargon made the instructions opaque.', synonyms: ['cloudy', 'obscure'] },
  { id: '20', term: 'Pedant', definition: 'A person excessively concerned with minor details.', partOfSpeech: 'noun', example: 'The history professor was a bit of a pedant.', synonyms: ['perfectionist'] }
];

export const XP_PER_QUIZ = 50;
export const XP_PER_WORD_UPGRADE = 15;

export const MASTERY_COLORS = {
  0: { label: 'Not Started', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', hex: '#f43f5e' },
  1: { label: 'Learning', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', hex: '#f97316' },
  2: { label: 'Getting Close', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', hex: '#fbbf24' },
  3: { label: 'Mastered', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hex: '#10b981' }
};
