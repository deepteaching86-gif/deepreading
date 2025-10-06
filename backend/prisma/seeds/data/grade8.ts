import { GradeSeedData } from '../../../src/types/seed.types';

/**
 * 중등 2학년 문해력 진단 평가 시드 데이터
 * - 총 35문항 (어휘력 10, 독해력 13, 문법 7, 추론 5)
 * - 소요 시간: 45분
 * - 난이도: easy(5) / medium(15) / hard(15)
 */
export const grade8Data: GradeSeedData = {
  template: {
    templateCode: 'MIDDLE2-V1',
    grade: 8,
    title: '중등 2학년 문해력 진단 평가',
    version: '1.0',
    totalQuestions: 35,
    timeLimit: 45,
    isActive: true,
  },
  questions: [
    // ===== 어휘력 (10문항) =====
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 1,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'낙관적'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '앞일을 어둡게 보는 태도' },
        { id: 2, text: '앞일을 밝고 희망적으로 보는 태도' },
        { id: 3, text: '아무 생각 없이 사는 태도' },
        { id: 4, text: '매우 비관적인 태도' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '낙관적이란 앞으로의 일이나 상황을 밝고 긍정적으로 보는 태도를 의미합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 2,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'일거양득(一擧兩得)'의 의미는?",
      options: [
        { id: 1, text: '한 가지 일로 두 가지 이득을 얻음' },
        { id: 2, text: '두 가지 일을 동시에 함' },
        { id: 3, text: '한 가지 일에 집중함' },
        { id: 4, text: '아무 이득도 얻지 못함' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "일거양득(一擧兩得)은 '한 일(一) + 들 거(擧) + 두 양(兩) + 얻을 득(得)'으로, 한 가지 일을 하여 두 가지 이익을 얻는다는 의미입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 3,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'능동적'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '시키는 대로만 하는 것' },
        { id: 2, text: '스스로 적극적으로 행동하는 것' },
        { id: 3, text: '아무것도 하지 않는 것' },
        { id: 4, text: '남의 의견만 따르는 것' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '능동적이란 자기 스스로의 의지로 적극적으로 행동하는 것을 의미합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 4,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'역지사지(易地思之)'의 의미로 알맞은 것은?",
      options: [
        { id: 1, text: '처지를 바꾸어 생각해 본다' },
        { id: 2, text: '쉬운 일을 먼저 한다' },
        { id: 3, text: '어려운 일을 피한다' },
        { id: 4, text: '자신의 입장만 생각한다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "역지사지(易地思之)는 '바꿀 역(易) + 땅 지(地) + 생각 사(思) + 갈 지(之)'로, 처지를 바꾸어 상대방의 입장에서 생각해 본다는 의미입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 5,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 중 '긍정적'과 반대되는 의미의 단어는?",
      options: [
        { id: 1, text: '낙관적' },
        { id: 2, text: '부정적' },
        { id: 3, text: '적극적' },
        { id: 4, text: '능동적' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '긍정적은 좋게 받아들이는 것이고, 부정적은 좋지 않게 받아들이는 것으로 서로 반대되는 개념입니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 6,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'동고동락(同苦同樂)'의 의미는?",
      options: [
        { id: 1, text: '괴로움과 즐거움을 함께한다' },
        { id: 2, text: '혼자서 고생한다' },
        { id: 3, text: '즐거움만 함께한다' },
        { id: 4, text: '괴로움만 함께한다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "동고동락(同苦同樂)은 '같을 동(同) + 괴로울 고(苦) + 같을 동(同) + 즐거울 락(樂)'으로, 괴로움과 즐거움을 함께한다는 의미입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 7,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'보편적'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '특정한 사람에게만 해당됨' },
        { id: 2, text: '널리 퍼져 있거나 모든 경우에 공통적으로 적용됨' },
        { id: 3, text: '매우 드물게 나타남' },
        { id: 4, text: '아주 특별함' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '보편적이란 널리 퍼져 있거나 모든 경우에 공통적으로 적용되는 것을 의미합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 8,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'금상첨화(錦上添花)'의 의미는?",
      options: [
        { id: 1, text: '비단 위에 꽃을 더한다, 즉 좋은 일에 더 좋은 일이 더해진다' },
        { id: 2, text: '꽃이 시든다' },
        { id: 3, text: '나쁜 일이 생긴다' },
        { id: 4, text: '비단을 만든다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "금상첨화(錦上添花)는 '비단 금(錦) + 위 상(上) + 더할 첨(添) + 꽃 화(花)'로, 좋은 것 위에 더 좋은 것이 더해진다는 의미입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 9,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'포용력'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '남을 배척하는 능력' },
        { id: 2, text: '남을 너그럽게 받아들이고 감싸 안는 능력' },
        { id: 3, text: '빠르게 달리는 능력' },
        { id: 4, text: '강하게 밀어내는 힘' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '포용력이란 다른 사람을 너그럽게 받아들이고 감싸 안는 능력을 의미합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 10,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'세옹지마(塞翁之馬)'의 의미는?",
      options: [
        { id: 1, text: '인생의 길흉화복은 변화가 많아 예측하기 어렵다' },
        { id: 2, text: '말을 잘 타야 한다' },
        { id: 3, text: '늙은이는 지혜롭다' },
        { id: 4, text: '항상 불행하다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: "세옹지마(塞翁之馬)는 '변방 새(塞) + 늙은이 옹(翁) + 어조사 지(之) + 말 마(馬)'로, 인생의 길흉화복은 변화가 많아 예측하기 어렵다는 의미입니다.",
    },

    // ===== 독해력 (13문항) =====
    // [지문 1] 문항 11-14: 광합성 (과학)
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 11,
      category: 'reading',
      questionType: 'choice',
      questionText: '광합성이란 무엇인가?',
      passage: `광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 만들어내는 과정입니다. 이 과정은 식물의 잎에 있는 엽록체에서 일어나며, 지구상의 거의 모든 생명체가 살아가는 데 필수적인 역할을 합니다.

광합성 과정은 크게 두 단계로 나뉩니다. 첫 번째는 '명반응'으로, 빛이 있을 때 일어나는 반응입니다. 엽록체에 있는 엽록소가 빛 에너지를 흡수하여 물을 분해하고, 이 과정에서 산소가 발생합니다. 우리가 숨 쉬는 대기 중의 산소는 바로 이 과정에서 만들어진 것입니다.

두 번째는 '암반응'으로, 빛이 없어도 일어날 수 있는 반응입니다. 명반응에서 만들어진 에너지를 이용하여 이산화탄소로부터 포도당을 합성합니다. 포도당은 식물이 성장하고 활동하는 데 필요한 에너지원이 됩니다.

광합성은 지구 생태계에서 매우 중요한 의미를 가집니다. 첫째, 식물은 광합성을 통해 만든 포도당을 자신의 에너지원으로 사용하고, 이 식물을 동물이 먹음으로써 에너지가 전달됩니다. 둘째, 광합성 과정에서 발생하는 산소는 생명체의 호흡에 필요합니다. 셋째, 광합성은 대기 중의 이산화탄소를 흡수하여 지구 온난화를 완화하는 데 도움을 줍니다.`,
      options: [
        { id: 1, text: '식물이 숨을 쉬는 과정' },
        { id: 2, text: '빛 에너지로 이산화탄소와 물로부터 포도당을 만드는 과정' },
        { id: 3, text: '식물이 물을 흡수하는 과정' },
        { id: 4, text: '식물이 꽃을 피우는 과정' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '글의 첫 문장에서 광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 만들어내는 과정이라고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 12,
      category: 'reading',
      questionType: 'choice',
      questionText: '광합성의 명반응에서 발생하는 것은?',
      passage: `광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 만들어내는 과정입니다. 이 과정은 식물의 잎에 있는 엽록체에서 일어나며, 지구상의 거의 모든 생명체가 살아가는 데 필수적인 역할을 합니다.

광합성 과정은 크게 두 단계로 나뉩니다. 첫 번째는 '명반응'으로, 빛이 있을 때 일어나는 반응입니다. 엽록체에 있는 엽록소가 빛 에너지를 흡수하여 물을 분해하고, 이 과정에서 산소가 발생합니다. 우리가 숨 쉬는 대기 중의 산소는 바로 이 과정에서 만들어진 것입니다.

두 번째는 '암반응'으로, 빛이 없어도 일어날 수 있는 반응입니다. 명반응에서 만들어진 에너지를 이용하여 이산화탄소로부터 포도당을 합성합니다. 포도당은 식물이 성장하고 활동하는 데 필요한 에너지원이 됩니다.

광합성은 지구 생태계에서 매우 중요한 의미를 가집니다. 첫째, 식물은 광합성을 통해 만든 포도당을 자신의 에너지원으로 사용하고, 이 식물을 동물이 먹음으로써 에너지가 전달됩니다. 둘째, 광합성 과정에서 발생하는 산소는 생명체의 호흡에 필요합니다. 셋째, 광합성은 대기 중의 이산화탄소를 흡수하여 지구 온난화를 완화하는 데 도움을 줍니다.`,
      options: [
        { id: 1, text: '이산화탄소' },
        { id: 2, text: '산소' },
        { id: 3, text: '포도당' },
        { id: 4, text: '질소' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 명반응 과정에서 물을 분해하고 산소가 발생한다고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 13,
      category: 'reading',
      questionType: 'choice',
      questionText: '암반응에서 만들어지는 것은?',
      passage: `광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 만들어내는 과정입니다. 이 과정은 식물의 잎에 있는 엽록체에서 일어나며, 지구상의 거의 모든 생명체가 살아가는 데 필수적인 역할을 합니다.

광합성 과정은 크게 두 단계로 나뉩니다. 첫 번째는 '명반응'으로, 빛이 있을 때 일어나는 반응입니다. 엽록체에 있는 엽록소가 빛 에너지를 흡수하여 물을 분해하고, 이 과정에서 산소가 발생합니다. 우리가 숨 쉬는 대기 중의 산소는 바로 이 과정에서 만들어진 것입니다.

두 번째는 '암반응'으로, 빛이 없어도 일어날 수 있는 반응입니다. 명반응에서 만들어진 에너지를 이용하여 이산화탄소로부터 포도당을 합성합니다. 포도당은 식물이 성장하고 활동하는 데 필요한 에너지원이 됩니다.

광합성은 지구 생태계에서 매우 중요한 의미를 가집니다. 첫째, 식물은 광합성을 통해 만든 포도당을 자신의 에너지원으로 사용하고, 이 식물을 동물이 먹음으로써 에너지가 전달됩니다. 둘째, 광합성 과정에서 발생하는 산소는 생명체의 호흡에 필요합니다. 셋째, 광합성은 대기 중의 이산화탄소를 흡수하여 지구 온난화를 완화하는 데 도움을 줍니다.`,
      options: [
        { id: 1, text: '산소' },
        { id: 2, text: '포도당' },
        { id: 3, text: '물' },
        { id: 4, text: '질소' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 암반응은 이산화탄소로부터 포도당을 합성한다고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 14,
      category: 'reading',
      questionType: 'choice',
      questionText: '광합성의 중요성으로 글에서 언급하지 않은 것은?',
      passage: `광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로부터 포도당을 만들어내는 과정입니다. 이 과정은 식물의 잎에 있는 엽록체에서 일어나며, 지구상의 거의 모든 생명체가 살아가는 데 필수적인 역할을 합니다.

광합성 과정은 크게 두 단계로 나뉩니다. 첫 번째는 '명반응'으로, 빛이 있을 때 일어나는 반응입니다. 엽록체에 있는 엽록소가 빛 에너지를 흡수하여 물을 분해하고, 이 과정에서 산소가 발생합니다. 우리가 숨 쉬는 대기 중의 산소는 바로 이 과정에서 만들어진 것입니다.

두 번째는 '암반응'으로, 빛이 없어도 일어날 수 있는 반응입니다. 명반응에서 만들어진 에너지를 이용하여 이산화탄소로부터 포도당을 합성합니다. 포도당은 식물이 성장하고 활동하는 데 필요한 에너지원이 됩니다.

광합성은 지구 생태계에서 매우 중요한 의미를 가집니다. 첫째, 식물은 광합성을 통해 만든 포도당을 자신의 에너지원으로 사용하고, 이 식물을 동물이 먹음으로써 에너지가 전달됩니다. 둘째, 광합성 과정에서 발생하는 산소는 생명체의 호흡에 필요합니다. 셋째, 광합성은 대기 중의 이산화탄소를 흡수하여 지구 온난화를 완화하는 데 도움을 줍니다.`,
      options: [
        { id: 1, text: '에너지 전달' },
        { id: 2, text: '산소 공급' },
        { id: 3, text: '지구 온난화 완화' },
        { id: 4, text: '물 정화' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서는 에너지 전달, 산소 공급, 지구 온난화 완화를 언급했지만 물 정화는 언급하지 않았습니다.',
    },

    // [지문 2] 문항 15-18: 용돈 관리 (생활)
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 15,
      category: 'reading',
      questionType: 'choice',
      questionText: '합리적인 소비란 무엇인가?',
      passage: `청소년기는 경제 관념을 형성하는 중요한 시기입니다. 용돈을 어떻게 관리하느냐에 따라 평생의 소비 습관이 결정될 수 있습니다. 따라서 올바른 용돈 관리 방법을 익히는 것이 중요합니다.

합리적인 소비는 자신의 수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것을 의미합니다. 필요한 것은 생활에 꼭 필요한 물건이고, 원하는 것은 있으면 좋지만 없어도 생활하는 데 지장이 없는 물건입니다. 예를 들어, 학용품은 필요한 것이지만 명품 운동화는 원하는 것에 가깝습니다.

용돈 관리의 첫 번째 원칙은 계획적으로 사용하는 것입니다. 용돈을 받으면 먼저 한 달 동안 필요한 지출 항목을 정리하고, 각 항목에 얼마씩 쓸지 계획을 세웁니다. 그리고 가계부를 작성하여 실제 지출 내역을 기록합니다. 이렇게 하면 자신이 어디에 돈을 많이 쓰는지 파악할 수 있고, 불필요한 지출을 줄일 수 있습니다.

두 번째 원칙은 저축하는 습관을 기르는 것입니다. 용돈의 일정 부분을 저축하면 나중에 큰 돈이 필요할 때 유용하게 사용할 수 있습니다. 저축은 단순히 돈을 모으는 것뿐만 아니라, 미래를 위해 현재의 소비를 조절하는 자제력을 키우는 데도 도움이 됩니다.`,
      options: [
        { id: 1, text: '무조건 싸게 사는 것' },
        { id: 2, text: '수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것' },
        { id: 3, text: '돈을 전혀 쓰지 않는 것' },
        { id: 4, text: '친구들이 사는 것을 따라 사는 것' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 합리적인 소비는 자신의 수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것이라고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 16,
      category: 'reading',
      questionType: 'choice',
      questionText: '필요한 것과 원하는 것의 차이는?',
      passage: `청소년기는 경제 관념을 형성하는 중요한 시기입니다. 용돈을 어떻게 관리하느냐에 따라 평생의 소비 습관이 결정될 수 있습니다. 따라서 올바른 용돈 관리 방법을 익히는 것이 중요합니다.

합리적인 소비는 자신의 수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것을 의미합니다. 필요한 것은 생활에 꼭 필요한 물건이고, 원하는 것은 있으면 좋지만 없어도 생활하는 데 지장이 없는 물건입니다. 예를 들어, 학용품은 필요한 것이지만 명품 운동화는 원하는 것에 가깝습니다.

용돈 관리의 첫 번째 원칙은 계획적으로 사용하는 것입니다. 용돈을 받으면 먼저 한 달 동안 필요한 지출 항목을 정리하고, 각 항목에 얼마씩 쓸지 계획을 세웁니다. 그리고 가계부를 작성하여 실제 지출 내역을 기록합니다. 이렇게 하면 자신이 어디에 돈을 많이 쓰는지 파악할 수 있고, 불필요한 지출을 줄일 수 있습니다.

두 번째 원칙은 저축하는 습관을 기르는 것입니다. 용돈의 일정 부분을 저축하면 나중에 큰 돈이 필요할 때 유용하게 사용할 수 있습니다. 저축은 단순히 돈을 모으는 것뿐만 아니라, 미래를 위해 현재의 소비를 조절하는 자제력을 키우는 데도 도움이 됩니다.`,
      options: [
        { id: 1, text: '필요한 것은 꼭 있어야 하고, 원하는 것은 없어도 생활에 지장이 없다' },
        { id: 2, text: '필요한 것은 비싸고, 원하는 것은 싸다' },
        { id: 3, text: '둘 다 똑같다' },
        { id: 4, text: '원하는 것이 더 중요하다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 필요한 것은 생활에 꼭 필요한 물건이고, 원하는 것은 있으면 좋지만 없어도 생활하는 데 지장이 없는 물건이라고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 17,
      category: 'reading',
      questionType: 'choice',
      questionText: '용돈 관리의 첫 번째 원칙은?',
      passage: `청소년기는 경제 관념을 형성하는 중요한 시기입니다. 용돈을 어떻게 관리하느냐에 따라 평생의 소비 습관이 결정될 수 있습니다. 따라서 올바른 용돈 관리 방법을 익히는 것이 중요합니다.

합리적인 소비는 자신의 수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것을 의미합니다. 필요한 것은 생활에 꼭 필요한 물건이고, 원하는 것은 있으면 좋지만 없어도 생활하는 데 지장이 없는 물건입니다. 예를 들어, 학용품은 필요한 것이지만 명품 운동화는 원하는 것에 가깝습니다.

용돈 관리의 첫 번째 원칙은 계획적으로 사용하는 것입니다. 용돈을 받으면 먼저 한 달 동안 필요한 지출 항목을 정리하고, 각 항목에 얼마씩 쓸지 계획을 세웁니다. 그리고 가계부를 작성하여 실제 지출 내역을 기록합니다. 이렇게 하면 자신이 어디에 돈을 많이 쓰는지 파악할 수 있고, 불필요한 지출을 줄일 수 있습니다.

두 번째 원칙은 저축하는 습관을 기르는 것입니다. 용돈의 일정 부분을 저축하면 나중에 큰 돈이 필요할 때 유용하게 사용할 수 있습니다. 저축은 단순히 돈을 모으는 것뿐만 아니라, 미래를 위해 현재의 소비를 조절하는 자제력을 키우는 데도 도움이 됩니다.`,
      options: [
        { id: 1, text: '계획적으로 사용하는 것' },
        { id: 2, text: '저축하는 것' },
        { id: 3, text: '많이 쓰는 것' },
        { id: 4, text: '친구들에게 빌리는 것' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 용돈 관리의 첫 번째 원칙은 계획적으로 사용하는 것이라고 명시하고 있습니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 18,
      category: 'reading',
      questionType: 'choice',
      questionText: '저축의 효과로 글에서 언급한 것은?',
      passage: `청소년기는 경제 관념을 형성하는 중요한 시기입니다. 용돈을 어떻게 관리하느냐에 따라 평생의 소비 습관이 결정될 수 있습니다. 따라서 올바른 용돈 관리 방법을 익히는 것이 중요합니다.

합리적인 소비는 자신의 수입 범위 내에서 필요한 것과 원하는 것을 구분하여 지출하는 것을 의미합니다. 필요한 것은 생활에 꼭 필요한 물건이고, 원하는 것은 있으면 좋지만 없어도 생활하는 데 지장이 없는 물건입니다. 예를 들어, 학용품은 필요한 것이지만 명품 운동화는 원하는 것에 가깝습니다.

용돈 관리의 첫 번째 원칙은 계획적으로 사용하는 것입니다. 용돈을 받으면 먼저 한 달 동안 필요한 지출 항목을 정리하고, 각 항목에 얼마씩 쓸지 계획을 세웁니다. 그리고 가계부를 작성하여 실제 지출 내역을 기록합니다. 이렇게 하면 자신이 어디에 돈을 많이 쓰는지 파악할 수 있고, 불필요한 지출을 줄일 수 있습니다.

두 번째 원칙은 저축하는 습관을 기르는 것입니다. 용돈의 일정 부분을 저축하면 나중에 큰 돈이 필요할 때 유용하게 사용할 수 있습니다. 저축은 단순히 돈을 모으는 것뿐만 아니라, 미래를 위해 현재의 소비를 조절하는 자제력을 키우는 데도 도움이 됩니다.`,
      options: [
        { id: 1, text: '큰 돈이 필요할 때 사용할 수 있고, 자제력을 키울 수 있다' },
        { id: 2, text: '친구들에게 자랑할 수 있다' },
        { id: 3, text: '용돈을 더 많이 받을 수 있다' },
        { id: 4, text: '은행에서 선물을 받을 수 있다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 저축은 나중에 큰 돈이 필요할 때 유용하게 사용할 수 있고, 자제력을 키우는 데도 도움이 된다고 설명합니다.',
    },

    // [지문 3] 문항 19-22: 우정 이야기 (문학)
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 19,
      category: 'reading',
      questionType: 'choice',
      questionText: '지혜가 화가 난 이유는?',
      passage: `중학교 2학년 지혜는 어제 있었던 일 때문에 마음이 복잡했습니다. 단짝 친구 수민이가 지혜의 비밀을 다른 친구들에게 말해버렸기 때문입니다.

지난주, 지혜는 수민에게만 자신이 수학 시험에서 낮은 점수를 받았다는 사실을 털어놓았습니다. "수민아, 이건 비밀인데... 나 이번 수학 시험 50점밖에 못 받았어. 아무한테도 말하지 마." 수민은 고개를 끄덕이며 "걱정 마, 비밀 지킬게"라고 약속했습니다.

그런데 며칠 후, 다른 반 친구가 지혜에게 다가와 "너 수학 시험 망쳤다며?"라고 물었습니다. 지혜는 깜짝 놀랐습니다. 수민이 외에는 아무도 모르는 사실이었기 때문입니다. 알고 보니 수민이가 다른 친구들에게 지혜의 이야기를 했던 것입니다.

지혜는 수민이를 찾아가 물었습니다. "수민아, 네가 내 이야기를 다른 애들한테 했어?" 수민은 당황하며 대답했습니다. "미안해, 지혜야. 나도 모르게 말이 나와버렸어. 일부러 그런 건 아니야."

지혜는 화가 났지만, 수민이와의 오랜 우정도 생각이 났습니다. 며칠 동안 고민한 끝에 지혜는 수민을 다시 만났습니다. "수민아, 나 정말 속상했어. 하지만 우리 우정도 소중하니까, 앞으로는 약속 꼭 지켜줘." 수민은 진심으로 사과했고, 두 사람은 다시 친구가 되었습니다. 이 일을 통해 지혜는 친구 사이에도 신뢰가 얼마나 중요한지 깨달았습니다.`,
      options: [
        { id: 1, text: '수민이가 자신의 비밀을 다른 친구들에게 말했기 때문에' },
        { id: 2, text: '수민이가 자신을 무시했기 때문에' },
        { id: 3, text: '수민이와 싸웠기 때문에' },
        { id: 4, text: '수민이가 자신의 물건을 빌려가지 않았기 때문에' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 수민이가 지혜의 비밀(수학 시험 점수)을 다른 친구들에게 말해서 지혜가 화가 났다고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 20,
      category: 'reading',
      questionType: 'choice',
      questionText: '수민이가 비밀을 말한 이유는?',
      passage: `중학교 2학년 지혜는 어제 있었던 일 때문에 마음이 복잡했습니다. 단짝 친구 수민이가 지혜의 비밀을 다른 친구들에게 말해버렸기 때문입니다.

지난주, 지혜는 수민에게만 자신이 수학 시험에서 낮은 점수를 받았다는 사실을 털어놓았습니다. "수민아, 이건 비밀인데... 나 이번 수학 시험 50점밖에 못 받았어. 아무한테도 말하지 마." 수민은 고개를 끄덕이며 "걱정 마, 비밀 지킬게"라고 약속했습니다.

그런데 며칠 후, 다른 반 친구가 지혜에게 다가와 "너 수학 시험 망쳤다며?"라고 물었습니다. 지혜는 깜짝 놀랐습니다. 수민이 외에는 아무도 모르는 사실이었기 때문입니다. 알고 보니 수민이가 다른 친구들에게 지혜의 이야기를 했던 것입니다.

지혜는 수민이를 찾아가 물었습니다. "수민아, 네가 내 이야기를 다른 애들한테 했어?" 수민은 당황하며 대답했습니다. "미안해, 지혜야. 나도 모르게 말이 나와버렸어. 일부러 그런 건 아니야."

지혜는 화가 났지만, 수민이와의 오랜 우정도 생각이 났습니다. 며칠 동안 고민한 끝에 지혜는 수민을 다시 만났습니다. "수민아, 나 정말 속상했어. 하지만 우리 우정도 소중하니까, 앞으로는 약속 꼭 지켜줘." 수민은 진심으로 사과했고, 두 사람은 다시 친구가 되었습니다. 이 일을 통해 지혜는 친구 사이에도 신뢰가 얼마나 중요한지 깨달았습니다.`,
      options: [
        { id: 1, text: '일부러 지혜를 괴롭히려고' },
        { id: 2, text: '나도 모르게 말이 나와버려서' },
        { id: 3, text: '지혜에게 복수하려고' },
        { id: 4, text: '다른 친구들에게 자랑하려고' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 수민은 일부러가 아니라 나도 모르게 말이 나와버렸다고 대답합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 21,
      category: 'reading',
      questionType: 'choice',
      questionText: '지혜가 수민을 용서한 이유는?',
      passage: `중학교 2학년 지혜는 어제 있었던 일 때문에 마음이 복잡했습니다. 단짝 친구 수민이가 지혜의 비밀을 다른 친구들에게 말해버렸기 때문입니다.

지난주, 지혜는 수민에게만 자신이 수학 시험에서 낮은 점수를 받았다는 사실을 털어놓았습니다. "수민아, 이건 비밀인데... 나 이번 수학 시험 50점밖에 못 받았어. 아무한테도 말하지 마." 수민은 고개를 끄덕이며 "걱정 마, 비밀 지킬게"라고 약속했습니다.

그런데 며칠 후, 다른 반 친구가 지혜에게 다가와 "너 수학 시험 망쳤다며?"라고 물었습니다. 지혜는 깜짝 놀랐습니다. 수민이 외에는 아무도 모르는 사실이었기 때문입니다. 알고 보니 수민이가 다른 친구들에게 지혜의 이야기를 했던 것입니다.

지혜는 수민이를 찾아가 물었습니다. "수민아, 네가 내 이야기를 다른 애들한테 했어?" 수민은 당황하며 대답했습니다. "미안해, 지혜야. 나도 모르게 말이 나와버렸어. 일부러 그런 건 아니야."

지혜는 화가 났지만, 수민이와의 오랜 우정도 생각이 났습니다. 며칠 동안 고민한 끝에 지혜는 수민을 다시 만났습니다. "수민아, 나 정말 속상했어. 하지만 우리 우정도 소중하니까, 앞으로는 약속 꼭 지켜줘." 수민은 진심으로 사과했고, 두 사람은 다시 친구가 되었습니다. 이 일을 통해 지혜는 친구 사이에도 신뢰가 얼마나 중요한지 깨달았습니다.`,
      options: [
        { id: 1, text: '수민과의 오랜 우정이 소중했기 때문에' },
        { id: 2, text: '부모님이 용서하라고 해서' },
        { id: 3, text: '다른 친구가 없어서' },
        { id: 4, text: '수민이 돈을 줘서' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 지혜는 화가 났지만 수민이와의 오랜 우정도 소중하다고 생각해서 용서했다고 설명합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 22,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 이야기가 전하는 교훈은?',
      passage: `중학교 2학년 지혜는 어제 있었던 일 때문에 마음이 복잡했습니다. 단짝 친구 수민이가 지혜의 비밀을 다른 친구들에게 말해버렸기 때문입니다.

지난주, 지혜는 수민에게만 자신이 수학 시험에서 낮은 점수를 받았다는 사실을 털어놓았습니다. "수민아, 이건 비밀인데... 나 이번 수학 시험 50점밖에 못 받았어. 아무한테도 말하지 마." 수민은 고개를 끄덕이며 "걱정 마, 비밀 지킬게"라고 약속했습니다.

그런데 며칠 후, 다른 반 친구가 지혜에게 다가와 "너 수학 시험 망쳤다며?"라고 물었습니다. 지혜는 깜짝 놀랐습니다. 수민이 외에는 아무도 모르는 사실이었기 때문입니다. 알고 보니 수민이가 다른 친구들에게 지혜의 이야기를 했던 것입니다.

지혜는 수민이를 찾아가 물었습니다. "수민아, 네가 내 이야기를 다른 애들한테 했어?" 수민은 당황하며 대답했습니다. "미안해, 지혜야. 나도 모르게 말이 나와버렸어. 일부러 그런 건 아니야."

지혜는 화가 났지만, 수민이와의 오랜 우정도 생각이 났습니다. 며칠 동안 고민한 끝에 지혜는 수민을 다시 만났습니다. "수민아, 나 정말 속상했어. 하지만 우리 우정도 소중하니까, 앞으로는 약속 꼭 지켜줘." 수민은 진심으로 사과했고, 두 사람은 다시 친구가 되었습니다. 이 일을 통해 지혜는 친구 사이에도 신뢰가 얼마나 중요한지 깨달았습니다.`,
      options: [
        { id: 1, text: '공부를 열심히 해야 한다' },
        { id: 2, text: '친구 사이에 신뢰가 중요하다' },
        { id: 3, text: '시험은 중요하지 않다' },
        { id: 4, text: '비밀은 없는 것이 좋다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글의 마지막에서 지혜는 친구 사이에도 신뢰가 얼마나 중요한지 깨달았다고 명시되어 있습니다.',
    },

    // [지문 4] 문항 23: 독서의 중요성
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 23,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글의 주제로 가장 알맞은 것은?',
      passage: `독서는 우리의 삶을 풍요롭게 만드는 가장 좋은 방법 중 하나입니다. 책을 읽으면 여러 가지 좋은 점이 있습니다.

첫째, 독서는 지식을 넓혀줍니다. 책에는 다양한 분야의 정보와 지식이 담겨 있습니다. 과학책을 읽으면 자연의 원리를 이해할 수 있고, 역사책을 읽으면 과거의 사건들을 배울 수 있습니다. 이렇게 쌓인 지식은 학교 공부에도 도움이 되고, 세상을 이해하는 폭을 넓혀줍니다.

둘째, 독서는 상상력과 창의력을 키워줍니다. 특히 소설이나 동화를 읽을 때 우리는 글 속의 세계를 머릿속으로 그려봅니다. 주인공이 되어 모험을 하기도 하고, 등장인물의 감정을 느끼기도 합니다. 이러한 경험은 상상력을 풍부하게 만들고, 새로운 아이디어를 생각해내는 창의력을 기르는 데 도움이 됩니다.

셋째, 독서는 언어 능력을 향상시킵니다. 책을 많이 읽으면 자연스럽게 다양한 어휘를 접하게 되고, 올바른 문장 구조를 익히게 됩니다. 이는 글쓰기와 말하기 능력을 높여주어 자신의 생각을 더 정확하게 표현할 수 있게 합니다.

따라서 우리는 바쁜 일상 속에서도 틈틈이 책을 읽는 습관을 길러야 합니다. 하루에 10분이라도 책을 읽으면, 1년 후에는 많은 책을 읽을 수 있습니다.`,
      options: [
        { id: 1, text: '독서의 중요성과 효과' },
        { id: 2, text: '책의 역사' },
        { id: 3, text: '도서관 이용 방법' },
        { id: 4, text: '좋은 책을 고르는 방법' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'easy',
      explanation: '글은 독서가 지식, 상상력, 언어 능력에 미치는 긍정적인 효과를 설명하며 독서의 중요성을 강조하고 있습니다.',
    },

    // ===== 문법/어법 (7문항) =====
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 24,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 주어를 찾으시오.\n\n'아름다운 꽃이 정원에 피었다.'",
      options: [
        { id: 1, text: '아름다운' },
        { id: 2, text: '꽃이' },
        { id: 3, text: '정원에' },
        { id: 4, text: '피었다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: "'꽃이'가 주어입니다. '아름다운'은 관형어, '정원에'는 부사어, '피었다'는 서술어입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 25,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 높임 표현이 사용된 문장은?',
      options: [
        { id: 1, text: '선생님께서 교실에 들어오셨다.' },
        { id: 2, text: '친구가 학교에 왔다.' },
        { id: 3, text: '동생이 밥을 먹는다.' },
        { id: 4, text: '나는 책을 읽는다.' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '①은 주체인 선생님을 높이는 높임 표현(께서, -시-)을 사용했습니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 26,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 피동 표현이 사용된 문장은?',
      options: [
        { id: 1, text: '문이 열렸다.' },
        { id: 2, text: '나는 문을 열었다.' },
        { id: 3, text: '엄마가 문을 닫는다.' },
        { id: 4, text: '동생이 방에 들어간다.' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "'열렸다'는 피동 표현으로, 문이 스스로 열린 것이 아니라 누군가에 의해 열린 상태를 나타냅니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 27,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 목적어를 찾으시오.\n\n'나는 친구에게 책을 주었다.'",
      options: [
        { id: 1, text: '나는' },
        { id: 2, text: '친구에게' },
        { id: 3, text: '책을' },
        { id: 4, text: '주었다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'medium',
      explanation: "'책을'이 목적어입니다. 목적어는 동작의 대상이 되는 말로 '을/를'이 붙습니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 28,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 사동 표현이 사용된 문장은?',
      options: [
        { id: 1, text: '아기가 운다.' },
        { id: 2, text: '엄마가 아기를 울린다.' },
        { id: 3, text: '아기가 웃는다.' },
        { id: 4, text: '아기가 잠든다.' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "'울린다'는 사동 표현으로, 다른 사람(아기)을 울게 만든다는 의미입니다.",
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 29,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 단문(홑문장)은?',
      options: [
        { id: 1, text: '비가 오면 집에 있겠다.' },
        { id: 2, text: '나는 공부하고 운동한다.' },
        { id: 3, text: '하늘이 맑다.' },
        { id: 4, text: '내가 읽은 책은 재미있다.' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '③은 하나의 주어와 서술어로 이루어진 단문입니다. 나머지는 모두 복문입니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 30,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 밑줄 친 말의 품사는?\n\n'**매우** 아름다운 꽃이다.'",
      options: [
        { id: 1, text: '명사' },
        { id: 2, text: '동사' },
        { id: 3, text: '형용사' },
        { id: 4, text: '부사' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'medium',
      explanation: "'매우'는 '아름다운'을 꾸며주는 부사입니다.",
    },

    // ===== 추론/사고력 (5문항) =====
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 31,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 상황에서 가장 적절한 행동은?\n\n'길을 가다가 지갑을 주웠다.'",
      options: [
        { id: 1, text: '그냥 가져간다' },
        { id: 2, text: '경찰서나 분실물 센터에 신고한다' },
        { id: 3, text: '친구들과 나눠 갖는다' },
        { id: 4, text: '버린다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '주운 물건은 경찰서나 분실물 센터에 신고하여 주인이 찾아갈 수 있도록 하는 것이 올바른 행동입니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 32,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 내용으로부터 추론할 수 있는 것은?\n\n'민수는 매일 아침 일찍 일어나 조깅을 하고, 채소와 과일을 많이 먹는다.'",
      options: [
        { id: 1, text: '민수는 건강에 신경 쓴다' },
        { id: 2, text: '민수는 운동을 싫어한다' },
        { id: 3, text: '민수는 아프다' },
        { id: 4, text: '민수는 게으르다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'easy',
      explanation: '규칙적인 운동과 건강한 식습관은 민수가 건강에 신경 쓴다는 것을 보여줍니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 33,
      category: 'reasoning',
      questionType: 'choice',
      questionText: '다음 규칙을 찾아 빈칸에 들어갈 수를 구하시오.\n\n3, 6, 9, 12, 15, ____',
      options: [
        { id: 1, text: '16' },
        { id: 2, text: '17' },
        { id: 3, text: '18' },
        { id: 4, text: '20' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: '3씩 증가하는 수열입니다. 15 + 3 = 18',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 34,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 글을 읽고 필자의 주장으로 가장 알맞은 것은?\n\n'스마트폰을 오래 사용하면 눈이 나빠지고 거북목이 생길 수 있습니다.\n따라서 스마트폰 사용 시간을 줄이고, 바른 자세로 사용해야 합니다.'",
      options: [
        { id: 1, text: '스마트폰을 절대 사용하지 말아야 한다' },
        { id: 2, text: '스마트폰 사용 시간을 줄이고 바른 자세로 사용해야 한다' },
        { id: 3, text: '스마트폰은 아무 문제가 없다' },
        { id: 4, text: '눈이 나빠지는 것은 괜찮다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '필자는 스마트폰의 부작용을 언급하며 사용 시간을 줄이고 바른 자세로 사용할 것을 주장합니다.',
    },
    {
      templateCode: 'MIDDLE2-V1',
      questionNumber: 35,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 두 진술을 보고 논리적으로 도출할 수 있는 결론은?\n\n'진술 1: 모든 새는 날개가 있다.\n진술 2: 참새는 새이다.'",
      options: [
        { id: 1, text: '참새는 날개가 없다' },
        { id: 2, text: '참새는 날개가 있다' },
        { id: 3, text: '참새는 새가 아니다' },
        { id: 4, text: '모든 새는 참새이다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '모든 새가 날개가 있고, 참새가 새이므로, 참새는 날개가 있다는 결론을 도출할 수 있습니다.',
    },
  ],
};
