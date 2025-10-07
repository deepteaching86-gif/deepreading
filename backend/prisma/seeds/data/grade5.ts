import { GradeSeedData } from '../../../src/types/seed.types';

/**
 * 초등 5학년 문해력 진단 평가 시드 데이터
 * - 총 60문항 (평가 35문항 + 설문 25문항)
 * - 평가: 어휘력 10, 독해력 13, 문법 7, 추론 5
 * - 설문: 독서 동기 5, 독서 환경 5, 독서 습관 5, 글쓰기 동기 5, 독서 선호도 5
 * - 소요 시간: 40분
 * - 난이도: easy(7) / medium(17) / hard(11)
 */
export const grade5Data: GradeSeedData = {
  template: {
    templateCode: 'ELEM5-V1',
    grade: 5,
    title: '초등 5학년 문해력 진단 평가',
    version: '1.0',
    totalQuestions: 60,
    timeLimit: 40,
    isActive: true,
  },
  questions: [
    // ===== 어휘력 (10문항) =====
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 1,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'협동'과 가장 반대되는 의미의 단어는?",
      options: [
        { id: 1, text: '협력' },
        { id: 2, text: '경쟁' },
        { id: 3, text: '단독' },
        { id: 4, text: '협조' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: '협동은 여럿이 함께 힘을 합쳐 일하는 것이고, 단독은 혼자서 독립적으로 행동하는 것으로 반대 개념입니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 2,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'각주대망(刻舟求劍)'의 의미로 알맞은 것은?",
      options: [
        { id: 1, text: '배에 칼을 새기는 행동' },
        { id: 2, text: '시대 변화를 따라가지 못하고 낡은 생각을 고집함' },
        { id: 3, text: '잃어버린 물건을 찾는 방법' },
        { id: 4, text: '배를 타고 여행을 떠나는 것' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '각주대망(刻舟求劍)은 배에 표시를 하여 떨어뜨린 칼을 찾으려 한다는 뜻으로, 변화하는 상황을 제대로 파악하지 못하고 융통성 없이 행동함을 비유합니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 3,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 밑줄 친 '달다'의 뜻이 다른 하나는?\n\n① 벽에 그림을 **달다**\n② 꿀은 맛이 **달다**\n③ 천장에 조명을 **달다**\n④ 자동차에 번호판을 **달다**",
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "②는 '맛이 설탕이나 꿀과 같다'의 의미이고, ①③④는 '어떤 물건을 다른 물건에 붙이거나 매다'의 의미입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 4,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'역지사지(易地思之)'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '먼 곳으로 이사를 가다' },
        { id: 2, text: '처지를 바꾸어 생각하다' },
        { id: 3, text: '어려운 일을 해결하다' },
        { id: 4, text: '땅을 바꾸어 농사를 짓다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "역지사지(易地思之)는 '바꿀 역(易) + 땅 지(地) + 생각 사(思) + 어조사 지(之)'로, 처지를 바꾸어 상대방의 입장에서 생각한다는 의미입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 5,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'권장'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '어떤 일을 하도록 권하고 장려함' },
        { id: 2, text: '무엇인가를 강제로 시킴' },
        { id: 3, text: '책을 읽는 행위' },
        { id: 4, text: '물건을 파는 행위' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '권장은 어떤 일이나 행동을 하도록 권하고 장려하는 것을 의미합니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 6,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'금의환향(錦衣還鄕)'의 의미는?",
      options: [
        { id: 1, text: '비단옷을 입고 고향에 돌아옴, 즉 출세하여 고향에 돌아옴' },
        { id: 2, text: '아름다운 옷을 선물로 가져감' },
        { id: 3, text: '고향을 떠나 새로운 곳으로 감' },
        { id: 4, text: '금으로 만든 옷을 입음' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: "금의환향(錦衣還鄕)은 '비단 금(錦) + 옷 의(衣) + 돌아올 환(還) + 고향 향(鄕)'로, 출세하여 고향에 영광스럽게 돌아온다는 의미입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 7,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "다음 중 '소중하다'와 비슷한 의미의 한자성어는?",
      options: [
        { id: 1, text: '천금(千金)' },
        { id: 2, text: '무가치(無價値)' },
        { id: 3, text: '하찮음' },
        { id: 4, text: '미미함' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "천금은 '천 금(千金)'으로 매우 귀중하고 값진 것을 의미하여, 소중하다와 유사한 의미입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 8,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'등잔 밑이 어둡다'는 속담의 의미는?",
      options: [
        { id: 1, text: '등잔에 불을 켜지 않아서 어둡다' },
        { id: 2, text: '가까이 있는 일은 오히려 알기 어렵다' },
        { id: 3, text: '밤이 되면 어두워진다' },
        { id: 4, text: '등잔을 바닥에 놓으면 위험하다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "'등잔 밑이 어둡다'는 가까이 있는 사실이나 사물을 오히려 알아차리기 어렵다는 뜻의 속담입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 9,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'신중하다'의 의미로 가장 알맞은 것은?",
      options: [
        { id: 1, text: '매우 빠르게 행동함' },
        { id: 2, text: '조심스럽고 신경을 많이 씀' },
        { id: 3, text: '대충 넘어감' },
        { id: 4, text: '아무 생각 없이 행동함' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '신중하다는 말이나 행동을 조심스럽고 신경 써서 한다는 의미입니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 10,
      category: 'vocabulary',
      questionType: 'choice',
      questionText: "'화룡점정(畫龍點睛)'의 의미는?",
      options: [
        { id: 1, text: '용을 그리고 눈동자를 그려 넣는다는 뜻으로, 가장 중요한 부분을 완성함' },
        { id: 2, text: '아름다운 그림을 그리는 것' },
        { id: 3, text: '용을 숭배하는 의식' },
        { id: 4, text: '그림에 색을 칠하는 행위' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'hard',
      explanation: "화룡점정(畫龍點睛)은 '그릴 화(畫) + 용 룡(龍) + 점 점(點) + 눈동자 정(睛)'로, 가장 중요한 부분을 마지막에 완성하여 전체를 빛나게 한다는 의미입니다.",
    },

    // ===== 독해력 (13문항) =====
    // [지문 1] 문항 11-13: 기후 변화
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 11,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글의 중심 내용은 무엇인가요?',
      passage: `기후 변화는 지구 전체의 기온이 오르고 날씨 패턴이 변하는 현상입니다.
주요 원인은 화석 연료를 태울 때 발생하는 이산화탄소 같은 온실가스입니다.
온실가스가 대기 중에 쌓이면 지구의 열이 우주로 빠져나가지 못하고
갇혀서 지구 온도가 계속 올라가게 됩니다.

기후 변화로 인해 극지방의 빙하가 녹고, 해수면이 상승하며,
이상 기후 현상이 자주 발생합니다. 태풍, 가뭄, 폭우 등이 더 자주,
더 강하게 나타나고 있으며, 이는 사람들의 생활과 생태계에
큰 영향을 미치고 있습니다.

기후 변화를 막기 위해서는 온실가스 배출을 줄여야 합니다.
재생 에너지 사용, 에너지 절약, 나무 심기 등의 노력이 필요하며,
개인, 기업, 국가 모두가 함께 행동해야 합니다.`,
      options: [
        { id: 1, text: '날씨 예보 방법' },
        { id: 2, text: '기후 변화의 원인과 영향, 해결 방법' },
        { id: 3, text: '화석 연료의 종류' },
        { id: 4, text: '빙하의 특성' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '글은 기후 변화의 원인, 영향, 그리고 해결 방법에 대해 포괄적으로 설명하고 있습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 12,
      category: 'reading',
      questionType: 'choice',
      questionText: '기후 변화의 주요 원인으로 제시된 것은?',
      passage: `기후 변화는 지구 전체의 기온이 오르고 날씨 패턴이 변하는 현상입니다.
주요 원인은 화석 연료를 태울 때 발생하는 이산화탄소 같은 온실가스입니다.
온실가스가 대기 중에 쌓이면 지구의 열이 우주로 빠져나가지 못하고
갇혀서 지구 온도가 계속 올라가게 됩니다.

기후 변화로 인해 극지방의 빙하가 녹고, 해수면이 상승하며,
이상 기후 현상이 자주 발생합니다. 태풍, 가뭄, 폭우 등이 더 자주,
더 강하게 나타나고 있으며, 이는 사람들의 생활과 생태계에
큰 영향을 미치고 있습니다.

기후 변화를 막기 위해서는 온실가스 배출을 줄여야 합니다.
재생 에너지 사용, 에너지 절약, 나무 심기 등의 노력이 필요하며,
개인, 기업, 국가 모두가 함께 행동해야 합니다.`,
      options: [
        { id: 1, text: '나무를 많이 심어서' },
        { id: 2, text: '온실가스 배출' },
        { id: 3, text: '재생 에너지 사용' },
        { id: 4, text: '에너지 절약' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 화석 연료를 태울 때 발생하는 이산화탄소 같은 온실가스가 주요 원인이라고 명시하고 있습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 13,
      category: 'reading',
      questionType: 'choice',
      questionText: '글쓴이가 제시한 기후 변화 해결 방법이 아닌 것은?',
      passage: `기후 변화는 지구 전체의 기온이 오르고 날씨 패턴이 변하는 현상입니다.
주요 원인은 화석 연료를 태울 때 발생하는 이산화탄소 같은 온실가스입니다.
온실가스가 대기 중에 쌓이면 지구의 열이 우주로 빠져나가지 못하고
갇혀서 지구 온도가 계속 올라가게 됩니다.

기후 변화로 인해 극지방의 빙하가 녹고, 해수면이 상승하며,
이상 기후 현상이 자주 발생합니다. 태풍, 가뭄, 폭우 등이 더 자주,
더 강하게 나타나고 있으며, 이는 사람들의 생활과 생태계에
큰 영향을 미치고 있습니다.

기후 변화를 막기 위해서는 온실가스 배출을 줄여야 합니다.
재생 에너지 사용, 에너지 절약, 나무 심기 등의 노력이 필요하며,
개인, 기업, 국가 모두가 함께 행동해야 합니다.`,
      options: [
        { id: 1, text: '재생 에너지 사용' },
        { id: 2, text: '에너지 절약' },
        { id: 3, text: '나무 심기' },
        { id: 4, text: '화석 연료 사용 증가' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'hard',
      explanation: '화석 연료 사용 증가는 오히려 기후 변화를 악화시키는 행동으로, 해결 방법이 아닙니다.',
    },

    // [지문 2] 문항 14-17: 세종대왕과 한글
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 14,
      category: 'reading',
      questionType: 'choice',
      questionText: '세종대왕이 한글을 만든 이유는?',
      passage: `세종대왕은 조선시대의 위대한 왕으로, 한글을 창제한 것으로 유명합니다.
당시 우리나라 사람들은 한자를 사용했는데, 한자는 배우기 어려워서
일반 백성들은 글을 읽고 쓸 수 없었습니다.

세종대왕은 백성들이 자신의 생각을 쉽게 표현하고 소통할 수 있도록
1443년에 훈민정음(한글)을 만들었습니다. 한글은 과학적이고 체계적으로
설계되어 배우기 쉽고 사용하기 편리합니다.

한글 창제는 문화적으로 큰 의미가 있습니다. 백성들이 글을 읽고 쓸 수 있게
되면서 지식이 널리 퍼지고, 문화가 발전했습니다. 또한 우리 고유의
문자를 갖게 됨으로써 민족의 정체성이 확립되었습니다.

오늘날 한글은 전 세계적으로 그 우수성을 인정받고 있으며,
유네스코에서는 세종대왕의 업적을 기리기 위해
'유네스코 세종대왕 문해상'을 제정하여 시상하고 있습니다.`,
      options: [
        { id: 1, text: '한자를 없애기 위해' },
        { id: 2, text: '백성들이 쉽게 글을 읽고 쓸 수 있도록 하기 위해' },
        { id: 3, text: '다른 나라와 경쟁하기 위해' },
        { id: 4, text: '왕의 권위를 높이기 위해' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '글에서 백성들이 자신의 생각을 쉽게 표현하고 소통할 수 있도록 하기 위해 한글을 만들었다고 설명합니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 15,
      category: 'reading',
      questionType: 'choice',
      questionText: '한글이 창제된 연도는?',
      passage: `세종대왕은 조선시대의 위대한 왕으로, 한글을 창제한 것으로 유명합니다.
당시 우리나라 사람들은 한자를 사용했는데, 한자는 배우기 어려워서
일반 백성들은 글을 읽고 쓸 수 없었습니다.

세종대왕은 백성들이 자신의 생각을 쉽게 표현하고 소통할 수 있도록
1443년에 훈민정음(한글)을 만들었습니다. 한글은 과학적이고 체계적으로
설계되어 배우기 쉽고 사용하기 편리합니다.

한글 창제는 문화적으로 큰 의미가 있습니다. 백성들이 글을 읽고 쓸 수 있게
되면서 지식이 널리 퍼지고, 문화가 발전했습니다. 또한 우리 고유의
문자를 갖게 됨으로써 민족의 정체성이 확립되었습니다.

오늘날 한글은 전 세계적으로 그 우수성을 인정받고 있으며,
유네스코에서는 세종대왕의 업적을 기리기 위해
'유네스코 세종대왕 문해상'을 제정하여 시상하고 있습니다.`,
      options: [
        { id: 1, text: '1443년' },
        { id: 2, text: '1543년' },
        { id: 3, text: '1343년' },
        { id: 4, text: '1643년' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '글에서 1443년에 훈민정음(한글)을 만들었다고 명시되어 있습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 16,
      category: 'reading',
      questionType: 'choice',
      questionText: '한글 창제의 문화적 의미가 아닌 것은?',
      passage: `세종대왕은 조선시대의 위대한 왕으로, 한글을 창제한 것으로 유명합니다.
당시 우리나라 사람들은 한자를 사용했는데, 한자는 배우기 어려워서
일반 백성들은 글을 읽고 쓸 수 없었습니다.

세종대왕은 백성들이 자신의 생각을 쉽게 표현하고 소통할 수 있도록
1443년에 훈민정음(한글)을 만들었습니다. 한글은 과학적이고 체계적으로
설계되어 배우기 쉽고 사용하기 편리합니다.

한글 창제는 문화적으로 큰 의미가 있습니다. 백성들이 글을 읽고 쓸 수 있게
되면서 지식이 널리 퍼지고, 문화가 발전했습니다. 또한 우리 고유의
문자를 갖게 됨으로써 민족의 정체성이 확립되었습니다.

오늘날 한글은 전 세계적으로 그 우수성을 인정받고 있으며,
유네스코에서는 세종대왕의 업적을 기리기 위해
'유네스코 세종대왕 문해상'을 제정하여 시상하고 있습니다.`,
      options: [
        { id: 1, text: '지식이 널리 퍼짐' },
        { id: 2, text: '문화가 발전함' },
        { id: 3, text: '민족의 정체성 확립' },
        { id: 4, text: '외국어 사용 증가' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'hard',
      explanation: '글에서는 지식 전파, 문화 발전, 민족 정체성 확립을 언급했지만 외국어 사용 증가는 언급하지 않았습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 17,
      category: 'reading',
      questionType: 'choice',
      questionText: '유네스코가 제정한 상의 이름은?',
      passage: `세종대왕은 조선시대의 위대한 왕으로, 한글을 창제한 것으로 유명합니다.
당시 우리나라 사람들은 한자를 사용했는데, 한자는 배우기 어려워서
일반 백성들은 글을 읽고 쓸 수 없었습니다.

세종대왕은 백성들이 자신의 생각을 쉽게 표현하고 소통할 수 있도록
1443년에 훈민정음(한글)을 만들었습니다. 한글은 과학적이고 체계적으로
설계되어 배우기 쉽고 사용하기 편리합니다.

한글 창제는 문화적으로 큰 의미가 있습니다. 백성들이 글을 읽고 쓸 수 있게
되면서 지식이 널리 퍼지고, 문화가 발전했습니다. 또한 우리 고유의
문자를 갖게 됨으로써 민족의 정체성이 확립되었습니다.

오늘날 한글은 전 세계적으로 그 우수성을 인정받고 있으며,
유네스코에서는 세종대왕의 업적을 기리기 위해
'유네스코 세종대왕 문해상'을 제정하여 시상하고 있습니다.`,
      options: [
        { id: 1, text: '유네스코 한글상' },
        { id: 2, text: '유네스코 세종대왕 문해상' },
        { id: 3, text: '유네스코 문화상' },
        { id: 4, text: '유네스코 과학상' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "글의 마지막 문단에서 '유네스코 세종대왕 문해상'을 제정하여 시상한다고 명시되어 있습니다.",
    },

    // [지문 3] 문항 18-21: 민지의 반장 선거
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 18,
      category: 'reading',
      questionType: 'choice',
      questionText: '민지가 아쉬워한 이유는?',
      passage: `민지는 학교에서 돌아와 엄마에게 말했습니다.
"엄마, 오늘 반장 선거가 있었는데, 나는 떨어졌어요."

민지는 반장이 되고 싶어서 열심히 준비했습니다. 공약도 만들고,
연설 연습도 많이 했습니다. 하지만 결과는 2등이었습니다.

엄마는 민지의 손을 잡으며 말했습니다.
"민지야, 결과가 아쉽겠지만 너는 정말 잘했어. 열심히 준비한 네 모습이
자랑스러워. 그리고 2등이라는 것은 많은 친구들이 너를 믿고 지지했다는
뜻이야. 다음에 또 도전할 수 있고, 이번 경험은 네게 좋은 배움이 될 거야."

민지는 엄마의 말을 듣고 조금씩 마음이 편안해졌습니다.
'맞아, 나는 최선을 다했고, 많은 친구들이 나를 지지해 줬어.
다음에는 더 잘할 수 있을 거야.'

민지는 다시 웃으며 말했습니다.
"엄마, 고마워요. 다음에는 꼭 반장이 될 수 있도록 더 노력할게요!"`,
      options: [
        { id: 1, text: '숙제를 못 해서' },
        { id: 2, text: '반장 선거에서 떨어져서' },
        { id: 3, text: '친구와 싸워서' },
        { id: 4, text: '시험을 못 봐서' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'easy',
      explanation: '민지는 반장 선거에서 2등을 해서 반장이 되지 못한 것을 아쉬워했습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 19,
      category: 'reading',
      questionType: 'choice',
      questionText: '엄마가 민지에게 한 말의 의도는?',
      passage: `민지는 학교에서 돌아와 엄마에게 말했습니다.
"엄마, 오늘 반장 선거가 있었는데, 나는 떨어졌어요."

민지는 반장이 되고 싶어서 열심히 준비했습니다. 공약도 만들고,
연설 연습도 많이 했습니다. 하지만 결과는 2등이었습니다.

엄마는 민지의 손을 잡으며 말했습니다.
"민지야, 결과가 아쉽겠지만 너는 정말 잘했어. 열심히 준비한 네 모습이
자랑스러워. 그리고 2등이라는 것은 많은 친구들이 너를 믿고 지지했다는
뜻이야. 다음에 또 도전할 수 있고, 이번 경험은 네게 좋은 배움이 될 거야."

민지는 엄마의 말을 듣고 조금씩 마음이 편안해졌습니다.
'맞아, 나는 최선을 다했고, 많은 친구들이 나를 지지해 줬어.
다음에는 더 잘할 수 있을 거야.'

민지는 다시 웃으며 말했습니다.
"엄마, 고마워요. 다음에는 꼭 반장이 될 수 있도록 더 노력할게요!"`,
      options: [
        { id: 1, text: '민지를 꾸짖으려고' },
        { id: 2, text: '민지를 위로하고 격려하려고' },
        { id: 3, text: '반장 선거를 비판하려고' },
        { id: 4, text: '민지에게 포기하라고 하려고' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: '엄마는 민지의 노력을 인정하고, 긍정적인 측면을 찾아주며, 다음 기회를 이야기하며 위로하고 격려했습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 20,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 이야기를 통해 알 수 있는 교훈은?',
      passage: `민지는 학교에서 돌아와 엄마에게 말했습니다.
"엄마, 오늘 반장 선거가 있었는데, 나는 떨어졌어요."

민지는 반장이 되고 싶어서 열심히 준비했습니다. 공약도 만들고,
연설 연습도 많이 했습니다. 하지만 결과는 2등이었습니다.

엄마는 민지의 손을 잡으며 말했습니다.
"민지야, 결과가 아쉽겠지만 너는 정말 잘했어. 열심히 준비한 네 모습이
자랑스러워. 그리고 2등이라는 것은 많은 친구들이 너를 믿고 지지했다는
뜻이야. 다음에 또 도전할 수 있고, 이번 경험은 네게 좋은 배움이 될 거야."

민지는 엄마의 말을 듣고 조금씩 마음이 편안해졌습니다.
'맞아, 나는 최선을 다했고, 많은 친구들이 나를 지지해 줬어.
다음에는 더 잘할 수 있을 거야.'

민지는 다시 웃으며 말했습니다.
"엄마, 고마워요. 다음에는 꼭 반장이 될 수 있도록 더 노력할게요!"`,
      options: [
        { id: 1, text: '선거에서 이기는 것이 가장 중요하다' },
        { id: 2, text: '실패를 경험으로 삼고 다시 도전하는 자세가 중요하다' },
        { id: 3, text: '반장은 되지 않는 것이 좋다' },
        { id: 4, text: '노력해도 소용없다' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: '이야기는 실패를 긍정적으로 받아들이고, 배움의 기회로 삼아 다시 도전하는 태도의 중요성을 보여줍니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 21,
      category: 'reading',
      questionType: 'choice',
      questionText: '민지의 마음이 변화한 과정을 순서대로 나열한 것은?',
      passage: `민지는 학교에서 돌아와 엄마에게 말했습니다.
"엄마, 오늘 반장 선거가 있었는데, 나는 떨어졌어요."

민지는 반장이 되고 싶어서 열심히 준비했습니다. 공약도 만들고,
연설 연습도 많이 했습니다. 하지만 결과는 2등이었습니다.

엄마는 민지의 손을 잡으며 말했습니다.
"민지야, 결과가 아쉽겠지만 너는 정말 잘했어. 열심히 준비한 네 모습이
자랑스러워. 그리고 2등이라는 것은 많은 친구들이 너를 믿고 지지했다는
뜻이야. 다음에 또 도전할 수 있고, 이번 경험은 네게 좋은 배움이 될 거야."

민지는 엄마의 말을 듣고 조금씩 마음이 편안해졌습니다.
'맞아, 나는 최선을 다했고, 많은 친구들이 나를 지지해 줬어.
다음에는 더 잘할 수 있을 거야.'

민지는 다시 웃으며 말했습니다.
"엄마, 고마워요. 다음에는 꼭 반장이 될 수 있도록 더 노력할게요!"`,
      options: [
        { id: 1, text: '아쉬움 → 위로받음 → 긍정적 생각 → 다짐' },
        { id: 2, text: '기쁨 → 실망 → 포기 → 후회' },
        { id: 3, text: '분노 → 슬픔 → 체념 → 무관심' },
        { id: 4, text: '자신감 → 좌절 → 원망 → 복수' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: '민지는 아쉬워하다가 엄마의 위로를 받고, 긍정적으로 생각하게 되었으며, 다시 도전하겠다고 다짐했습니다.',
    },

    // [지문 4] 문항 22-23: 독서의 중요성
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 22,
      category: 'reading',
      questionType: 'choice',
      questionText: '이 글의 글쓰기 방식은?',
      passage: `독서는 우리의 삶을 풍요롭게 만드는 중요한 활동입니다.

첫째, 독서는 지식을 늘려줍니다. 책을 통해 우리는 다양한 분야의
정보를 얻고, 세상을 이해하는 폭을 넓힐 수 있습니다.

둘째, 독서는 상상력과 창의력을 키워줍니다. 특히 소설이나 동화를
읽을 때 우리는 상상의 세계를 경험하며, 새로운 아이디어를 얻게 됩니다.

셋째, 독서는 공감 능력을 향상시킵니다. 책 속 인물들의 감정과
상황을 이해하면서 다른 사람의 입장에서 생각하는 능력이 길러집니다.

넷째, 독서는 언어 능력을 발달시킵니다. 다양한 어휘와 표현을 접하면서
자연스럽게 읽기, 쓰기, 말하기 능력이 향상됩니다.

따라서 우리는 매일 조금씩이라도 책을 읽는 습관을 기르는 것이 중요합니다.`,
      options: [
        { id: 1, text: '시간 순서대로 서술' },
        { id: 2, text: '원인과 결과 제시' },
        { id: 3, text: '주장과 근거 제시' },
        { id: 4, text: '문제와 해결 방법 제시' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'medium',
      explanation: "글은 '독서가 중요하다'는 주장을 제시하고, 네 가지 이유(근거)를 들어 뒷받침하는 논설문입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 23,
      category: 'reading',
      questionType: 'choice',
      questionText: '글쓴이가 제시한 독서의 효과가 아닌 것은?',
      passage: `독서는 우리의 삶을 풍요롭게 만드는 중요한 활동입니다.

첫째, 독서는 지식을 늘려줍니다. 책을 통해 우리는 다양한 분야의
정보를 얻고, 세상을 이해하는 폭을 넓힐 수 있습니다.

둘째, 독서는 상상력과 창의력을 키워줍니다. 특히 소설이나 동화를
읽을 때 우리는 상상의 세계를 경험하며, 새로운 아이디어를 얻게 됩니다.

셋째, 독서는 공감 능력을 향상시킵니다. 책 속 인물들의 감정과
상황을 이해하면서 다른 사람의 입장에서 생각하는 능력이 길러집니다.

넷째, 독서는 언어 능력을 발달시킵니다. 다양한 어휘와 표현을 접하면서
자연스럽게 읽기, 쓰기, 말하기 능력이 향상됩니다.

따라서 우리는 매일 조금씩이라도 책을 읽는 습관을 기르는 것이 중요합니다.`,
      options: [
        { id: 1, text: '지식 증가' },
        { id: 2, text: '상상력과 창의력 향상' },
        { id: 3, text: '공감 능력 향상' },
        { id: 4, text: '수학 실력 향상' },
      ],
      correctAnswer: '4',
      points: 1,
      difficulty: 'hard',
      explanation: '글에서는 지식, 상상력, 창의력, 공감 능력, 언어 능력을 언급했지만 수학 실력은 언급하지 않았습니다.',
    },

    // ===== 문법/어법 (7문항) =====
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 24,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 주어와 서술어를 바르게 짝지은 것은?\n\n'**학생들이** 운동장에서 축구를 **한다**.'",
      options: [
        { id: 1, text: '학생들이 - 운동장에서' },
        { id: 2, text: '운동장에서 - 축구를' },
        { id: 3, text: '학생들이 - 한다' },
        { id: 4, text: '축구를 - 한다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'easy',
      explanation: "주어는 '학생들이', 서술어는 '한다'입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 25,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 피동 표현이 사용된 문장은?',
      options: [
        { id: 1, text: '동생이 문을 열었다.' },
        { id: 2, text: '문이 열렸다.' },
        { id: 3, text: '형이 문을 닫는다.' },
        { id: 4, text: '나는 문을 잠근다.' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "'열렸다'는 피동 표현으로, 동작의 주체가 아닌 동작을 받는 대상이 주어가 됩니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 26,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 관형어는 무엇인가요?\n\n'**예쁜** 꽃이 활짝 피었다.'",
      options: [
        { id: 1, text: '예쁜' },
        { id: 2, text: '꽃이' },
        { id: 3, text: '활짝' },
        { id: 4, text: '피었다' },
      ],
      correctAnswer: '1',
      points: 1,
      difficulty: 'medium',
      explanation: "관형어는 체언(명사)을 꾸며주는 말로, '예쁜'이 '꽃'을 꾸며주고 있습니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 27,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 겹문장(안은 문장)은?',
      options: [
        { id: 1, text: '비가 오고 바람이 분다.' },
        { id: 2, text: '내가 읽은 책은 재미있다.' },
        { id: 3, text: '동생이 웃고 나도 웃었다.' },
        { id: 4, text: '아침에 일어나서 세수를 했다.' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "'내가 읽은'이라는 관형절이 포함된 안은 문장입니다. ①③은 이어진 문장, ④는 단문입니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 28,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 사동 표현이 사용된 문장은?',
      options: [
        { id: 1, text: '아기가 잠을 잔다.' },
        { id: 2, text: '엄마가 아기를 재운다.' },
        { id: 3, text: '아기가 우유를 마신다.' },
        { id: 4, text: '아기가 일어난다.' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "'재운다'는 사동 표현으로, 남을 잠들게 만드는 행위를 나타냅니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 29,
      category: 'grammar',
      questionType: 'choice',
      questionText: "다음 문장에서 부사어는 무엇인가요?\n\n'동생이 **빠르게** 달린다.'",
      options: [
        { id: 1, text: '동생이' },
        { id: 2, text: '빠르게' },
        { id: 3, text: '달린다' },
        { id: 4, text: '동생' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'medium',
      explanation: "부사어는 용언(동사, 형용사)을 꾸며주는 말로, '빠르게'가 '달린다'를 꾸며주고 있습니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 30,
      category: 'grammar',
      questionType: 'choice',
      questionText: '다음 중 높임 표현이 잘못 사용된 문장은?',
      options: [
        { id: 1, text: '할아버지께서 진지를 잡수신다.' },
        { id: 2, text: '선생님께서 교실에 계신다.' },
        { id: 3, text: '친구가 집에 계신다.' },
        { id: 4, text: '부모님께서 외출하셨다.' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: "'계시다'는 높임말이므로 같은 또래인 친구에게는 사용하지 않습니다. '친구가 집에 있다'가 올바릅니다.",
    },

    // ===== 추론/사고력 (5문항) =====
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 31,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 내용으로 추론할 수 있는 것은?\n\n'공원에 낙엽이 쌓여 있고, 사람들이 두꺼운 옷을 입고 있다.'",
      options: [
        { id: 1, text: '지금은 봄이다' },
        { id: 2, text: '지금은 여름이다' },
        { id: 3, text: '지금은 가을이나 겨울이다' },
        { id: 4, text: '지금은 장마철이다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'medium',
      explanation: '낙엽이 쌓이고 두꺼운 옷을 입는 것으로 보아 가을이나 겨울로 추론할 수 있습니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 32,
      category: 'reasoning',
      questionType: 'choice',
      questionText: '다음 규칙을 찾아 빈칸에 들어갈 도형을 고르시오.\n\n○ △ □ ○ △ □ ○ ____',
      options: [
        { id: 1, text: '○' },
        { id: 2, text: '△' },
        { id: 3, text: '□' },
        { id: 4, text: '◇' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: '○ △ □가 반복되는 규칙이므로 다음은 △입니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 33,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 상황에서 가장 바람직한 행동은?\n\n'학교 가는 길에 길 잃은 강아지를 발견했다.'",
      options: [
        { id: 1, text: '무시하고 지나간다' },
        { id: 2, text: '집에 데려가서 기른다' },
        { id: 3, text: '근처 동물보호센터나 경찰서에 신고한다' },
        { id: 4, text: '친구에게 선물로 준다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '길 잃은 동물은 주인이 찾고 있을 수 있으므로, 관련 기관에 신고하는 것이 가장 책임감 있는 행동입니다.',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 34,
      category: 'reasoning',
      questionType: 'choice',
      questionText: '다음 대화를 읽고 민수가 느낀 감정으로 알맞은 것은?\n\n지수: "민수야, 네가 그린 그림 정말 멋지다!"\n민수: "정말? 고마워! 열심히 그렸는데 네가 좋아해 주니 기뻐."',
      options: [
        { id: 1, text: '화남' },
        { id: 2, text: '기쁨' },
        { id: 3, text: '슬픔' },
        { id: 4, text: '두려움' },
      ],
      correctAnswer: '2',
      points: 1,
      difficulty: 'hard',
      explanation: "민수는 자신의 노력을 인정받아 '기뻐'라고 직접 표현하고 있습니다.",
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 35,
      category: 'reasoning',
      questionType: 'choice',
      questionText: "다음 글을 읽고 추론할 수 있는 지영이의 성격은?\n\n'지영이는 친구가 어려움에 처하면 항상 먼저 도와주고,\n모둠 활동에서도 자신의 역할뿐만 아니라 다른 친구들이\n힘들어하는 부분까지 함께 해결해 줍니다.'",
      options: [
        { id: 1, text: '이기적이다' },
        { id: 2, text: '무책임하다' },
        { id: 3, text: '배려심이 깊고 협동적이다' },
        { id: 4, text: '게으르다' },
      ],
      correctAnswer: '3',
      points: 1,
      difficulty: 'hard',
      explanation: '지영이의 행동(친구 돕기, 함께 문제 해결)을 통해 배려심이 깊고 협동적인 성격임을 추론할 수 있습니다.',
    },

    // ===== 독서 성향 설문 (25문항) =====
    // 독서 동기 (5문항)
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 36,
      category: 'reading_motivation',
      questionType: 'likert',
      questionText: '나는 책 읽는 것이 즐겁다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 37,
      category: 'reading_motivation',
      questionType: 'likert',
      questionText: '책을 읽으면 새로운 것을 배울 수 있어서 좋다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 38,
      category: 'reading_motivation',
      questionType: 'likert',
      questionText: '부모님이나 선생님이 책을 읽으라고 해서 읽는다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 39,
      category: 'reading_motivation',
      questionType: 'likert',
      questionText: '책을 읽고 나면 상상력이 풍부해지는 것 같다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 40,
      category: 'reading_motivation',
      questionType: 'likert',
      questionText: '재미있는 이야기가 있으면 끝까지 읽고 싶다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },

    // 독서 환경 (5문항)
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 41,
      category: 'reading_environment',
      questionType: 'likert',
      questionText: '우리 집에는 읽을 만한 책이 충분히 있다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 42,
      category: 'reading_environment',
      questionType: 'likert',
      questionText: '부모님은 나에게 책을 자주 사주신다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 43,
      category: 'reading_environment',
      questionType: 'likert',
      questionText: '학교나 동네 도서관에 자주 간다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 44,
      category: 'reading_environment',
      questionType: 'likert',
      questionText: '집에 책을 읽기 좋은 조용한 공간이 있다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 45,
      category: 'reading_environment',
      questionType: 'likert',
      questionText: '부모님이나 형제자매가 책 읽는 모습을 자주 본다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },

    // 독서 습관 (5문항)
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 46,
      category: 'reading_habit',
      questionType: 'likert',
      questionText: '나는 매일 일정한 시간에 책을 읽는다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 47,
      category: 'reading_habit',
      questionType: 'likert',
      questionText: '일주일에 책을 2권 이상 읽는다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 48,
      category: 'reading_habit',
      questionType: 'likert',
      questionText: '책을 읽을 때 집중해서 끝까지 읽는다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 49,
      category: 'reading_habit',
      questionType: 'likert',
      questionText: '책을 읽고 나서 내용을 다른 사람에게 이야기해 준다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 50,
      category: 'reading_habit',
      questionType: 'likert',
      questionText: '책을 읽으면서 중요한 내용에 밑줄을 긋거나 메모를 한다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },

    // 글쓰기 동기 (5문항)
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 51,
      category: 'writing_motivation',
      questionType: 'likert',
      questionText: '나는 일기나 독후감 쓰는 것을 좋아한다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 52,
      category: 'writing_motivation',
      questionType: 'likert',
      questionText: '글을 쓰면 내 생각을 잘 표현할 수 있다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 53,
      category: 'writing_motivation',
      questionType: 'likert',
      questionText: '책을 읽고 나서 느낀 점을 글로 쓰고 싶다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 54,
      category: 'writing_motivation',
      questionType: 'likert',
      questionText: '친구들과 내가 쓴 글을 나누고 싶다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 55,
      category: 'writing_motivation',
      questionType: 'likert',
      questionText: '글쓰기 숙제를 할 때 재미있게 쓴다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },

    // 독서 선호도 (5문항)
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 56,
      category: 'reading_preference',
      questionType: 'likert',
      questionText: '나는 동화나 소설 같은 이야기책을 좋아한다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 57,
      category: 'reading_preference',
      questionType: 'likert',
      questionText: '과학이나 역사 같은 지식책을 읽는 것이 좋다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 58,
      category: 'reading_preference',
      questionType: 'likert',
      questionText: '만화책이나 그림책을 읽는 것을 좋아한다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 59,
      category: 'reading_preference',
      questionType: 'likert',
      questionText: '시나 수필 같은 문학 작품을 읽는 것을 즐긴다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
    {
      templateCode: 'ELEM5-V1',
      questionNumber: 60,
      category: 'reading_preference',
      questionType: 'likert',
      questionText: '새로운 장르의 책을 읽어보고 싶다',
      options: [
        { id: 1, text: '전혀 그렇지 않다' },
        { id: 2, text: '그렇지 않다' },
        { id: 3, text: '보통이다' },
        { id: 4, text: '그렇다' },
        { id: 5, text: '매우 그렇다' },
      ],
      correctAnswer: '',
      points: 0,
      difficulty: 'easy',
      explanation: '',
    },
  ],
};
