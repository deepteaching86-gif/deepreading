import { GradeSeedData } from '../../../src/types/seed.types';

/**
 * 초등 4학년 문해력 진단 평가 시드 데이터
 * - 총 30문항 (어휘력 9, 독해력 11, 문법 6, 추론 4)
 * - 소요 시간: 35분
 * - 난이도: easy(10) / medium(14) / hard(6)
 */
export const grade4Data: GradeSeedData = {
  template: {
    templateCode: 'ELEM4-V1',
    grade: 4,
    title: '초등 4학년 문해력 진단 평가',
    version: '1.0',
    totalQuestions: 30,
    timeLimit: 35,
    isActive: true,
  },
  questions: [
    // ===== 어휘력 (9문항) =====
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 1,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 중 '배려'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '자신의 이익만 생각함' },
        { id: 2, text: '다른 사람을 돕고 생각해 줌' },
        { id: 3, text: '여러 사람과 다투는 것' },
        { id: 4, text: '혼자서 조용히 지내는 것' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '배려는 다른 사람의 처지나 형편을 이해하고 도와주려는 마음과 행동을 의미합니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 2,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'견디다'와 같은 뜻으로 사용할 수 있는 한자성어는?",
      options: [
        { id: 1, text: '금상첨화(錦上添花)' },
        { id: 2, text: '인내심(忍耐心)' },
        { id: 3, text: '일석이조(一石二鳥)' },
        { id: 4, text: '화룡점정(畫龍點睛)' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "인내심(忍耐心)은 '참을 인(忍) + 기다릴 내(耐) + 마음 심(心)'으로 어려움을 견디고 참는 마음을 의미합니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 3,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 밑줄 친 '쓰다'의 뜻이 다른 하나는?\n\n① 모자를 **쓰다**\n② 연필로 글씨를 **쓰다**\n③ 안경을 **쓰다**\n④ 우산을 **쓰다**",
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "②는 '글을 적다'의 의미이고, ①③④는 '머리나 얼굴에 물건을 얹다'의 의미입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 4,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'일석이조(一石二鳥)'의 뜻으로 알맞은 것은?",
      options: [
        { id: 1, text: '한 가지 일로 두 가지 이익을 얻음' },
        { id: 2, text: '새 한 마리가 날아가는 모습' },
        { id: 3, text: '돌 하나로 물고기를 잡는 것' },
        { id: 4, text: '두 마리의 새가 싸우는 것' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: "일석이조는 '하나 일(一) + 돌 석(石) + 둘 이(二) + 새 조(鳥)'로, 돌 하나로 새 두 마리를 잡는다는 뜻에서 한 번의 행동으로 두 가지 이익을 얻음을 의미합니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 5,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 중 '고민'의 반대말로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '걱정' },
        { id: 2, text: '해결' },
        { id: 3, text: '문제' },
        { id: 4, text: '생각' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '고민은 어떤 문제로 마음을 쓰며 괴로워하는 것이고, 해결은 문제를 풀어 처리하는 것으로 반대 개념입니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 6,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'호랑이도 제 말 하면 온다'는 속담의 의미는?",
      options: [
        { id: 1, text: '호랑이는 무서운 동물이다' },
        { id: 2, text: '누군가의 이야기를 하면 그 사람이 나타난다' },
        { id: 3, text: '호랑이는 말을 잘 듣는다' },
        { id: 4, text: '동물들은 사람의 말을 이해한다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: '이 속담은 어떤 사람에 대해 이야기하고 있을 때 마침 그 사람이 나타나는 상황을 비유적으로 표현한 것입니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 7,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 상황에서 '물 만난 고기'의 의미로 알맞은 것은?\n\n'수학을 어려워하던 민수가 과학 실험 수업에서는 **물 만난 고기**처럼 즐겁게 참여했다.'",
      options: [
        { id: 1, text: '불편하고 답답한 상태' },
        { id: 2, text: '자신에게 잘 맞는 상황을 만나 활기를 띰' },
        { id: 3, text: '물속에서 고기를 발견함' },
        { id: 4, text: '매우 슬프고 우울한 기분' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "'물 만난 고기'는 자기에게 알맞은 환경이나 조건을 만나 활기차고 자유롭게 활동하는 모습을 비유하는 표현입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 8,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'관찰'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '사물이나 현상을 주의 깊게 살펴봄' },
        { id: 2, text: '빠르게 지나쳐 가는 것' },
        { id: 3, text: '무언가를 만드는 것' },
        { id: 4, text: '소리를 크게 내는 것' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '관찰은 사물이나 현상을 주의 깊게 자세히 살펴보는 행위를 의미합니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 9,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 중 '협력'과 가장 가까운 의미의 단어는?",
      options: [
        { id: 1, text: '경쟁' },
        { id: 2, text: '협동' },
        { id: 3, text: '반대' },
        { id: 4, text: '독립' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '협력과 협동은 모두 여러 사람이 마음과 힘을 하나로 모아 함께 일하는 것을 의미합니다.',
    },

    // ===== 독해력 (11문항) =====
    // [지문 1] 문항 10-12: 재활용
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 10,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글의 중심 내용은 무엇인가요?',
      passage: `재활용은 우리가 버린 물건을 다시 사용할 수 있게 만드는 것입니다.
플라스틱 병, 종이, 유리병 등을 분리해서 버리면 공장에서
다시 새로운 물건으로 만들 수 있습니다.

재활용을 하면 쓰레기가 줄어들고, 자원을 아낄 수 있습니다.
또한 환경 오염도 줄일 수 있어서 지구를 보호하는 데 도움이 됩니다.
우리 모두가 재활용에 관심을 가지고 실천한다면
더 깨끗하고 건강한 지구를 만들 수 있습니다.`,
      options: [
        { id: 1, text: '쓰레기를 많이 버리는 방법' },
        { id: 2, text: '재활용의 중요성과 효과' },
        { id: 3, text: '공장에서 물건을 만드는 과정' },
        { id: 4, text: '플라스틱 병의 종류' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '글은 재활용이 무엇인지 설명하고, 재활용의 효과와 중요성을 강조하고 있습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 11,
      category: 'reading',
      questionType: 'choice',
      questionText: '재활용의 효과로 이 글에서 언급하지 않은 것은?',
      passage: `재활용은 우리가 버린 물건을 다시 사용할 수 있게 만드는 것입니다.
플라스틱 병, 종이, 유리병 등을 분리해서 버리면 공장에서
다시 새로운 물건으로 만들 수 있습니다.

재활용을 하면 쓰레기가 줄어들고, 자원을 아낄 수 있습니다.
또한 환경 오염도 줄일 수 있어서 지구를 보호하는 데 도움이 됩니다.
우리 모두가 재활용에 관심을 가지고 실천한다면
더 깨끗하고 건강한 지구를 만들 수 있습니다.`,
      options: [
        { id: 1, text: '쓰레기가 줄어든다' },
        { id: 2, text: '자원을 아낄 수 있다' },
        { id: 3, text: '환경 오염을 줄일 수 있다' },
        { id: 4, text: '돈을 많이 벌 수 있다' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서는 쓰레기 감소, 자원 절약, 환경 보호를 언급했지만 돈을 버는 것은 언급하지 않았습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 12,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글을 읽고 우리가 실천할 수 있는 일로 가장 알맞은 것은?',
      passage: `재활용은 우리가 버린 물건을 다시 사용할 수 있게 만드는 것입니다.
플라스틱 병, 종이, 유리병 등을 분리해서 버리면 공장에서
다시 새로운 물건으로 만들 수 있습니다.

재활용을 하면 쓰레기가 줄어들고, 자원을 아낄 수 있습니다.
또한 환경 오염도 줄일 수 있어서 지구를 보호하는 데 도움이 됩니다.
우리 모두가 재활용에 관심을 가지고 실천한다면
더 깨끗하고 건강한 지구를 만들 수 있습니다.`,
      options: [
        { id: 1, text: '쓰레기를 아무 곳에나 버린다' },
        { id: 2, text: '재활용품을 분리해서 버린다' },
        { id: 3, text: '플라스틱 사용을 늘린다' },
        { id: 4, text: '환경에 관심을 갖지 않는다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글의 내용에 따르면 재활용품을 분리배출하는 것이 재활용 실천의 기본입니다.',
    },

    // [지문 2] 문항 13-15: 개미
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 13,
      category: 'reading',
      questionType: 'choice',
      questionText: '개미는 자기 몸무게의 몇 배나 되는 물건을 들 수 있나요?',
      passage: `개미는 작은 몸집에도 불구하고 매우 힘이 센 곤충입니다.
개미는 자기 몸무게의 50배나 되는 물건을 들 수 있습니다.
만약 사람이 이 정도의 힘을 가진다면, 자동차를 들어 올릴 수 있을 것입니다.

개미는 또한 협동을 잘하는 곤충으로도 유명합니다.
큰 먹이를 발견하면 동료들에게 신호를 보내고,
여러 마리가 함께 힘을 모아 먹이를 집으로 옮깁니다.
이러한 협동 덕분에 개미들은 자신들보다 훨씬 큰 동물도 무찌를 수 있습니다.

개미의 이런 특성은 작지만 함께 힘을 모으면 큰일도 해낼 수 있다는 것을
우리에게 가르쳐 줍니다.`,
      options: [
        { id: 1, text: '10배' },
        { id: 2, text: '20배' },
        { id: 3, text: '50배' },
        { id: 4, text: '100배' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 "개미는 자기 몸무게의 50배나 되는 물건을 들 수 있습니다"라고 명시되어 있습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 14,
      category: 'reading',
      questionType: 'choice',
      questionText: '개미가 큰 먹이를 옮길 때 하는 행동은?',
      passage: `개미는 작은 몸집에도 불구하고 매우 힘이 센 곤충입니다.
개미는 자기 몸무게의 50배나 되는 물건을 들 수 있습니다.
만약 사람이 이 정도의 힘을 가진다면, 자동차를 들어 올릴 수 있을 것입니다.

개미는 또한 협동을 잘하는 곤충으로도 유명합니다.
큰 먹이를 발견하면 동료들에게 신호를 보내고,
여러 마리가 함께 힘을 모아 먹이를 집으로 옮깁니다.
이러한 협동 덕분에 개미들은 자신들보다 훨씬 큰 동물도 무찌를 수 있습니다.

개미의 이런 특성은 작지만 함께 힘을 모으면 큰일도 해낼 수 있다는 것을
우리에게 가르쳐 줍니다.`,
      options: [
        { id: 1, text: '혼자서 먹이를 먹는다' },
        { id: 2, text: '동료들에게 신호를 보내고 함께 옮긴다' },
        { id: 3, text: '먹이를 그냥 두고 간다' },
        { id: 4, text: '다른 동물에게 도움을 청한다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 개미는 큰 먹이를 발견하면 동료들에게 신호를 보내고 함께 협동하여 옮긴다고 설명합니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 15,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글을 통해 알 수 있는 교훈은 무엇인가요?',
      passage: `개미는 작은 몸집에도 불구하고 매우 힘이 센 곤충입니다.
개미는 자기 몸무게의 50배나 되는 물건을 들 수 있습니다.
만약 사람이 이 정도의 힘을 가진다면, 자동차를 들어 올릴 수 있을 것입니다.

개미는 또한 협동을 잘하는 곤충으로도 유명합니다.
큰 먹이를 발견하면 동료들에게 신호를 보내고,
여러 마리가 함께 힘을 모아 먹이를 집으로 옮깁니다.
이러한 협동 덕분에 개미들은 자신들보다 훨씬 큰 동물도 무찌를 수 있습니다.

개미의 이런 특성은 작지만 함께 힘을 모으면 큰일도 해낼 수 있다는 것을
우리에게 가르쳐 줍니다.`,
      options: [
        { id: 1, text: '크기가 크면 힘도 세다' },
        { id: 2, text: '혼자서 일하는 것이 더 빠르다' },
        { id: 3, text: '작아도 함께 힘을 모으면 큰일을 할 수 있다' },
        { id: 4, text: '개미는 게으른 곤충이다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '글의 마지막 문단에서 "작지만 함께 힘을 모으면 큰일도 해낼 수 있다"는 교훈을 명시적으로 제시하고 있습니다.',
    },

    // [지문 3] 문항 16-18: 지훈이의 방학
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 16,
      category: 'reading',
      questionType: 'choice',
      questionText: '지훈이가 방학 동안 주로 한 일은?',
      passage: `여름 방학이 시작되고 나서 일주일째, 지훈이는 매일 늦잠을 자고
하루 종일 게임만 했습니다. 숙제도 하지 않고 책도 읽지 않았습니다.

"이렇게 지내다가는 개학하면 후회할 거야."
엄마가 걱정스럽게 말씀하셨지만, 지훈이는 들은 척도 하지 않았습니다.

그런데 방학이 끝나갈 무렵, 지훈이는 발을 동동 구르며 후회했습니다.
숙제는 산더미처럼 쌓여 있었고, 친구들은 재미있는 체험 활동을
많이 했다는 이야기를 들려주었기 때문입니다.

"미리미리 계획을 세우고 실천할걸..."
지훈이는 다음 방학에는 꼭 계획을 세워서 알차게 보내기로 다짐했습니다.`,
      options: [
        { id: 1, text: '숙제를 열심히 했다' },
        { id: 2, text: '책을 많이 읽었다' },
        { id: 3, text: '늦잠을 자고 게임만 했다' },
        { id: 4, text: '체험 활동에 참여했다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: '글의 첫 문단에서 지훈이가 매일 늦잠을 자고 게임만 했다고 명시되어 있습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 17,
      category: 'reading',
      questionType: 'choice',
      questionText: '지훈이가 방학 끝 무렵에 후회한 이유가 아닌 것은?',
      passage: `여름 방학이 시작되고 나서 일주일째, 지훈이는 매일 늦잠을 자고
하루 종일 게임만 했습니다. 숙제도 하지 않고 책도 읽지 않았습니다.

"이렇게 지내다가는 개학하면 후회할 거야."
엄마가 걱정스럽게 말씀하셨지만, 지훈이는 들은 척도 하지 않았습니다.

그런데 방학이 끝나갈 무렵, 지훈이는 발을 동동 구르며 후회했습니다.
숙제는 산더미처럼 쌓여 있었고, 친구들은 재미있는 체험 활동을
많이 했다는 이야기를 들려주었기 때문입니다.

"미리미리 계획을 세우고 실천할걸..."
지훈이는 다음 방학에는 꼭 계획을 세워서 알차게 보내기로 다짐했습니다.`,
      options: [
        { id: 1, text: '숙제가 많이 남아 있어서' },
        { id: 2, text: '친구들이 재미있는 활동을 많이 해서' },
        { id: 3, text: '게임을 충분히 하지 못해서' },
        { id: 4, text: '계획적으로 방학을 보내지 못해서' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'medium',
      explanation: '지훈이는 게임을 많이 해서가 아니라, 숙제를 안 하고 알찬 활동을 못 한 것을 후회했습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 18,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 이야기가 전하고자 하는 교훈은?',
      passage: `여름 방학이 시작되고 나서 일주일째, 지훈이는 매일 늦잠을 자고
하루 종일 게임만 했습니다. 숙제도 하지 않고 책도 읽지 않았습니다.

"이렇게 지내다가는 개학하면 후회할 거야."
엄마가 걱정스럽게 말씀하셨지만, 지훈이는 들은 척도 하지 않았습니다.

그런데 방학이 끝나갈 무렵, 지훈이는 발을 동동 구르며 후회했습니다.
숙제는 산더미처럼 쌓여 있었고, 친구들은 재미있는 체험 활동을
많이 했다는 이야기를 들려주었기 때문입니다.

"미리미리 계획을 세우고 실천할걸..."
지훈이는 다음 방학에는 꼭 계획을 세워서 알차게 보내기로 다짐했습니다.`,
      options: [
        { id: 1, text: '방학에는 게임을 많이 해야 한다' },
        { id: 2, text: '계획을 세우고 실천하는 것이 중요하다' },
        { id: 3, text: '숙제는 나중에 해도 괜찮다' },
        { id: 4, text: '늦잠을 자는 것이 건강에 좋다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: '지훈이의 경험을 통해 계획적으로 시간을 관리하는 것의 중요성을 보여주고 있습니다.',
    },

    // [지문 4] 문항 19-20: 사계절
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 19,
      category: 'reading',
      questionType: 'choice',
      questionText: '수확의 계절은 언제인가요?',
      passage: `우리나라의 사계절은 각각 특징이 뚜렷합니다.

봄에는 날씨가 따뜻해지고 꽃이 피며, 새싹이 돋아납니다.
여름에는 무덥고 비가 많이 내려 농작물이 잘 자랍니다.
가을에는 시원해지고 곡식과 과일이 익어 수확의 계절이 됩니다.
겨울에는 춥고 눈이 내려 식물들이 휴식을 취합니다.

이렇게 사계절이 뚜렷한 덕분에 우리나라에서는
계절마다 다양한 농작물을 기를 수 있고,
아름다운 자연 경관을 즐길 수 있습니다.`,
      options: [
        { id: 1, text: '봄' },
        { id: 2, text: '여름' },
        { id: 3, text: '가을' },
        { id: 4, text: '겨울' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 가을에 곡식과 과일이 익어 수확의 계절이 된다고 설명하고 있습니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 20,
      category: 'reading',
      questionType: 'choice',
      questionText: '사계절이 뚜렷한 것의 장점으로 언급된 것은?',
      passage: `우리나라의 사계절은 각각 특징이 뚜렷합니다.

봄에는 날씨가 따뜻해지고 꽃이 피며, 새싹이 돋아납니다.
여름에는 무덥고 비가 많이 내려 농작물이 잘 자랍니다.
가을에는 시원해지고 곡식과 과일이 익어 수확의 계절이 됩니다.
겨울에는 춥고 눈이 내려 식물들이 휴식을 취합니다.

이렇게 사계절이 뚜렷한 덕분에 우리나라에서는
계절마다 다양한 농작물을 기를 수 있고,
아름다운 자연 경관을 즐길 수 있습니다.`,
      options: [
        { id: 1, text: '여행을 많이 갈 수 있다' },
        { id: 2, text: '다양한 농작물을 기를 수 있다' },
        { id: 3, text: '옷을 많이 사야 한다' },
        { id: 4, text: '난방비가 많이 든다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글의 마지막 문단에서 사계절 덕분에 다양한 농작물을 기를 수 있다고 명시하고 있습니다.',
    },

    // ===== 문법/어법 (6문항) =====
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 21,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 주어는 무엇인가요?\n\n'**강아지가** 공을 물고 뛰어간다.'",
      options: [
        { id: 1, text: '강아지가' },
        { id: 2, text: '공을' },
        { id: 3, text: '물고' },
        { id: 4, text: '뛰어간다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'easy',
      explanation: "주어는 '누가/무엇이'에 해당하는 문장 성분으로, 이 문장에서는 '강아지가'가 주어입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 22,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 서술어는 무엇인가요?\n\n'고양이가 우유를 **마신다**.'",
      options: [
        { id: 1, text: '고양이가' },
        { id: 2, text: '우유를' },
        { id: 3, text: '마신다' },
        { id: 4, text: '고양이' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: "서술어는 '어찌하다/어떠하다'에 해당하는 문장 성분으로, 이 문장에서는 '마신다'가 서술어입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 23,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 안은 문장은 어느 것인가요?',
      options: [
        { id: 1, text: '해가 뜨고 새가 운다.' },
        { id: 2, text: '내가 좋아하는 과일은 사과이다.' },
        { id: 3, text: '동생이 학교에 간다.' },
        { id: 4, text: '비가 오고 바람이 분다.' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "안은 문장은 한 문장 안에 다른 문장이 들어 있는 형태입니다. ②는 '내가 좋아하는'이라는 관형절이 포함된 안은 문장입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 24,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 목적어는 무엇인가요?\n\n'학생들이 **책을** 읽는다.'",
      options: [
        { id: 1, text: '학생들이' },
        { id: 2, text: '책을' },
        { id: 3, text: '읽는다' },
        { id: 4, text: '학생들' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "목적어는 서술어의 동작 대상이 되는 말로, '무엇을'에 해당합니다. 이 문장에서는 '책을'이 목적어입니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 25,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 높임말이 바르게 사용된 문장은?',
      options: [
        { id: 1, text: '할머니가 진지를 잡수신다.' },
        { id: 2, text: '동생이 진지를 잡수신다.' },
        { id: 3, text: '친구가 진지를 잡수신다.' },
        { id: 4, text: '강아지가 진지를 잡수신다.' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: "'진지'와 '잡수시다'는 어른을 높이는 말입니다. 할머니는 높여야 할 대상이므로 ①이 올바릅니다.",
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 26,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 띄어쓰기가 잘못된 부분은?\n\n'오늘은 날씨가 좋아서 소풍가기 좋은 날이다.'",
      options: [
        { id: 1, text: '오늘은' },
        { id: 2, text: '날씨가' },
        { id: 3, text: '좋아서' },
        { id: 4, text: '소풍가기' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'hard',
      explanation: "'소풍가기'는 '소풍 가기'로 띄어 써야 합니다. 명사와 동사는 띄어 씁니다.",
    },

    // ===== 추론/사고력 (4문항) =====
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 27,
      category: 'reasoning',
      questionType: 'choice',
      questionText: '다음 중 원인과 결과가 바르게 연결된 것은?',
      options: [
        { id: 1, text: '비가 와서 땅이 말랐다' },
        { id: 2, text: '공부를 열심히 해서 성적이 올랐다' },
        { id: 3, text: '운동을 해서 살이 쪘다' },
        { id: 4, text: '물을 많이 마셔서 목이 말랐다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '공부를 열심히 하는 것이 원인이 되어 성적이 오르는 결과가 나타나는 것이 논리적으로 타당합니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 28,
      category: 'reasoning',
      questionType: 'choice',
      questionText: '다음 규칙을 찾아 빈칸에 들어갈 수를 구하시오.\n\n2, 4, 8, 16, ____',
      options: [
        { id: 1, text: '20' },
        { id: 2, text: '24' },
        { id: 3, text: '32' },
        { id: 4, text: '36' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '각 수가 앞의 수의 2배가 되는 규칙입니다. 16 × 2 = 32',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 29,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 상황을 보고 가장 알맞은 행동을 고르시오.\n\n'친구가 넘어져서 다쳤다.'",
      options: [
        { id: 1, text: '모른 척하고 지나간다' },
        { id: 2, text: '웃으면서 쳐다본다' },
        { id: 3, text: '일으켜 주고 보건실에 데려다준다' },
        { id: 4, text: '사진을 찍어서 친구들에게 보여준다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '친구가 다쳤을 때는 도와주고 치료를 받을 수 있도록 보건실에 데려다주는 것이 올바른 행동입니다.',
    },
    {
      templateCode: 'ELEM4-V1',
      questionNumber: 30,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 글을 읽고 추론할 수 있는 것은?\n\n'철수는 매일 아침 일찍 일어나 운동을 합니다.\n채소와 과일을 많이 먹고, 밤에는 일찍 잠자리에 듭니다.'",
      options: [
        { id: 1, text: '철수는 건강한 생활 습관을 가지고 있다' },
        { id: 2, text: '철수는 운동을 싫어한다' },
        { id: 3, text: '철수는 아침을 먹지 않는다' },
        { id: 4, text: '철수는 밤늦게까지 게임을 한다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: '철수의 행동들(규칙적인 운동, 건강한 식습관, 충분한 수면)을 종합하면 건강한 생활 습관을 실천하고 있다고 추론할 수 있습니다.',
    },
  ],
};
