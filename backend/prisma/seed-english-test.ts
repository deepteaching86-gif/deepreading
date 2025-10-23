/**
 * English Adaptive Test - Sample Data Seeding
 * ============================================
 *
 * Seeds 40 sample items for initial testing:
 * - 13 Grammar items
 * - 14 Vocabulary items (VST format)
 * - 13 Reading items
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding English Adaptive Test sample data...');

  // ===== 1. Create Sample Passages for Reading Items =====
  const passages = await Promise.all([
    // Low difficulty passage
    prisma.passage.create({
      data: {
        title: 'The School Library',
        content: `The school library is a quiet place where students can read books and study.
Mrs. Johnson is the librarian. She helps students find books they like.
The library has many kinds of books: fiction, non-fiction, and magazines.
Students must be quiet in the library so everyone can concentrate.`,
        wordCount: 52,
        lexileScore: 400,
        arLevel: 2.5,
        genre: 'informational',
      },
    }),

    // Medium difficulty passage
    prisma.passage.create({
      data: {
        title: 'Climate Change and Polar Bears',
        content: `Polar bears are facing serious challenges due to climate change. As Arctic ice melts,
these magnificent animals lose their hunting grounds. Polar bears primarily hunt seals,
which they catch on sea ice. With less ice available, bears must swim longer distances,
expending more energy while finding less food. Scientists estimate that polar bear populations
could decline by 30% over the next few decades if current trends continue.`,
        wordCount: 72,
        lexileScore: 950,
        arLevel: 6.8,
        genre: 'scientific',
      },
    }),

    // High difficulty passage
    prisma.passage.create({
      data: {
        title: 'The Paradox of Choice',
        content: `Contemporary consumer culture presents an interesting paradox: while an abundance
of choices theoretically empowers consumers, excessive options can paradoxically diminish satisfaction
and increase anxiety. Psychologist Barry Schwartz argues that when faced with too many alternatives,
individuals experience decision paralysis and subsequent regret. Moreover, the opportunity cost of
foregone options becomes more salient, leading to decreased contentment with chosen alternatives.
This phenomenon has profound implications for marketing strategies and public policy design.`,
        wordCount: 74,
        lexileScore: 1280,
        arLevel: 11.2,
        genre: 'academic',
      },
    }),
  ]);

  console.log(`✅ Created ${passages.length} sample passages`);

  // ===== 2. Create Grammar Items (13 items) =====
  const grammarItems = [
    // Stage 1: Routing (3 items)
    {
      stem: 'She _____ to school every day.',
      options: { A: 'go', B: 'goes', C: 'going', D: 'gone' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 1,
      panel: 'routing',
      formId: 1,
      skillTag: 'present_simple',
      discrimination: 1.2,
      difficulty: -1.0,
    },
    {
      stem: 'They _____ playing basketball yesterday.',
      options: { A: 'is', B: 'are', C: 'was', D: 'were' },
      correctAnswer: 'D',
      domain: 'grammar',
      stage: 1,
      panel: 'routing',
      formId: 1,
      skillTag: 'past_tense',
      discrimination: 1.4,
      difficulty: -0.5,
    },
    {
      stem: 'I have _____ finished my homework.',
      options: { A: 'yet', B: 'already', C: 'still', D: 'ever' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 1,
      panel: 'routing',
      formId: 1,
      skillTag: 'present_perfect',
      discrimination: 1.3,
      difficulty: 0.0,
    },

    // Stage 2: Low Panel (5 items)
    {
      stem: '_____ you like ice cream?',
      options: { A: 'Do', B: 'Does', C: 'Did', D: 'Are' },
      correctAnswer: 'A',
      domain: 'grammar',
      stage: 2,
      panel: 'low',
      formId: 1,
      skillTag: 'questions',
      discrimination: 1.1,
      difficulty: -1.5,
    },
    {
      stem: 'There _____ many students in the classroom.',
      options: { A: 'is', B: 'are', C: 'was', D: 'be' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'low',
      formId: 1,
      skillTag: 'subject_verb_agreement',
      discrimination: 1.2,
      difficulty: -1.2,
    },
    {
      stem: 'My brother is _____ than me.',
      options: { A: 'tall', B: 'taller', C: 'tallest', D: 'more tall' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'low',
      formId: 1,
      skillTag: 'comparatives',
      discrimination: 1.3,
      difficulty: -1.0,
    },
    {
      stem: 'She _____ TV when I called her.',
      options: { A: 'watch', B: 'watches', C: 'was watching', D: 'is watching' },
      correctAnswer: 'C',
      domain: 'grammar',
      stage: 2,
      panel: 'low',
      formId: 1,
      skillTag: 'past_continuous',
      discrimination: 1.4,
      difficulty: -0.8,
    },
    {
      stem: 'I need _____ buy some milk.',
      options: { A: 'to', B: 'for', C: 'at', D: 'in' },
      correctAnswer: 'A',
      domain: 'grammar',
      stage: 2,
      panel: 'low',
      formId: 1,
      skillTag: 'infinitives',
      discrimination: 1.2,
      difficulty: -0.7,
    },

    // Stage 2: Medium Panel (2 items)
    {
      stem: 'If I _____ more time, I would travel around the world.',
      options: { A: 'have', B: 'had', C: 'will have', D: 'would have' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'medium',
      formId: 1,
      skillTag: 'conditionals',
      discrimination: 1.5,
      difficulty: 0.3,
    },
    {
      stem: 'The book _____ by millions of people every year.',
      options: { A: 'reads', B: 'is read', C: 'was read', D: 'reading' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'medium',
      formId: 1,
      skillTag: 'passive_voice',
      discrimination: 1.6,
      difficulty: 0.5,
    },

    // Stage 2: High Panel (3 items)
    {
      stem: 'Not only _____ speak English, but he also speaks French fluently.',
      options: { A: 'he does', B: 'does he', C: 'he can', D: 'can he' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'high',
      formId: 1,
      skillTag: 'inversion',
      discrimination: 1.8,
      difficulty: 1.2,
    },
    {
      stem: '_____ the weather, we decided to go hiking.',
      options: { A: 'Despite', B: 'Although', C: 'Because', D: 'Since' },
      correctAnswer: 'A',
      domain: 'grammar',
      stage: 2,
      panel: 'high',
      formId: 1,
      skillTag: 'conjunctions',
      discrimination: 1.7,
      difficulty: 1.0,
    },
    {
      stem: 'The professor, _____ research is world-renowned, will give a lecture tomorrow.',
      options: { A: 'who', B: 'whose', C: 'which', D: 'whom' },
      correctAnswer: 'B',
      domain: 'grammar',
      stage: 2,
      panel: 'high',
      formId: 1,
      skillTag: 'relative_clauses',
      discrimination: 1.9,
      difficulty: 1.3,
    },
  ];

  // ===== 3. Create Vocabulary Items (14 items - VST format) =====
  const vocabularyItems = [
    // Stage 1: Routing (3 items)
    {
      word: 'happy',
      stem: 'She feels happy today.',
      options: { A: 'joyful', B: 'angry', C: 'tired', D: 'hungry' },
      correctAnswer: 'A',
      frequencyBand: '1k',
      stage: 1,
    },
    {
      word: 'important',
      stem: 'This is an important message.',
      options: { A: 'useless', B: 'significant', C: 'small', D: 'funny' },
      correctAnswer: 'B',
      frequencyBand: '2k',
      stage: 1,
    },
    {
      word: 'abandon',
      stem: 'They had to abandon the ship.',
      options: { A: 'leave', B: 'repair', C: 'sell', D: 'paint' },
      correctAnswer: 'A',
      frequencyBand: '4k',
      stage: 1,
    },

    // Stage 2: Low Panel (6 items)
    {
      word: 'angry',
      stem: 'He was very angry about the mistake.',
      options: { A: 'mad', B: 'happy', C: 'calm', D: 'sleepy' },
      correctAnswer: 'A',
      frequencyBand: '1k',
      stage: 2,
      panel: 'low',
    },
    {
      word: 'beautiful',
      stem: 'The sunset was beautiful.',
      options: { A: 'ugly', B: 'lovely', C: 'dark', D: 'quick' },
      correctAnswer: 'B',
      frequencyBand: '1k',
      stage: 2,
      panel: 'low',
    },
    {
      word: 'difficult',
      stem: 'The test was very difficult.',
      options: { A: 'easy', B: 'short', C: 'hard', D: 'long' },
      correctAnswer: 'C',
      frequencyBand: '2k',
      stage: 2,
      panel: 'low',
    },
    {
      word: 'explain',
      stem: 'Can you explain this to me?',
      options: { A: 'hide', B: 'clarify', C: 'forget', D: 'buy' },
      correctAnswer: 'B',
      frequencyBand: '2k',
      stage: 2,
      panel: 'low',
    },
    {
      word: 'achieve',
      stem: 'She worked hard to achieve her goals.',
      options: { A: 'fail', B: 'accomplish', C: 'ignore', D: 'delay' },
      correctAnswer: 'B',
      frequencyBand: '4k',
      stage: 2,
      panel: 'low',
    },
    {
      word: 'blurgle',
      stem: 'The machine started to blurgle loudly.',
      options: { A: 'make noise', B: 'break down', C: 'this word does not exist', D: 'work smoothly' },
      correctAnswer: 'C',
      frequencyBand: 'pseudo',
      stage: 2,
      panel: 'low',
      isPseudo: true,
    },

    // Stage 2: Medium Panel (3 items)
    {
      word: 'accommodate',
      stem: 'The hotel can accommodate 200 guests.',
      options: { A: 'reject', B: 'house', C: 'entertain', D: 'feed' },
      correctAnswer: 'B',
      frequencyBand: '6k',
      stage: 2,
      panel: 'medium',
    },
    {
      word: 'beneficial',
      stem: 'Exercise is beneficial for your health.',
      options: { A: 'harmful', B: 'helpful', C: 'difficult', D: 'boring' },
      correctAnswer: 'B',
      frequencyBand: '6k',
      stage: 2,
      panel: 'medium',
    },
    {
      word: 'contemplate',
      stem: 'He sat quietly to contemplate his options.',
      options: { A: 'forget', B: 'consider', C: 'reject', D: 'execute' },
      correctAnswer: 'B',
      frequencyBand: '8k',
      stage: 2,
      panel: 'medium',
    },

    // Stage 2: High Panel (2 items)
    {
      word: 'eloquent',
      stem: 'She gave an eloquent speech.',
      options: { A: 'long', B: 'boring', C: 'articulate', D: 'confusing' },
      correctAnswer: 'C',
      frequencyBand: '10k',
      stage: 2,
      panel: 'high',
    },
    {
      word: 'ubiquitous',
      stem: 'Smartphones have become ubiquitous in modern society.',
      options: { A: 'rare', B: 'expensive', C: 'everywhere', D: 'obsolete' },
      correctAnswer: 'C',
      frequencyBand: '14k',
      stage: 2,
      panel: 'high',
    },
  ];

  // ===== 4. Create Reading Items (13 items) =====
  const readingItems = [
    // Stage 1: Routing (2 items) - using Low difficulty passage
    {
      passageId: passages[0].id,
      stem: 'What is the main purpose of the library according to the passage?',
      options: {
        A: 'To eat lunch',
        B: 'A place to read and study',
        C: 'To play games',
        D: 'To watch movies',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'expository',
      stage: 1,
      panel: 'routing',
      skillTag: 'main_idea',
      discrimination: 1.3,
      difficulty: -0.8,
    },
    {
      passageId: passages[0].id,
      stem: 'Who helps students find books?',
      options: {
        A: 'The principal',
        B: 'Mrs. Johnson',
        C: 'The teacher',
        D: 'Other students',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'expository',
      stage: 1,
      panel: 'routing',
      skillTag: 'detail',
      discrimination: 1.1,
      difficulty: -1.2,
    },

    // Stage 2: Low Panel (5 items)
    {
      passageId: passages[0].id,
      stem: 'Why must students be quiet in the library?',
      options: {
        A: 'The librarian is sleeping',
        B: 'So everyone can concentrate',
        C: 'It is a school rule',
        D: 'To save energy',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'low',
      skillTag: 'inference',
      discrimination: 1.2,
      difficulty: -1.0,
    },
    {
      passageId: passages[0].id,
      stem: 'Which type of books does the passage mention?',
      options: {
        A: 'Only fiction',
        B: 'Only non-fiction',
        C: 'Fiction, non-fiction, and magazines',
        D: 'Only textbooks',
      },
      correctAnswer: 'C',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'low',
      skillTag: 'detail',
      discrimination: 1.0,
      difficulty: -1.3,
    },
    {
      passageId: passages[0].id,
      stem: 'In this passage, "concentrate" most likely means:',
      options: {
        A: 'to focus',
        B: 'to relax',
        C: 'to talk',
        D: 'to leave',
      },
      correctAnswer: 'A',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'low',
      skillTag: 'vocabulary_context',
      discrimination: 1.3,
      difficulty: -0.9,
    },
    {
      passageId: passages[1].id,
      stem: 'What is the main challenge polar bears face?',
      options: {
        A: 'Too many seals',
        B: 'Loss of hunting grounds due to melting ice',
        C: 'Overpopulation',
        D: 'Lack of swimming ability',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'low',
      skillTag: 'main_idea',
      discrimination: 1.4,
      difficulty: -0.5,
    },
    {
      passageId: passages[1].id,
      stem: 'What do polar bears primarily hunt?',
      options: {
        A: 'Fish',
        B: 'Birds',
        C: 'Seals',
        D: 'Walruses',
      },
      correctAnswer: 'C',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'low',
      skillTag: 'detail',
      discrimination: 1.2,
      difficulty: -0.7,
    },

    // Stage 2: Medium Panel (3 items)
    {
      passageId: passages[1].id,
      stem: 'According to the passage, what could happen to polar bear populations?',
      options: {
        A: 'Increase by 30%',
        B: 'Remain stable',
        C: 'Decline by 30%',
        D: 'Double in size',
      },
      correctAnswer: 'C',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'medium',
      skillTag: 'inference',
      discrimination: 1.5,
      difficulty: 0.2,
    },
    {
      passageId: passages[1].id,
      stem: 'Why do polar bears need to swim longer distances?',
      options: {
        A: 'For exercise',
        B: 'Because there is less sea ice',
        C: 'To escape predators',
        D: 'To find warmer water',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'expository',
      stage: 2,
      panel: 'medium',
      skillTag: 'cause_effect',
      discrimination: 1.6,
      difficulty: 0.3,
    },
    {
      passageId: passages[2].id,
      stem: 'What is the main paradox discussed in the passage?',
      options: {
        A: 'More choices lead to less satisfaction',
        B: 'Consumers prefer fewer options',
        C: 'Marketing is ineffective',
        D: 'Public policy is complex',
      },
      correctAnswer: 'A',
      domain: 'reading',
      textType: 'argumentative',
      stage: 2,
      panel: 'medium',
      skillTag: 'main_idea',
      discrimination: 1.7,
      difficulty: 0.5,
    },

    // Stage 2: High Panel (3 items)
    {
      passageId: passages[2].id,
      stem: 'According to Barry Schwartz, what happens when people face too many alternatives?',
      options: {
        A: 'They make better decisions',
        B: 'They experience decision paralysis',
        C: 'They become more satisfied',
        D: 'They save more money',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'argumentative',
      stage: 2,
      panel: 'high',
      skillTag: 'detail',
      discrimination: 1.8,
      difficulty: 1.0,
    },
    {
      passageId: passages[2].id,
      stem: 'What does "salient" most likely mean in this context?',
      options: {
        A: 'Hidden',
        B: 'Noticeable',
        C: 'Irrelevant',
        D: 'Forgotten',
      },
      correctAnswer: 'B',
      domain: 'reading',
      textType: 'argumentative',
      stage: 2,
      panel: 'high',
      skillTag: 'vocabulary_context',
      discrimination: 1.7,
      difficulty: 1.2,
    },
    {
      passageId: passages[2].id,
      stem: 'What implication does the author suggest about this phenomenon?',
      options: {
        A: 'It only affects individual consumers',
        B: 'It has no practical applications',
        C: 'It affects marketing strategies and public policy',
        D: 'It should be ignored',
      },
      correctAnswer: 'C',
      domain: 'reading',
      textType: 'argumentative',
      stage: 2,
      panel: 'high',
      skillTag: 'inference',
      discrimination: 1.9,
      difficulty: 1.3,
    },
  ];

  // Insert Grammar Items
  const createdGrammarItems = await Promise.all(
    grammarItems.map((item) =>
      prisma.item.create({
        data: {
          stem: item.stem,
          options: item.options,
          correctAnswer: item.correctAnswer,
          domain: item.domain as any,
          stage: item.stage,
          panel: item.panel as any,
          formId: item.formId,
          skillTag: item.skillTag,
          discrimination: item.discrimination,
          difficulty: item.difficulty,
          guessing: 0.25,
          status: 'active',
        },
      })
    )
  );
  console.log(`✅ Created ${createdGrammarItems.length} grammar items`);

  // Insert Vocabulary Items
  const createdVocabItems = await Promise.all(
    vocabularyItems.map((item) =>
      prisma.vocabularyItem.create({
        data: {
          word: item.word,
          targetWord: item.word,
          frequencyBand: item.frequencyBand,
          options: item.options,
          correctAnswer: item.correctAnswer,
          isPseudo: item.isPseudo || false,
          formId: 1,
          discrimination: 1.2,
          difficulty: item.stage === 1 ? 0.0 : item.panel === 'low' ? -0.5 : item.panel === 'medium' ? 0.3 : 0.8,
        },
      })
    )
  );
  console.log(`✅ Created ${createdVocabItems.length} vocabulary items`);

  // Insert Reading Items
  const createdReadingItems = await Promise.all(
    readingItems.map((item) =>
      prisma.item.create({
        data: {
          passageId: item.passageId,
          stem: item.stem,
          options: item.options,
          correctAnswer: item.correctAnswer,
          domain: item.domain as any,
          textType: item.textType as any,
          stage: item.stage,
          panel: item.panel as any,
          formId: 1,
          skillTag: item.skillTag,
          discrimination: item.discrimination,
          difficulty: item.difficulty,
          guessing: 0.25,
          status: 'active',
        },
      })
    )
  );
  console.log(`✅ Created ${createdReadingItems.length} reading items`);

  const totalItems = createdGrammarItems.length + createdReadingItems.length;
  console.log(`\n🎉 Seeding completed! Total items created: ${totalItems} + ${createdVocabItems.length} vocabulary items`);
  console.log(`📊 Distribution: Grammar ${createdGrammarItems.length}, Vocabulary ${createdVocabItems.length}, Reading ${createdReadingItems.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
