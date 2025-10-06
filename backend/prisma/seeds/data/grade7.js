"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grade7Data = void 0;
/**
 * 중등 1학년 문해력 진단 평가 시드 데이터
 * - 총 35문항 (어휘력 10, 독해력 13, 문법 7, 추론 5)
 * - 소요 시간: 45분
 * - 난이도: easy(10) / medium(15) / hard(10)
 */
exports.grade7Data = {
    template: {
        templateCode: 'MIDDLE1-V1',
        grade: 7,
        title: '중등 1학년 문해력 진단 평가',
        version: '1.0',
        totalQuestions: 35,
        timeLimit: 45,
        isActive: true,
    },
    questions: [
        // ===== 어휘력 (10문항) =====
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 1,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'객관적'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '자신의 감정과 생각이 들어간' },
                { id: 2, text: '개인의 감정을 배제하고 사실에 근거한' },
                { id: 3, text: '매우 어려운' },
                { id: 4, text: '쉽게 이해할 수 있는' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '객관적이란 개인의 감정이나 생각을 배제하고 사실에 근거하여 판단하는 것을 의미합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 2,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'백문불여일견(百聞不如一見)'의 의미는?",
            options: [
                { id: 1, text: '백 번 듣는 것이 한 번 보는 것만 못하다' },
                { id: 2, text: '백 번 보는 것이 중요하다' },
                { id: 3, text: '듣는 것이 보는 것보다 낫다' },
                { id: 4, text: '눈이 나쁘다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: "백문불여일견(百聞不如一見)은 '백 백(百) + 들을 문(聞) + 아니 불(不) + 같을 여(如) + 한 일(一) + 볼 견(見)'으로, 백 번 듣는 것이 한 번 보는 것만 못하다는 의미입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 3,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'적극적'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '소극적이고 수동적인' },
                { id: 2, text: '자발적이고 활발하게 행동하는' },
                { id: 3, text: '조용하고 말이 없는' },
                { id: 4, text: '게으르고 느린' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '적극적이란 스스로 나서서 활발하게 행동하는 것을 의미합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 4,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'온고지신(溫故知新)'의 의미로 알맞은 것은?",
            options: [
                { id: 1, text: '옛것을 익히고 그것을 통해 새것을 안다' },
                { id: 2, text: '새로운 것만 배운다' },
                { id: 3, text: '옛것은 버린다' },
                { id: 4, text: '따뜻하게 지낸다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: "온고지신(溫故知新)은 '따뜻할 온(溫) + 옛 고(故) + 알 지(知) + 새 신(新)'으로, 옛것을 익히고 그것을 통해 새것을 안다는 의미입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 5,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "다음 중 '주관적'과 반대되는 의미의 단어는?",
            options: [
                { id: 1, text: '개인적' },
                { id: 2, text: '감정적' },
                { id: 3, text: '객관적' },
                { id: 4, text: '주체적' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'easy',
            explanation: '주관적은 개인의 생각과 감정에 따른 것이고, 객관적은 사실에 근거한 것으로 서로 반대되는 개념입니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 6,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'유비무환(有備無患)'의 의미는?",
            options: [
                { id: 1, text: '미리 준비하면 걱정이 없다' },
                { id: 2, text: '준비하지 않아도 된다' },
                { id: 3, text: '항상 걱정해야 한다' },
                { id: 4, text: '준비는 필요 없다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: "유비무환(有備無患)은 '있을 유(有) + 준비할 비(備) + 없을 무(無) + 근심 환(患)'으로, 미리 준비하면 근심이 없다는 의미입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 7,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'구체적'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '막연하고 추상적인' },
                { id: 2, text: '분명하고 자세한' },
                { id: 3, text: '간단한' },
                { id: 4, text: '복잡한' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '구체적이란 내용이 분명하고 자세한 것을 의미합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 8,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'자업자득(自業自得)'의 의미는?",
            options: [
                { id: 1, text: '자기가 한 일의 결과를 자기가 받는다' },
                { id: 2, text: '남이 한 일을 자기가 받는다' },
                { id: 3, text: '일을 열심히 한다' },
                { id: 4, text: '자기 일만 한다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: "자업자득(自業自得)은 '스스로 자(自) + 업 업(業) + 스스로 자(自) + 얻을 득(得)'으로, 자기가 저지른 일의 결과를 자기가 받는다는 의미입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 9,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'협력'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '혼자서 일한다' },
                { id: 2, text: '힘을 합쳐 함께 일한다' },
                { id: 3, text: '경쟁한다' },
                { id: 4, text: '방해한다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '협력이란 서로 힘을 합쳐 함께 일하는 것을 의미합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 10,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'동문서답(東問西答)'의 의미는?",
            options: [
                { id: 1, text: '질문에 정확히 답한다' },
                { id: 2, text: '묻는 말에 엉뚱하게 대답한다' },
                { id: 3, text: '동쪽과 서쪽을 말한다' },
                { id: 4, text: '대답을 잘한다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: "동문서답(東問西答)은 '동쪽 동(東) + 물을 문(問) + 서쪽 서(西) + 대답 답(答)'으로, 동쪽을 물으니 서쪽을 대답한다는 뜻으로, 묻는 말에 엉뚱하게 대답함을 의미합니다.",
        },
        // ===== 독해력 (13문항) =====
        // [지문 1] 문항 11-14: 물의 순환 (과학)
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 11,
            category: 'reading',
            questionType: 'choice',
            questionText: '물의 순환이란 무엇인가?',
            passage: `물은 지구상에서 끊임없이 순환합니다. 이를 물의 순환이라고 합니다. 물의 순환은 우리 생활과 지구 환경에 매우 중요한 역할을 합니다.

물의 순환은 다음과 같은 과정을 거칩니다. 먼저, 바다나 호수, 강의 물이 햇빛을 받아 수증기가 됩니다. 이를 '증발'이라고 합니다. 수증기는 눈에 보이지 않는 기체 상태의 물입니다.

수증기는 공기보다 가벼워서 하늘로 올라갑니다. 높은 하늘은 온도가 낮아서 수증기가 차가워지면 작은 물방울이나 얼음 알갱이로 변합니다. 이것이 모여서 구름이 됩니다. 이 과정을 '응결'이라고 합니다.

구름 속의 물방울이나 얼음 알갱이가 점점 무거워지면 땅으로 떨어집니다. 이것이 비나 눈이 됩니다. 이를 '강수'라고 합니다. 땅에 떨어진 빗물은 일부는 땅속으로 스며들고, 일부는 시냇물이 되어 강으로 흘러가고, 강물은 결국 바다로 흘러갑니다. 그리고 다시 증발하여 같은 과정이 반복됩니다.

이렇게 물은 증발, 응결, 강수의 과정을 반복하며 지구를 순환합니다. 물의 순환 덕분에 우리는 깨끗한 물을 계속 사용할 수 있고, 식물도 자랄 수 있습니다.`,
            options: [
                { id: 1, text: '물이 사라지는 것' },
                { id: 2, text: '물이 증발, 응결, 강수의 과정을 반복하는 것' },
                { id: 3, text: '물이 흐르는 것' },
                { id: 4, text: '물을 정화하는 것' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 물의 순환은 증발, 응결, 강수의 과정을 반복하며 지구를 순환하는 것이라고 설명합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 12,
            category: 'reading',
            questionType: 'choice',
            questionText: '증발이란 무엇인가?',
            passage: `물은 지구상에서 끊임없이 순환합니다. 이를 물의 순환이라고 합니다. 물의 순환은 우리 생활과 지구 환경에 매우 중요한 역할을 합니다.

물의 순환은 다음과 같은 과정을 거칩니다. 먼저, 바다나 호수, 강의 물이 햇빛을 받아 수증기가 됩니다. 이를 '증발'이라고 합니다. 수증기는 눈에 보이지 않는 기체 상태의 물입니다.

수증기는 공기보다 가벼워서 하늘로 올라갑니다. 높은 하늘은 온도가 낮아서 수증기가 차가워지면 작은 물방울이나 얼음 알갱이로 변합니다. 이것이 모여서 구름이 됩니다. 이 과정을 '응결'이라고 합니다.

구름 속의 물방울이나 얼음 알갱이가 점점 무거워지면 땅으로 떨어집니다. 이것이 비나 눈이 됩니다. 이를 '강수'라고 합니다. 땅에 떨어진 빗물은 일부는 땅속으로 스며들고, 일부는 시냇물이 되어 강으로 흘러가고, 강물은 결국 바다로 흘러갑니다. 그리고 다시 증발하여 같은 과정이 반복됩니다.

이렇게 물은 증발, 응결, 강수의 과정을 반복하며 지구를 순환합니다. 물의 순환 덕분에 우리는 깨끗한 물을 계속 사용할 수 있고, 식물도 자랄 수 있습니다.`,
            options: [
                { id: 1, text: '물이 얼음이 되는 것' },
                { id: 2, text: '물이 햇빛을 받아 수증기가 되는 것' },
                { id: 3, text: '물이 땅에 스며드는 것' },
                { id: 4, text: '물이 흐르는 것' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 물이 햇빛을 받아 수증기가 되는 것을 증발이라고 설명합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 13,
            category: 'reading',
            questionType: 'choice',
            questionText: '구름은 어떻게 만들어지는가?',
            passage: `물은 지구상에서 끊임없이 순환합니다. 이를 물의 순환이라고 합니다. 물의 순환은 우리 생활과 지구 환경에 매우 중요한 역할을 합니다.

물의 순환은 다음과 같은 과정을 거칩니다. 먼저, 바다나 호수, 강의 물이 햇빛을 받아 수증기가 됩니다. 이를 '증발'이라고 합니다. 수증기는 눈에 보이지 않는 기체 상태의 물입니다.

수증기는 공기보다 가벼워서 하늘로 올라갑니다. 높은 하늘은 온도가 낮아서 수증기가 차가워지면 작은 물방울이나 얼음 알갱이로 변합니다. 이것이 모여서 구름이 됩니다. 이 과정을 '응결'이라고 합니다.

구름 속의 물방울이나 얼음 알갱이가 점점 무거워지면 땅으로 떨어집니다. 이것이 비나 눈이 됩니다. 이를 '강수'라고 합니다. 땅에 떨어진 빗물은 일부는 땅속으로 스며들고, 일부는 시냇물이 되어 강으로 흘러가고, 강물은 결국 바다로 흘러갑니다. 그리고 다시 증발하여 같은 과정이 반복됩니다.

이렇게 물은 증발, 응결, 강수의 과정을 반복하며 지구를 순환합니다. 물의 순환 덕분에 우리는 깨끗한 물을 계속 사용할 수 있고, 식물도 자랄 수 있습니다.`,
            options: [
                { id: 1, text: '수증기가 차가워져 물방울이나 얼음 알갱이로 변해 모인 것' },
                { id: 2, text: '연기가 모인 것' },
                { id: 3, text: '먼지가 모인 것' },
                { id: 4, text: '새들이 모인 것' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서 수증기가 차가워져 물방울이나 얼음 알갱이로 변하고, 이것이 모여서 구름이 된다고 설명합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 14,
            category: 'reading',
            questionType: 'choice',
            questionText: '물의 순환이 중요한 이유는?',
            passage: `물은 지구상에서 끊임없이 순환합니다. 이를 물의 순환이라고 합니다. 물의 순환은 우리 생활과 지구 환경에 매우 중요한 역할을 합니다.

물의 순환은 다음과 같은 과정을 거칩니다. 먼저, 바다나 호수, 강의 물이 햇빛을 받아 수증기가 됩니다. 이를 '증발'이라고 합니다. 수증기는 눈에 보이지 않는 기체 상태의 물입니다.

수증기는 공기보다 가벼워서 하늘로 올라갑니다. 높은 하늘은 온도가 낮아서 수증기가 차가워지면 작은 물방울이나 얼음 알갱이로 변합니다. 이것이 모여서 구름이 됩니다. 이 과정을 '응결'이라고 합니다.

구름 속의 물방울이나 얼음 알갱이가 점점 무거워지면 땅으로 떨어집니다. 이것이 비나 눈이 됩니다. 이를 '강수'라고 합니다. 땅에 떨어진 빗물은 일부는 땅속으로 스며들고, 일부는 시냇물이 되어 강으로 흘러가고, 강물은 결국 바다로 흘러갑니다. 그리고 다시 증발하여 같은 과정이 반복됩니다.

이렇게 물은 증발, 응결, 강수의 과정을 반복하며 지구를 순환합니다. 물의 순환 덕분에 우리는 깨끗한 물을 계속 사용할 수 있고, 식물도 자랄 수 있습니다.`,
            options: [
                { id: 1, text: '구름을 만들기 위해' },
                { id: 2, text: '깨끗한 물을 계속 사용하고 식물이 자랄 수 있게 하기 위해' },
                { id: 3, text: '비만 내리게 하기 위해' },
                { id: 4, text: '바다를 크게 만들기 위해' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '글의 마지막에서 물의 순환 덕분에 우리는 깨끗한 물을 계속 사용할 수 있고 식물도 자랄 수 있다고 설명합니다.',
        },
        // [지문 2] 문항 15-18: 학교생활 (생활)
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 15,
            category: 'reading',
            questionType: 'choice',
            questionText: '민준이가 동아리를 선택한 이유는?',
            passage: `중학교 1학년 민준이는 새 학기를 맞아 동아리를 선택해야 했습니다. 학교에는 여러 동아리가 있었습니다. 축구부, 농구부, 미술반, 음악반, 과학반 등 선택할 수 있는 동아리가 많았습니다.

민준이는 고민했습니다. 친구들은 대부분 축구부에 가입하려고 했습니다. "민준아, 너도 축구부 들어와. 우리 같이 하자!" 친구들이 말했습니다. 민준이도 축구를 좋아하지만, 다른 것에도 관심이 있었습니다.

민준이는 어렸을 때부터 별과 우주에 관심이 많았습니다. 밤하늘의 별을 보는 것을 좋아하고, 우주에 관한 책을 자주 읽었습니다. 과학반에서는 천체 관측도 하고, 여러 과학 실험도 한다는 이야기를 들었습니다.

결국 민준이는 과학반을 선택했습니다. 친구들은 처음에는 이상하게 생각했지만, 민준이의 선택을 존중해 주었습니다. 과학반에서 민준이는 망원경으로 달과 별을 관찰하고, 재미있는 실험도 많이 했습니다. 비슷한 관심사를 가진 새로운 친구들도 사귀었습니다.

몇 달 후, 민준이는 과학반을 선택한 것이 정말 잘한 일이라고 생각했습니다. 자신이 좋아하는 일을 하니까 너무 즐거웠습니다. 민준이는 다른 사람의 선택보다 자신의 관심사를 따르는 것이 중요하다는 것을 배웠습니다.`,
            options: [
                { id: 1, text: '친구들이 모두 선택해서' },
                { id: 2, text: '별과 우주에 관심이 많아서' },
                { id: 3, text: '선생님이 권유해서' },
                { id: 4, text: '부모님이 원해서' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 민준이는 어렸을 때부터 별과 우주에 관심이 많아서 과학반을 선택했다고 설명합니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 16,
            category: 'reading',
            questionType: 'choice',
            questionText: '민준이의 친구들은 어느 동아리에 가입하려고 했는가?',
            passage: `중학교 1학년 민준이는 새 학기를 맞아 동아리를 선택해야 했습니다. 학교에는 여러 동아리가 있었습니다. 축구부, 농구부, 미술반, 음악반, 과학반 등 선택할 수 있는 동아리가 많았습니다.

민준이는 고민했습니다. 친구들은 대부분 축구부에 가입하려고 했습니다. "민준아, 너도 축구부 들어와. 우리 같이 하자!" 친구들이 말했습니다. 민준이도 축구를 좋아하지만, 다른 것에도 관심이 있었습니다.

민준이는 어렸을 때부터 별과 우주에 관심이 많았습니다. 밤하늘의 별을 보는 것을 좋아하고, 우주에 관한 책을 자주 읽었습니다. 과학반에서는 천체 관측도 하고, 여러 과학 실험도 한다는 이야기를 들었습니다.

결국 민준이는 과학반을 선택했습니다. 친구들은 처음에는 이상하게 생각했지만, 민준이의 선택을 존중해 주었습니다. 과학반에서 민준이는 망원경으로 달과 별을 관찰하고, 재미있는 실험도 많이 했습니다. 비슷한 관심사를 가진 새로운 친구들도 사귀었습니다.

몇 달 후, 민준이는 과학반을 선택한 것이 정말 잘한 일이라고 생각했습니다. 자신이 좋아하는 일을 하니까 너무 즐거웠습니다. 민준이는 다른 사람의 선택보다 자신의 관심사를 따르는 것이 중요하다는 것을 배웠습니다.`,
            options: [
                { id: 1, text: '축구부' },
                { id: 2, text: '농구부' },
                { id: 3, text: '미술반' },
                { id: 4, text: '과학반' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 민준이의 친구들은 대부분 축구부에 가입하려고 했다고 명시되어 있습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 17,
            category: 'reading',
            questionType: 'choice',
            questionText: '민준이가 과학반에서 한 활동으로 언급되지 않은 것은?',
            passage: `중학교 1학년 민준이는 새 학기를 맞아 동아리를 선택해야 했습니다. 학교에는 여러 동아리가 있었습니다. 축구부, 농구부, 미술반, 음악반, 과학반 등 선택할 수 있는 동아리가 많았습니다.

민준이는 고민했습니다. 친구들은 대부분 축구부에 가입하려고 했습니다. "민준아, 너도 축구부 들어와. 우리 같이 하자!" 친구들이 말했습니다. 민준이도 축구를 좋아하지만, 다른 것에도 관심이 있었습니다.

민준이는 어렸을 때부터 별과 우주에 관심이 많았습니다. 밤하늘의 별을 보는 것을 좋아하고, 우주에 관한 책을 자주 읽었습니다. 과학반에서는 천체 관측도 하고, 여러 과학 실험도 한다는 이야기를 들었습니다.

결국 민준이는 과학반을 선택했습니다. 친구들은 처음에는 이상하게 생각했지만, 민준이의 선택을 존중해 주었습니다. 과학반에서 민준이는 망원경으로 달과 별을 관찰하고, 재미있는 실험도 많이 했습니다. 비슷한 관심사를 가진 새로운 친구들도 사귀었습니다.

몇 달 후, 민준이는 과학반을 선택한 것이 정말 잘한 일이라고 생각했습니다. 자신이 좋아하는 일을 하니까 너무 즐거웠습니다. 민준이는 다른 사람의 선택보다 자신의 관심사를 따르는 것이 중요하다는 것을 배웠습니다.`,
            options: [
                { id: 1, text: '망원경으로 달과 별 관찰' },
                { id: 2, text: '과학 실험' },
                { id: 3, text: '새로운 친구 사귀기' },
                { id: 4, text: '축구 경기' },
            ],
            correctAnswer: '4',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서 민준이는 과학반에서 망원경으로 관찰하고, 실험하고, 친구를 사귀었지만 축구 경기는 언급되지 않았습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 18,
            category: 'reading',
            questionType: 'choice',
            questionText: '이 이야기의 교훈은?',
            passage: `중학교 1학년 민준이는 새 학기를 맞아 동아리를 선택해야 했습니다. 학교에는 여러 동아리가 있었습니다. 축구부, 농구부, 미술반, 음악반, 과학반 등 선택할 수 있는 동아리가 많았습니다.

민준이는 고민했습니다. 친구들은 대부분 축구부에 가입하려고 했습니다. "민준아, 너도 축구부 들어와. 우리 같이 하자!" 친구들이 말했습니다. 민준이도 축구를 좋아하지만, 다른 것에도 관심이 있었습니다.

민준이는 어렸을 때부터 별과 우주에 관심이 많았습니다. 밤하늘의 별을 보는 것을 좋아하고, 우주에 관한 책을 자주 읽었습니다. 과학반에서는 천체 관측도 하고, 여러 과학 실험도 한다는 이야기를 들었습니다.

결국 민준이는 과학반을 선택했습니다. 친구들은 처음에는 이상하게 생각했지만, 민준이의 선택을 존중해 주었습니다. 과학반에서 민준이는 망원경으로 달과 별을 관찰하고, 재미있는 실험도 많이 했습니다. 비슷한 관심사를 가진 새로운 친구들도 사귀었습니다.

몇 달 후, 민준이는 과학반을 선택한 것이 정말 잘한 일이라고 생각했습니다. 자신이 좋아하는 일을 하니까 너무 즐거웠습니다. 민준이는 다른 사람의 선택보다 자신의 관심사를 따르는 것이 중요하다는 것을 배웠습니다.`,
            options: [
                { id: 1, text: '친구들의 선택을 무조건 따라야 한다' },
                { id: 2, text: '자신의 관심사를 따르는 것이 중요하다' },
                { id: 3, text: '과학이 가장 중요하다' },
                { id: 4, text: '축구는 하면 안 된다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글의 마지막에서 민준이는 다른 사람의 선택보다 자신의 관심사를 따르는 것이 중요하다는 것을 배웠다고 명시되어 있습니다.',
        },
        // [지문 3] 문항 19-22: 가족의 소중함 (생활/문학)
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 19,
            category: 'reading',
            questionType: 'choice',
            questionText: '서연이가 부모님께 감사하게 된 계기는?',
            passage: `중학생 서연이는 매일 아침 일어나면 엄마가 차려주신 아침밥을 먹고, 아빠가 운전해 주시는 차를 타고 학교에 갔습니다. 학교가 끝나면 집에 와서 간식을 먹고, 방에서 숙제를 했습니다. 저녁에는 가족이 함께 저녁을 먹고, TV를 보거나 책을 읽으면서 시간을 보냈습니다.

서연이는 이런 일상이 당연한 것이라고 생각했습니다. 부모님이 해주시는 것들에 대해 특별히 고마움을 느끼지 못했습니다. 가끔은 "왜 반찬이 매일 똑같아?"라고 투정을 부리기도 했습니다.

어느 날, 학교에서 가정 시간에 선생님이 "여러분은 하루에 부모님께 몇 번 고맙다고 말하나요?"라고 물으셨습니다. 서연이는 깜짝 놀랐습니다. 자신은 부모님께 고맙다고 말한 적이 거의 없었기 때문입니다.

그날 저녁, 서연이는 부모님을 유심히 관찰했습니다. 엄마는 퇴근하고 오시자마자 저녁을 준비하셨고, 아빠는 설거지를 하시면서 서연이의 학교생활에 대해 물어보셨습니다. 서연이는 부모님이 자신을 위해 얼마나 많은 일을 하시는지 새삼 깨달았습니다.

"엄마, 아빠, 오늘 제가 말하고 싶은 게 있어요." 서연이가 말했습니다. "항상 저를 위해 많은 일을 해주셔서 정말 고맙습니다. 그동안 당연하게 생각했는데, 이제 알았어요. 사랑해요." 부모님은 깜짝 놀라시면서도 매우 기뻐하셨습니다.

그날 이후 서연이는 부모님께 감사하는 마음을 자주 표현하려고 노력했습니다. 그러자 가족 간의 대화도 더 많아지고, 집안 분위기도 훨씬 따뜻해졌습니다.`,
            options: [
                { id: 1, text: '학교 선생님의 질문을 듣고' },
                { id: 2, text: '친구의 조언을 듣고' },
                { id: 3, text: '책을 읽고' },
                { id: 4, text: '아파서' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 서연이는 선생님이 "부모님께 몇 번 고맙다고 말하나요?"라고 물으신 후 부모님께 감사하게 되었습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 20,
            category: 'reading',
            questionType: 'choice',
            questionText: '서연이가 처음에 부모님에 대해 어떻게 생각했는가?',
            passage: `중학생 서연이는 매일 아침 일어나면 엄마가 차려주신 아침밥을 먹고, 아빠가 운전해 주시는 차를 타고 학교에 갔습니다. 학교가 끝나면 집에 와서 간식을 먹고, 방에서 숙제를 했습니다. 저녁에는 가족이 함께 저녁을 먹고, TV를 보거나 책을 읽으면서 시간을 보냈습니다.

서연이는 이런 일상이 당연한 것이라고 생각했습니다. 부모님이 해주시는 것들에 대해 특별히 고마움을 느끼지 못했습니다. 가끔은 "왜 반찬이 매일 똑같아?"라고 투정을 부리기도 했습니다.

어느 날, 학교에서 가정 시간에 선생님이 "여러분은 하루에 부모님께 몇 번 고맙다고 말하나요?"라고 물으셨습니다. 서연이는 깜짝 놀랐습니다. 자신은 부모님께 고맙다고 말한 적이 거의 없었기 때문입니다.

그날 저녁, 서연이는 부모님을 유심히 관찰했습니다. 엄마는 퇴근하고 오시자마자 저녁을 준비하셨고, 아빠는 설거지를 하시면서 서연이의 학교생활에 대해 물어보셨습니다. 서연이는 부모님이 자신을 위해 얼마나 많은 일을 하시는지 새삼 깨달았습니다.

"엄마, 아빠, 오늘 제가 말하고 싶은 게 있어요." 서연이가 말했습니다. "항상 저를 위해 많은 일을 해주셔서 정말 고맙습니다. 그동안 당연하게 생각했는데, 이제 알았어요. 사랑해요." 부모님은 깜짝 놀라시면서도 매우 기뻐하셨습니다.

그날 이후 서연이는 부모님께 감사하는 마음을 자주 표현하려고 노력했습니다. 그러자 가족 간의 대화도 더 많아지고, 집안 분위기도 훨씬 따뜻해졌습니다.`,
            options: [
                { id: 1, text: '부모님이 해주시는 것이 당연하다고 생각했다' },
                { id: 2, text: '부모님께 항상 감사했다' },
                { id: 3, text: '부모님을 싫어했다' },
                { id: 4, text: '부모님과 대화를 많이 했다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: '글에서 서연이는 처음에 부모님이 해주시는 것들을 당연하게 생각했다고 명시되어 있습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 21,
            category: 'reading',
            questionType: 'choice',
            questionText: '서연이가 부모님께 한 말은?',
            passage: `중학생 서연이는 매일 아침 일어나면 엄마가 차려주신 아침밥을 먹고, 아빠가 운전해 주시는 차를 타고 학교에 갔습니다. 학교가 끝나면 집에 와서 간식을 먹고, 방에서 숙제를 했습니다. 저녁에는 가족이 함께 저녁을 먹고, TV를 보거나 책을 읽으면서 시간을 보냈습니다.

서연이는 이런 일상이 당연한 것이라고 생각했습니다. 부모님이 해주시는 것들에 대해 특별히 고마움을 느끼지 못했습니다. 가끔은 "왜 반찬이 매일 똑같아?"라고 투정을 부리기도 했습니다.

어느 날, 학교에서 가정 시간에 선생님이 "여러분은 하루에 부모님께 몇 번 고맙다고 말하나요?"라고 물으셨습니다. 서연이는 깜짝 놀랐습니다. 자신은 부모님께 고맙다고 말한 적이 거의 없었기 때문입니다.

그날 저녁, 서연이는 부모님을 유심히 관찰했습니다. 엄마는 퇴근하고 오시자마자 저녁을 준비하셨고, 아빠는 설거지를 하시면서 서연이의 학교생활에 대해 물어보셨습니다. 서연이는 부모님이 자신을 위해 얼마나 많은 일을 하시는지 새삼 깨달았습니다.

"엄마, 아빠, 오늘 제가 말하고 싶은 게 있어요." 서연이가 말했습니다. "항상 저를 위해 많은 일을 해주셔서 정말 고맙습니다. 그동안 당연하게 생각했는데, 이제 알았어요. 사랑해요." 부모님은 깜짝 놀라시면서도 매우 기뻐하셨습니다.

그날 이후 서연이는 부모님께 감사하는 마음을 자주 표현하려고 노력했습니다. 그러자 가족 간의 대화도 더 많아지고, 집안 분위기도 훨씬 따뜻해졌습니다.`,
            options: [
                { id: 1, text: '용돈을 더 달라고 했다' },
                { id: 2, text: '고맙다고 하고 사랑한다고 말했다' },
                { id: 3, text: '아무 말도 하지 않았다' },
                { id: 4, text: '친구들과 놀러 가고 싶다고 했다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서 서연이는 부모님께 "고맙습니다"와 "사랑해요"라고 말했습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 22,
            category: 'reading',
            questionType: 'choice',
            questionText: '서연이가 감사를 표현한 후 어떤 변화가 있었는가?',
            passage: `중학생 서연이는 매일 아침 일어나면 엄마가 차려주신 아침밥을 먹고, 아빠가 운전해 주시는 차를 타고 학교에 갔습니다. 학교가 끝나면 집에 와서 간식을 먹고, 방에서 숙제를 했습니다. 저녁에는 가족이 함께 저녁을 먹고, TV를 보거나 책을 읽으면서 시간을 보냈습니다.

서연이는 이런 일상이 당연한 것이라고 생각했습니다. 부모님이 해주시는 것들에 대해 특별히 고마움을 느끼지 못했습니다. 가끔은 "왜 반찬이 매일 똑같아?"라고 투정을 부리기도 했습니다.

어느 날, 학교에서 가정 시간에 선생님이 "여러분은 하루에 부모님께 몇 번 고맙다고 말하나요?"라고 물으셨습니다. 서연이는 깜짝 놀랐습니다. 자신은 부모님께 고맙다고 말한 적이 거의 없었기 때문입니다.

그날 저녁, 서연이는 부모님을 유심히 관찰했습니다. 엄마는 퇴근하고 오시자마자 저녁을 준비하셨고, 아빠는 설거지를 하시면서 서연이의 학교생활에 대해 물어보셨습니다. 서연이는 부모님이 자신을 위해 얼마나 많은 일을 하시는지 새삼 깨달았습니다.

"엄마, 아빠, 오늘 제가 말하고 싶은 게 있어요." 서연이가 말했습니다. "항상 저를 위해 많은 일을 해주셔서 정말 고맙습니다. 그동안 당연하게 생각했는데, 이제 알았어요. 사랑해요." 부모님은 깜짝 놀라시면서도 매우 기뻐하셨습니다.

그날 이후 서연이는 부모님께 감사하는 마음을 자주 표현하려고 노력했습니다. 그러자 가족 간의 대화도 더 많아지고, 집안 분위기도 훨씬 따뜻해졌습니다.`,
            options: [
                { id: 1, text: '아무 변화도 없었다' },
                { id: 2, text: '가족 간의 대화가 많아지고 집안 분위기가 따뜻해졌다' },
                { id: 3, text: '부모님과 자주 싸웠다' },
                { id: 4, text: '서연이가 집을 나갔다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '글의 마지막에서 서연이가 감사를 표현한 후 가족 간의 대화가 더 많아지고 집안 분위기가 따뜻해졌다고 설명합니다.',
        },
        // [지문 4] 문항 23: 운동의 중요성
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 23,
            category: 'reading',
            questionType: 'choice',
            questionText: '이 글의 주제로 가장 알맞은 것은?',
            passage: `운동은 우리 몸과 마음 모두에 좋습니다. 많은 사람들이 운동의 중요성을 알고 있지만, 실제로 규칙적으로 운동하는 사람은 많지 않습니다.

운동을 하면 우리 몸에 좋은 변화가 일어납니다. 첫째, 근육과 뼈가 튼튼해집니다. 성장기 청소년들은 운동을 통해 키도 더 잘 자랄 수 있습니다. 둘째, 심장과 폐가 강해집니다. 운동을 하면 심장이 더 효율적으로 피를 온몸에 보낼 수 있고, 폐는 더 많은 산소를 받아들일 수 있습니다.

또한 운동은 마음의 건강에도 도움이 됩니다. 운동을 하면 스트레스가 줄어들고 기분이 좋아집니다. 공부나 일로 쌓인 피로를 운동으로 풀 수 있습니다. 밤에 잠도 더 잘 오게 됩니다.

운동을 시작하는 것은 어렵지 않습니다. 거창한 운동 기구나 헬스장이 필요한 것도 아닙니다. 가볍게 걷기, 줄넘기, 계단 오르기 같은 간단한 운동부터 시작할 수 있습니다. 중요한 것은 매일 조금씩이라도 꾸준히 하는 것입니다. 하루 30분씩만 운동해도 건강에 큰 도움이 됩니다.`,
            options: [
                { id: 1, text: '운동의 중요성과 효과' },
                { id: 2, text: '헬스장에 가는 방법' },
                { id: 3, text: '운동선수가 되는 방법' },
                { id: 4, text: '운동의 역사' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: '글은 운동이 몸과 마음에 미치는 좋은 효과를 설명하며 운동의 중요성을 강조하고 있습니다.',
        },
        // ===== 문법/어법 (7문항) =====
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 24,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 서술어를 찾으시오.\n\n'학생들이 교실에서 공부한다.'",
            options: [
                { id: 1, text: '학생들이' },
                { id: 2, text: '교실에서' },
                { id: 3, text: '공부한다' },
                { id: 4, text: '학생들이 교실에서' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'easy',
            explanation: "'공부한다'가 서술어입니다. 서술어는 주어의 동작이나 상태를 나타냅니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 25,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 존댓말이 올바르게 사용된 문장은?',
            options: [
                { id: 1, text: '할머니가 밥을 먹는다.' },
                { id: 2, text: '할머니께서 진지를 드신다.' },
                { id: 3, text: '할머니가 음식을 드신다.' },
                { id: 4, text: '할머니께서 밥을 먹는다.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '②는 주체(할머니)를 높이는 말 "께서"와 "드신다", 객체를 높이는 말 "진지"를 모두 올바르게 사용했습니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 26,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 '을/를'이 들어갈 자리를 찾으시오.\n\n'나는 친구( ) 만났다.'",
            options: [
                { id: 1, text: '에게' },
                { id: 2, text: '를' },
                { id: 3, text: '이' },
                { id: 4, text: '와' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: "'친구를 만났다'가 올바른 표현입니다. 목적어에는 '을/를'이 붙습니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 27,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 밑줄 친 말의 품사는?\n\n'**예쁜** 꽃이 피었다.'",
            options: [
                { id: 1, text: '명사' },
                { id: 2, text: '동사' },
                { id: 3, text: '형용사' },
                { id: 4, text: '부사' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'medium',
            explanation: "'예쁜'은 명사 '꽃'을 꾸며주는 형용사입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 28,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 문장의 주어가 다른 것은?',
            options: [
                { id: 1, text: '나는 학교에 간다.' },
                { id: 2, text: '비가 온다.' },
                { id: 3, text: '나는 밥을 먹는다.' },
                { id: 4, text: '나는 책을 읽는다.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: "②의 주어는 '비가'이고, 나머지는 모두 '나는'이 주어입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 29,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 밑줄 친 말의 품사는?\n\n'나는 **매우** 기쁘다.'",
            options: [
                { id: 1, text: '명사' },
                { id: 2, text: '형용사' },
                { id: 3, text: '부사' },
                { id: 4, text: '동사' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'medium',
            explanation: "'매우'는 형용사 '기쁘다'를 꾸며주는 부사입니다.",
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 30,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 문장이 완전한 것은?',
            options: [
                { id: 1, text: '학교에.' },
                { id: 2, text: '나는 학교에 간다.' },
                { id: 3, text: '학교에 간다.' },
                { id: 4, text: '나는 학교에.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '②는 주어와 서술어가 모두 있는 완전한 문장입니다.',
        },
        // ===== 추론/사고력 (5문항) =====
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 31,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 상황에서 가장 적절한 행동은?\n\n'친구가 숙제를 보여달라고 한다.'",
            options: [
                { id: 1, text: '숙제를 그대로 보여준다' },
                { id: 2, text: '보여주지 않고, 어려운 부분을 함께 풀어준다' },
                { id: 3, text: '화를 낸다' },
                { id: 4, text: '선생님께 일러바친다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '친구에게 숙제를 그대로 베끼게 하는 것보다, 어려운 부분을 함께 풀어주는 것이 진정한 도움입니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 32,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 내용으로부터 추론할 수 있는 것은?\n\n'하늘이 어두워지고 바람이 불기 시작했다.'",
            options: [
                { id: 1, text: '곧 비가 올 것 같다' },
                { id: 2, text: '날씨가 맑아질 것이다' },
                { id: 3, text: '눈이 올 것이다' },
                { id: 4, text: '무지개가 뜰 것이다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'easy',
            explanation: '하늘이 어두워지고 바람이 부는 것은 비가 올 가능성이 높다는 신호입니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 33,
            category: 'reasoning',
            questionType: 'choice',
            questionText: '다음 규칙을 찾아 빈칸에 들어갈 수를 구하시오.\n\n2, 4, 6, 8, 10, ____',
            options: [
                { id: 1, text: '11' },
                { id: 2, text: '12' },
                { id: 3, text: '13' },
                { id: 4, text: '14' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '2씩 증가하는 수열입니다. 10 + 2 = 12',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 34,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 상황에서 올바른 판단은?\n\n'길에서 할머니가 무거운 짐을 들고 계신다.'",
            options: [
                { id: 1, text: '모른 척 지나간다' },
                { id: 2, text: '도와드릴까요?라고 여쭤본다' },
                { id: 3, text: '웃고 지나간다' },
                { id: 4, text: '사진을 찍는다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '어려움을 겪고 계신 어르신을 보면 도움이 필요한지 정중히 여쭤보는 것이 올바른 행동입니다.',
        },
        {
            templateCode: 'MIDDLE1-V1',
            questionNumber: 35,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 두 문장을 보고 논리적으로 맞는 결론은?\n\n'진술 1: 모든 개는 동물이다.\n진술 2: 뽀삐는 개이다.'",
            options: [
                { id: 1, text: '뽀삐는 고양이다' },
                { id: 2, text: '뽀삐는 동물이다' },
                { id: 3, text: '뽀삐는 동물이 아니다' },
                { id: 4, text: '모든 동물은 개이다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '모든 개가 동물이고, 뽀삐가 개이므로, 뽀삐는 동물입니다.',
        },
    ],
};
//# sourceMappingURL=grade7.js.map