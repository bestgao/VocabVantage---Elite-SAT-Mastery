
import { Word } from './types';

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
  { id: '20', term: 'Pedant', definition: 'A person excessively concerned with minor details.', partOfSpeech: 'noun', example: 'The history professor was a bit of a pedant.', synonyms: ['perfectionist'] },
  { id: '21', term: 'Alacrity', definition: 'Brisk and cheerful readiness.', partOfSpeech: 'noun', example: 'She accepted the invitation with alacrity.', synonyms: ['eagerness', 'willingness'] },
  { id: '22', term: 'Boisterous', definition: 'Noisy, energetic, and cheerful.', partOfSpeech: 'adjective', example: 'The boisterous crowd cheered for the winning team.', synonyms: ['rowdy', 'clamorous'] },
  { id: '23', term: 'Complacent', definition: 'Showing uncritical satisfaction with oneself.', partOfSpeech: 'adjective', example: 'We cannot afford to be complacent about our security.', synonyms: ['smug', 'self-satisfied'] },
  { id: '24', term: 'Deference', definition: 'Humble submission and respect.', partOfSpeech: 'noun', example: 'He addressed her with the deference due to her age.', synonyms: ['respect', 'esteem'] },
  { id: '25', term: 'Enervate', definition: 'To cause someone to feel drained of energy.', partOfSpeech: 'verb', example: 'The hot sun began to enervate the hikers.', synonyms: ['exhaust', 'weaken'] },
  { id: '26', term: 'Furtive', definition: 'Attempting to avoid notice, typically because of guilt.', partOfSpeech: 'adjective', example: 'They spent a furtive day together in the city.', synonyms: ['secretive', 'surreptitious'] },
  { id: '27', term: 'Garrulous', definition: 'Excessively talkative, especially on trivial matters.', partOfSpeech: 'adjective', example: 'The garrulous neighbor kept her talking for an hour.', synonyms: ['talkative', 'loquacious'] },
  { id: '28', term: 'Harangue', definition: 'A lengthy and aggressive speech.', partOfSpeech: 'noun', example: 'The coach delivered a loud harangue to the players.', synonyms: ['tirade', 'lecture'] },
  { id: '29', term: 'Impetuous', definition: 'Acting or done quickly without thought or care.', partOfSpeech: 'adjective', example: 'Her impetuous nature often led her into trouble.', synonyms: ['impulsive', 'rash'] },
  { id: '30', term: 'Jovial', definition: 'Cheerful and friendly.', partOfSpeech: 'adjective', example: 'He was in a jovial mood after the news.', synonyms: ['cheerful', 'jolly'] }
];

export const SAT_TRANSITIONS = [
  { s1: "The study showed significant results.", s2: "the sample size was quite small.", options: ["However", "Therefore", "Moreover", "Likewise"], correct: 0, type: "Contrast" },
  { s1: "Exercise improves cardiovascular health.", s2: "it has been linked to better mental clarity.", options: ["In fact", "Nevertheless", "Instead", "Meanwhile"], correct: 0, type: "Addition" },
  { s1: "The temperature dropped below freezing.", s2: "the water in the pipes expanded and burst.", options: ["Consequently", "Conversely", "Similarly", "Regardless"], correct: 0, type: "Cause-Effect" },
  { s1: "She had never traveled abroad before.", s2: "she felt remarkably comfortable in the bustling streets of Tokyo.", options: ["Yet", "Furthermore", "Accordingly", "For instance"], correct: 0, type: "Contrast" }
];

export const SYNTAX_CHALLENGES = [
  { text: "The team of scientists [was] researching the [effects] of gravity; [however] they [hadnt] found the answer.", errorIndex: 2, correction: "however, (missing punctuation)", options: ["was", "effects", "however", "hadnt"] },
  { text: "Neither the [students] nor the [teacher] [were] aware that the [bell] had already rung.", errorIndex: 2, correction: "was (subject-verb agreement)", options: ["students", "teacher", "were", "bell"] },
  { text: "After [finishing] the race, the [medals] [were] [handed] out to the winners.", errorIndex: 1, correction: "The runners (misplaced modifier)", options: ["finishing", "medals", "were", "handed"] }
];

export const XP_PER_QUIZ = 50;
export const XP_PER_WORD_UPGRADE = 15;

export const MASTERY_COLORS = {
  0: { label: 'Level 1: Hard', bg: 'bg-rose-950/10', text: 'text-rose-900', border: 'border-rose-950', hex: '#4c0519' },
  1: { label: 'Level 2: Learning', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500', hex: '#ea580c' },
  2: { label: 'Level 3: Review', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-400', hex: '#ca8a04' },
  3: { label: 'Level 4: Mastered', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', hex: '#10b981' }
};
