"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grade6Data = void 0;
/**
 * 초등 6학년 문해력 진단 평가 시드 데이터
 * - 총 35문항 (어휘력 10, 독해력 13, 문법 7, 추론 5)
 * - 소요 시간: 40분
 * - 난이도: easy(3) / medium(13) / hard(19)
 */
exports.grade6Data = {
    template: {
        templateCode: 'ELEM6-V1',
        grade: 6,
        title: '초등 6학년 문해력 진단 평가',
        version: '1.0',
        totalQuestions: 35,
        timeLimit: 40,
        isActive: true,
    },
    questions: [
        // ===== 어휘력 (10문항) =====
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 1,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'객관적'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '개인의 감정이나 편견 없이 사실에 근거함' },
                { id: 2, text: '자신의 생각을 강하게 주장함' },
                { id: 3, text: '다른 사람의 의견을 무시함' },
                { id: 4, text: '감정적으로 판단함' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: '객관적이란 개인의 감정, 편견, 이해관계를 떠나 사실에 근거하여 공정하게 판단하는 것을 의미합니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 2,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'온고지신(溫故知新)'의 의미는?",
            options: [
                { id: 1, text: '옛것을 익혀 새것을 안다' },
                { id: 2, text: '따뜻한 마음으로 친구를 사귄다' },
                { id: 3, text: '새로운 것만 배운다' },
                { id: 4, text: '옛것을 모두 버린다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "온고지신(溫故知新)은 '따뜻할 온(溫) + 옛 고(故) + 알 지(知) + 새 신(新)'으로, 옛것을 익히고 그것을 통해 새로운 것을 안다는 의미입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 3,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "다음 밑줄 친 '치다'의 뜻이 다른 하나는?\n\n① 피아노를 **치다**\n② 북을 **치다**\n③ 공을 **치다**\n④ 병이 **치다**",
            correctAnswer: '4',
            points: 1,
            difficulty: 'hard',
            explanation: "①②③은 '손이나 도구로 때리거나 건드리다'의 의미이고, ④는 '병이 낫다'의 의미입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 4,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'사필귀정(事必歸正)'의 의미로 알맞은 것은?",
            options: [
                { id: 1, text: '모든 일은 반드시 바르게 돌아간다' },
                { id: 2, text: '일을 빨리 처리해야 한다' },
                { id: 3, text: '사람은 정직해야 한다' },
                { id: 4, text: '공부를 열심히 해야 한다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "사필귀정(事必歸正)은 '일 사(事) + 반드시 필(必) + 돌아갈 귀(歸) + 바를 정(正)'으로, 모든 일은 반드시 바른길로 돌아간다는 의미입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 5,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'편견'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '공정하고 객관적인 판단' },
                { id: 2, text: '한쪽으로 치우친 생각이나 견해' },
                { id: 3, text: '매우 훌륭한 생각' },
                { id: 4, text: '과학적인 사실' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '편견은 한쪽으로 치우쳐 공정하지 못한 생각이나 견해를 의미합니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 6,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'고진감래(苦盡甘來)'의 의미는?",
            options: [
                { id: 1, text: '쓴 것이 다하면 단 것이 온다, 즉 고생 끝에 즐거움이 온다' },
                { id: 2, text: '고생만 계속된다' },
                { id: 3, text: '단 것을 먼저 먹는다' },
                { id: 4, text: '쓴 약이 몸에 좋다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "고진감래(苦盡甘來)는 '쓸 고(苦) + 다할 진(盡) + 달 감(甘) + 올 래(來)'로, 고생이 끝나면 즐거움이 온다는 의미입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 7,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'추상적'과 반대되는 의미의 단어는?",
            options: [
                { id: 1, text: '구체적' },
                { id: 2, text: '복잡함' },
                { id: 3, text: '어려움' },
                { id: 4, text: '모호함' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: '추상적은 형태가 없고 막연한 것을 의미하며, 구체적은 분명한 형태나 내용을 갖춘 것으로 반대 개념입니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 8,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'백문이불여일견(百聞而不如一見)'의 의미는?",
            options: [
                { id: 1, text: '백 번 듣는 것이 한 번 보는 것만 못하다' },
                { id: 2, text: '많이 들으면 많이 안다' },
                { id: 3, text: '보는 것보다 듣는 것이 낫다' },
                { id: 4, text: '백 번 질문하는 것이 중요하다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "백문이불여일견은 '백 백(百) + 들을 문(聞) + 말 이을 이(而) + 아닐 불(不) + 같을 여(如) + 한 일(一) + 볼 견(見)'으로, 백 번 듣는 것보다 한 번 직접 보는 것이 낫다는 의미입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 9,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'합리적'의 의미로 가장 알맞은 것은?",
            options: [
                { id: 1, text: '논리와 이치에 맞음' },
                { id: 2, text: '매우 비싸다' },
                { id: 3, text: '감정적으로 행동함' },
                { id: 4, text: '무조건 따라함' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: '합리적이란 이치나 논리에 맞고 타당한 것을 의미합니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 10,
            category: 'vocabulary',
            questionType: 'choice',
            questionText: "'유비무환(有備無患)'의 의미는?",
            options: [
                { id: 1, text: '준비가 있으면 걱정이 없다' },
                { id: 2, text: '준비 없이 일을 시작한다' },
                { id: 3, text: '걱정이 많으면 준비를 못한다' },
                { id: 4, text: '아무 준비 없이 살아간다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "유비무환(有備無患)은 '있을 유(有) + 갖출 비(備) + 없을 무(無) + 근심 환(患)'으로, 미리 준비가 되어 있으면 걱정할 일이 없다는 의미입니다.",
        },
        // ===== 독해력 (13문항) =====
        // [지문 1] 문항 11-14: 민주주의
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 11,
            category: 'reading',
            questionType: 'choice',
            questionText: '민주주의의 뜻으로 가장 알맞은 것은?',
            passage: `민주주의는 국민이 나라의 주인이 되어 스스로 다스리는 정치 제도입니다.
'민주(民主)'는 '국민이 주인'이라는 뜻으로, 모든 국민이 평등하게
정치에 참여할 권리를 가진다는 것을 의미합니다.

민주주의의 기본 원리는 국민 주권, 기본권 보장, 권력 분립, 다수결의 원칙 등입니다.
국민 주권은 나라의 주권이 국민에게 있다는 것이고, 기본권 보장은
모든 국민의 인간다운 삶을 위한 권리를 보장하는 것입니다.
권력 분립은 입법, 행정, 사법을 나누어 권력의 남용을 막는 것이며,
다수결의 원칙은 다수의 의견을 따르되 소수의 의견도 존중하는 것입니다.

민주주의가 제대로 작동하려면 국민의 적극적인 참여가 필요합니다.
선거를 통해 대표자를 선출하고, 정치에 관심을 가지며,
자신의 권리와 의무를 이해하고 실천해야 합니다.
또한 다른 사람의 의견을 존중하고 대화와 타협을 통해
문제를 해결하는 자세가 중요합니다.`,
            options: [
                { id: 1, text: '왕이 나라를 다스림' },
                { id: 2, text: '국민이 나라의 주인이 되어 다스림' },
                { id: 3, text: '소수의 귀족이 다스림' },
                { id: 4, text: '군인이 나라를 다스림' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글의 첫 문장에서 민주주의는 국민이 나라의 주인이 되어 스스로 다스리는 정치 제도라고 설명하고 있습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 12,
            category: 'reading',
            questionType: 'choice',
            questionText: '이 글에서 제시한 민주주의의 기본 원리가 아닌 것은?',
            passage: `민주주의는 국민이 나라의 주인이 되어 스스로 다스리는 정치 제도입니다.
'민주(民主)'는 '국민이 주인'이라는 뜻으로, 모든 국민이 평등하게
정치에 참여할 권리를 가진다는 것을 의미합니다.

민주주의의 기본 원리는 국민 주권, 기본권 보장, 권력 분립, 다수결의 원칙 등입니다.
국민 주권은 나라의 주권이 국민에게 있다는 것이고, 기본권 보장은
모든 국민의 인간다운 삶을 위한 권리를 보장하는 것입니다.
권력 분립은 입법, 행정, 사법을 나누어 권력의 남용을 막는 것이며,
다수결의 원칙은 다수의 의견을 따르되 소수의 의견도 존중하는 것입니다.

민주주의가 제대로 작동하려면 국민의 적극적인 참여가 필요합니다.
선거를 통해 대표자를 선출하고, 정치에 관심을 가지며,
자신의 권리와 의무를 이해하고 실천해야 합니다.
또한 다른 사람의 의견을 존중하고 대화와 타협을 통해
문제를 해결하는 자세가 중요합니다.`,
            options: [
                { id: 1, text: '국민 주권' },
                { id: 2, text: '기본권 보장' },
                { id: 3, text: '권력 분립' },
                { id: 4, text: '왕의 절대 권력' },
            ],
            correctAnswer: '4',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서는 국민 주권, 기본권 보장, 권력 분립, 다수결의 원칙을 기본 원리로 제시했으며, 왕의 절대 권력은 민주주의와 반대되는 개념입니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 13,
            category: 'reading',
            questionType: 'choice',
            questionText: '권력 분립의 목적은 무엇인가요?',
            passage: `민주주의는 국민이 나라의 주인이 되어 스스로 다스리는 정치 제도입니다.
'민주(民主)'는 '국민이 주인'이라는 뜻으로, 모든 국민이 평등하게
정치에 참여할 권리를 가진다는 것을 의미합니다.

민주주의의 기본 원리는 국민 주권, 기본권 보장, 권력 분립, 다수결의 원칙 등입니다.
국민 주권은 나라의 주권이 국민에게 있다는 것이고, 기본권 보장은
모든 국민의 인간다운 삶을 위한 권리를 보장하는 것입니다.
권력 분립은 입법, 행정, 사법을 나누어 권력의 남용을 막는 것이며,
다수결의 원칙은 다수의 의견을 따르되 소수의 의견도 존중하는 것입니다.

민주주의가 제대로 작동하려면 국민의 적극적인 참여가 필요합니다.
선거를 통해 대표자를 선출하고, 정치에 관심을 가지며,
자신의 권리와 의무를 이해하고 실천해야 합니다.
또한 다른 사람의 의견을 존중하고 대화와 타협을 통해
문제를 해결하는 자세가 중요합니다.`,
            options: [
                { id: 1, text: '권력을 늘리기 위해' },
                { id: 2, text: '권력의 남용을 막기 위해' },
                { id: 3, text: '왕의 권한을 강화하기 위해' },
                { id: 4, text: '국민의 참여를 막기 위해' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: '글에서 권력 분립은 입법, 행정, 사법을 나누어 권력의 남용을 막는 것이라고 명시하고 있습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 14,
            category: 'reading',
            questionType: 'choice',
            questionText: '민주주의가 제대로 작동하기 위해 필요한 것으로 글에서 언급하지 않은 것은?',
            passage: `민주주의는 국민이 나라의 주인이 되어 스스로 다스리는 정치 제도입니다.
'민주(民主)'는 '국민이 주인'이라는 뜻으로, 모든 국민이 평등하게
정치에 참여할 권리를 가진다는 것을 의미합니다.

민주주의의 기본 원리는 국민 주권, 기본권 보장, 권력 분립, 다수결의 원칙 등입니다.
국민 주권은 나라의 주권이 국민에게 있다는 것이고, 기본권 보장은
모든 국민의 인간다운 삶을 위한 권리를 보장하는 것입니다.
권력 분립은 입법, 행정, 사법을 나누어 권력의 남용을 막는 것이며,
다수결의 원칙은 다수의 의견을 따르되 소수의 의견도 존중하는 것입니다.

민주주의가 제대로 작동하려면 국민의 적극적인 참여가 필요합니다.
선거를 통해 대표자를 선출하고, 정치에 관심을 가지며,
자신의 권리와 의무를 이해하고 실천해야 합니다.
또한 다른 사람의 의견을 존중하고 대화와 타협을 통해
문제를 해결하는 자세가 중요합니다.`,
            options: [
                { id: 1, text: '국민의 적극적인 참여' },
                { id: 2, text: '선거를 통한 대표자 선출' },
                { id: 3, text: '다른 사람 의견 존중' },
                { id: 4, text: '무조건적인 복종' },
            ],
            correctAnswer: '4',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서는 적극적 참여, 선거, 의견 존중, 대화와 타협을 강조했으며, 무조건적 복종은 민주주의 정신에 어긋납니다.',
        },
        // [지문 2] 문항 15-18: 인공지능
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 15,
            category: 'reading',
            questionType: 'choice',
            questionText: '인공지능(AI)이란 무엇인가요?',
            passage: `인공지능(AI)은 인간의 지능을 모방하여 학습하고, 추론하고,
판단할 수 있는 컴퓨터 시스템입니다. 최근 인공지능 기술이 빠르게 발전하면서
우리 생활의 많은 부분에 활용되고 있습니다.

인공지능은 의료, 교육, 교통, 제조업 등 다양한 분야에서 사용됩니다.
의료 분야에서는 질병을 진단하고 치료법을 제안하며,
교육 분야에서는 학생 개개인의 수준에 맞는 맞춤형 학습을 제공합니다.
자율주행 자동차는 인공지능을 이용해 스스로 운전하고,
공장에서는 인공지능 로봇이 제품을 생산합니다.

인공지능의 발전은 많은 이점을 가져오지만, 동시에 여러 문제점도 있습니다.
일자리가 줄어들 수 있고, 개인정보가 유출될 위험이 있으며,
인공지능의 잘못된 판단으로 문제가 발생할 수도 있습니다.
또한 인공지능이 인간의 결정을 대신하는 것이 윤리적으로 옳은지에 대한
논쟁도 있습니다.

따라서 우리는 인공지능의 장점을 활용하되, 문제점을 해결하기 위해
노력해야 합니다. 인공지능을 올바르게 사용하기 위한 규칙을 만들고,
인간이 최종 결정을 내릴 수 있도록 하며,
개인정보를 보호하는 시스템을 강화해야 합니다.`,
            options: [
                { id: 1, text: '사람이 만든 장난감' },
                { id: 2, text: '인간의 지능을 모방한 컴퓨터 시스템' },
                { id: 3, text: '새로운 종류의 동물' },
                { id: 4, text: '외계에서 온 생명체' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '글의 첫 문장에서 인공지능은 인간의 지능을 모방하여 학습하고 추론하며 판단할 수 있는 컴퓨터 시스템이라고 정의하고 있습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 16,
            category: 'reading',
            questionType: 'choice',
            questionText: '글에서 인공지능이 활용되는 분야로 언급하지 않은 것은?',
            passage: `인공지능(AI)은 인간의 지능을 모방하여 학습하고, 추론하고,
판단할 수 있는 컴퓨터 시스템입니다. 최근 인공지능 기술이 빠르게 발전하면서
우리 생활의 많은 부분에 활용되고 있습니다.

인공지능은 의료, 교육, 교통, 제조업 등 다양한 분야에서 사용됩니다.
의료 분야에서는 질병을 진단하고 치료법을 제안하며,
교육 분야에서는 학생 개개인의 수준에 맞는 맞춤형 학습을 제공합니다.
자율주행 자동차는 인공지능을 이용해 스스로 운전하고,
공장에서는 인공지능 로봇이 제품을 생산합니다.

인공지능의 발전은 많은 이점을 가져오지만, 동시에 여러 문제점도 있습니다.
일자리가 줄어들 수 있고, 개인정보가 유출될 위험이 있으며,
인공지능의 잘못된 판단으로 문제가 발생할 수도 있습니다.
또한 인공지능이 인간의 결정을 대신하는 것이 윤리적으로 옳은지에 대한
논쟁도 있습니다.

따라서 우리는 인공지능의 장점을 활용하되, 문제점을 해결하기 위해
노력해야 합니다. 인공지능을 올바르게 사용하기 위한 규칙을 만들고,
인간이 최종 결정을 내릴 수 있도록 하며,
개인정보를 보호하는 시스템을 강화해야 합니다.`,
            options: [
                { id: 1, text: '의료' },
                { id: 2, text: '교육' },
                { id: 3, text: '농업' },
                { id: 4, text: '교통' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'medium',
            explanation: '글에서는 의료, 교육, 교통, 제조업을 언급했지만 농업은 언급하지 않았습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 17,
            category: 'reading',
            questionType: 'choice',
            questionText: '인공지능의 문제점으로 글에서 제시한 것이 아닌 것은?',
            passage: `인공지능(AI)은 인간의 지능을 모방하여 학습하고, 추론하고,
판단할 수 있는 컴퓨터 시스템입니다. 최근 인공지능 기술이 빠르게 발전하면서
우리 생활의 많은 부분에 활용되고 있습니다.

인공지능은 의료, 교육, 교통, 제조업 등 다양한 분야에서 사용됩니다.
의료 분야에서는 질병을 진단하고 치료법을 제안하며,
교육 분야에서는 학생 개개인의 수준에 맞는 맞춤형 학습을 제공합니다.
자율주행 자동차는 인공지능을 이용해 스스로 운전하고,
공장에서는 인공지능 로봇이 제품을 생산합니다.

인공지능의 발전은 많은 이점을 가져오지만, 동시에 여러 문제점도 있습니다.
일자리가 줄어들 수 있고, 개인정보가 유출될 위험이 있으며,
인공지능의 잘못된 판단으로 문제가 발생할 수도 있습니다.
또한 인공지능이 인간의 결정을 대신하는 것이 윤리적으로 옳은지에 대한
논쟁도 있습니다.

따라서 우리는 인공지능의 장점을 활용하되, 문제점을 해결하기 위해
노력해야 합니다. 인공지능을 올바르게 사용하기 위한 규칙을 만들고,
인간이 최종 결정을 내릴 수 있도록 하며,
개인정보를 보호하는 시스템을 강화해야 합니다.`,
            options: [
                { id: 1, text: '일자리 감소' },
                { id: 2, text: '개인정보 유출 위험' },
                { id: 3, text: '잘못된 판단의 가능성' },
                { id: 4, text: '전기 사용량 증가' },
            ],
            correctAnswer: '4',
            points: 1,
            difficulty: 'hard',
            explanation: '글에서는 일자리 감소, 개인정보 유출, 잘못된 판단, 윤리적 문제를 언급했지만 전기 사용량은 언급하지 않았습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 18,
            category: 'reading',
            questionType: 'choice',
            questionText: '글쓴이가 제안하는 인공지능 문제 해결 방법이 아닌 것은?',
            passage: `인공지능(AI)은 인간의 지능을 모방하여 학습하고, 추론하고,
판단할 수 있는 컴퓨터 시스템입니다. 최근 인공지능 기술이 빠르게 발전하면서
우리 생활의 많은 부분에 활용되고 있습니다.

인공지능은 의료, 교육, 교통, 제조업 등 다양한 분야에서 사용됩니다.
의료 분야에서는 질병을 진단하고 치료법을 제안하며,
교육 분야에서는 학생 개개인의 수준에 맞는 맞춤형 학습을 제공합니다.
자율주행 자동차는 인공지능을 이용해 스스로 운전하고,
공장에서는 인공지능 로봇이 제품을 생산합니다.

인공지능의 발전은 많은 이점을 가져오지만, 동시에 여러 문제점도 있습니다.
일자리가 줄어들 수 있고, 개인정보가 유출될 위험이 있으며,
인공지능의 잘못된 판단으로 문제가 발생할 수도 있습니다.
또한 인공지능이 인간의 결정을 대신하는 것이 윤리적으로 옳은지에 대한
논쟁도 있습니다.

따라서 우리는 인공지능의 장점을 활용하되, 문제점을 해결하기 위해
노력해야 합니다. 인공지능을 올바르게 사용하기 위한 규칙을 만들고,
인간이 최종 결정을 내릴 수 있도록 하며,
개인정보를 보호하는 시스템을 강화해야 합니다.`,
            options: [
                { id: 1, text: '올바른 사용 규칙 만들기' },
                { id: 2, text: '인간의 최종 결정권 유지' },
                { id: 3, text: '개인정보 보호 시스템 강화' },
                { id: 4, text: '인공지능 개발 완전 중단' },
            ],
            correctAnswer: '4',
            points: 1,
            difficulty: 'medium',
            explanation: '글쓴이는 인공지능의 장점을 활용하되 문제를 해결하자고 제안했지, 개발을 중단하자고 하지 않았습니다.',
        },
        // [지문 3] 문항 19-22: 수진이의 선택
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 19,
            category: 'reading',
            questionType: 'choice',
            questionText: '수진이가 고민한 이유는?',
            passage: `중학교 입학을 앞둔 수진이는 고민이 많았습니다.
친한 친구들은 모두 A중학교에 가는데, 수진이가 가고 싶은 학교는
외국어 교육이 잘 되어 있는 B중학교였습니다.

"엄마, 저는 B중학교에 가고 싶어요. 외국어를 열심히 배우고 싶거든요."
"하지만 수진아, 친구들과 떨어지면 외롭지 않을까?"
엄마는 걱정스러운 표정으로 물었습니다.

수진이는 며칠 동안 깊이 고민했습니다.
'친구들과 함께 있으면 분명 즐겁겠지. 하지만 내가 정말 하고 싶은 공부를
할 수 있는 학교는 B중학교야. 중학교에 가면 또 새로운 친구들을 사귈 수 있을 거야.'

결국 수진이는 B중학교를 선택했습니다. 처음에는 낯설고 어려웠지만,
수진이는 적극적으로 새 친구들에게 다가갔고, 열심히 외국어를 공부했습니다.
시간이 지나면서 수진이는 좋은 친구들을 많이 사귀었고,
외국어 실력도 크게 향상되었습니다.

1년 후, 수진이는 자신의 선택이 옳았다고 확신했습니다.
"내가 진짜 원하는 것을 선택하길 잘했어. 새로운 도전이 나를 더 성장하게 했어."`,
            options: [
                { id: 1, text: '시험을 못 봐서' },
                { id: 2, text: '친구들과 다른 학교를 가고 싶어서' },
                { id: 3, text: '공부가 너무 어려워서' },
                { id: 4, text: '부모님과 싸워서' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'easy',
            explanation: '수진이는 친구들은 A중학교에 가는데 자신은 B중학교에 가고 싶어서 고민했습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 20,
            category: 'reading',
            questionType: 'choice',
            questionText: '수진이가 B중학교를 선택한 가장 큰 이유는?',
            passage: `중학교 입학을 앞둔 수진이는 고민이 많았습니다.
친한 친구들은 모두 A중학교에 가는데, 수진이가 가고 싶은 학교는
외국어 교육이 잘 되어 있는 B중학교였습니다.

"엄마, 저는 B중학교에 가고 싶어요. 외국어를 열심히 배우고 싶거든요."
"하지만 수진아, 친구들과 떨어지면 외롭지 않을까?"
엄마는 걱정스러운 표정으로 물었습니다.

수진이는 며칠 동안 깊이 고민했습니다.
'친구들과 함께 있으면 분명 즐겁겠지. 하지만 내가 정말 하고 싶은 공부를
할 수 있는 학교는 B중학교야. 중학교에 가면 또 새로운 친구들을 사귈 수 있을 거야.'

결국 수진이는 B중학교를 선택했습니다. 처음에는 낯설고 어려웠지만,
수진이는 적극적으로 새 친구들에게 다가갔고, 열심히 외국어를 공부했습니다.
시간이 지나면서 수진이는 좋은 친구들을 많이 사귀었고,
외국어 실력도 크게 향상되었습니다.

1년 후, 수진이는 자신의 선택이 옳았다고 확신했습니다.
"내가 진짜 원하는 것을 선택하길 잘했어. 새로운 도전이 나를 더 성장하게 했어."`,
            options: [
                { id: 1, text: '집에서 가까워서' },
                { id: 2, text: '외국어 교육이 잘 되어 있어서' },
                { id: 3, text: '친구들이 권유해서' },
                { id: 4, text: '학교 건물이 예뻐서' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '수진이는 외국어를 열심히 배우고 싶어서 외국어 교육이 잘 되어 있는 B중학교를 선택했습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 21,
            category: 'reading',
            questionType: 'choice',
            questionText: '이 이야기가 전하는 교훈으로 가장 알맞은 것은?',
            passage: `중학교 입학을 앞둔 수진이는 고민이 많았습니다.
친한 친구들은 모두 A중학교에 가는데, 수진이가 가고 싶은 학교는
외국어 교육이 잘 되어 있는 B중학교였습니다.

"엄마, 저는 B중학교에 가고 싶어요. 외국어를 열심히 배우고 싶거든요."
"하지만 수진아, 친구들과 떨어지면 외롭지 않을까?"
엄마는 걱정스러운 표정으로 물었습니다.

수진이는 며칠 동안 깊이 고민했습니다.
'친구들과 함께 있으면 분명 즐겁겠지. 하지만 내가 정말 하고 싶은 공부를
할 수 있는 학교는 B중학교야. 중학교에 가면 또 새로운 친구들을 사귈 수 있을 거야.'

결국 수진이는 B중학교를 선택했습니다. 처음에는 낯설고 어려웠지만,
수진이는 적극적으로 새 친구들에게 다가갔고, 열심히 외국어를 공부했습니다.
시간이 지나면서 수진이는 좋은 친구들을 많이 사귀었고,
외국어 실력도 크게 향상되었습니다.

1년 후, 수진이는 자신의 선택이 옳았다고 확신했습니다.
"내가 진짜 원하는 것을 선택하길 잘했어. 새로운 도전이 나를 더 성장하게 했어."`,
            options: [
                { id: 1, text: '항상 친구들과 같이 다녀야 한다' },
                { id: 2, text: '자신이 진짜 원하는 것을 선택하는 것이 중요하다' },
                { id: 3, text: '공부보다 친구가 더 중요하다' },
                { id: 4, text: '외국어 공부는 필수다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: '이야기는 수진이가 자신이 진정으로 원하는 것을 선택하여 성장했다는 점을 강조하며, 주체적인 선택의 중요성을 보여줍니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 22,
            category: 'reading',
            questionType: 'choice',
            questionText: '수진이의 성격을 가장 잘 나타내는 표현은?',
            passage: `중학교 입학을 앞둔 수진이는 고민이 많았습니다.
친한 친구들은 모두 A중학교에 가는데, 수진이가 가고 싶은 학교는
외국어 교육이 잘 되어 있는 B중학교였습니다.

"엄마, 저는 B중학교에 가고 싶어요. 외국어를 열심히 배우고 싶거든요."
"하지만 수진아, 친구들과 떨어지면 외롭지 않을까?"
엄마는 걱정스러운 표정으로 물었습니다.

수진이는 며칠 동안 깊이 고민했습니다.
'친구들과 함께 있으면 분명 즐겁겠지. 하지만 내가 정말 하고 싶은 공부를
할 수 있는 학교는 B중학교야. 중학교에 가면 또 새로운 친구들을 사귈 수 있을 거야.'

결국 수진이는 B중학교를 선택했습니다. 처음에는 낯설고 어려웠지만,
수진이는 적극적으로 새 친구들에게 다가갔고, 열심히 외국어를 공부했습니다.
시간이 지나면서 수진이는 좋은 친구들을 많이 사귀었고,
외국어 실력도 크게 향상되었습니다.

1년 후, 수진이는 자신의 선택이 옳았다고 확신했습니다.
"내가 진짜 원하는 것을 선택하길 잘했어. 새로운 도전이 나를 더 성장하게 했어."`,
            options: [
                { id: 1, text: '소극적이고 의존적이다' },
                { id: 2, text: '주체적이고 적극적이다' },
                { id: 3, text: '우유부단하고 게으르다' },
                { id: 4, text: '이기적이고 무책임하다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '수진이는 자신의 목표를 명확히 하고 스스로 결정을 내렸으며, 새로운 환경에서 적극적으로 친구를 사귀었습니다.',
        },
        // [지문 4] 문항 23: 환경 보호
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 23,
            category: 'reading',
            questionType: 'choice',
            questionText: '이 글의 논리 전개 방식은?',
            passage: `환경 보호는 더 이상 선택이 아니라 필수입니다.

지구 온난화로 인해 극지방의 빙하가 녹고 있으며, 해수면이 상승하고 있습니다.
이상 기후 현상이 빈번해지면서 태풍, 가뭄, 홍수 등의 자연재해가 증가하고 있습니다.
플라스틱 쓰레기로 인해 바다 생물들이 죽어가고 있으며,
대기 오염으로 많은 사람들이 호흡기 질환을 앓고 있습니다.

이러한 문제를 해결하기 위해서는 개인, 기업, 국가 모두의 노력이 필요합니다.
개인은 일회용품 사용을 줄이고, 분리수거를 철저히 하며, 에너지를 절약해야 합니다.
기업은 친환경 제품을 개발하고, 오염물질 배출을 줄여야 합니다.
국가는 환경 관련 법규를 강화하고, 재생 에너지 개발에 투자해야 합니다.

지금 행동하지 않으면 미래 세대에게 건강한 지구를 물려줄 수 없습니다.
환경 보호는 우리 모두의 책임입니다.`,
            options: [
                { id: 1, text: '문제 제시 → 원인 분석 → 해결 방안 제시' },
                { id: 2, text: '시간 순서대로 사건 나열' },
                { id: 3, text: '비교와 대조' },
                { id: 4, text: '예시와 묘사' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: '글은 환경 문제(문제 제시) → 구체적 현상 설명(원인 분석) → 개인/기업/국가의 역할(해결 방안)의 순서로 논리를 전개하고 있습니다.',
        },
        // ===== 문법/어법 (7문항) =====
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 24,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 문장 성분을 바르게 분석한 것은?\n\n'**형이** **동생에게** **책을** **주었다**.'",
            options: [
                { id: 1, text: '주어: 형이 / 목적어: 동생에게 / 서술어: 주었다' },
                { id: 2, text: '주어: 형이 / 부사어: 동생에게 / 목적어: 책을 / 서술어: 주었다' },
                { id: 3, text: '주어: 동생에게 / 목적어: 책을 / 서술어: 주었다' },
                { id: 4, text: '주어: 형이 / 관형어: 동생에게 / 서술어: 주었다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '주어(형이), 부사어(동생에게), 목적어(책을), 서술어(주었다)로 구성된 문장입니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 25,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 능동 표현과 피동 표현이 올바르게 짝지어진 것은?',
            options: [
                { id: 1, text: '열다 - 열리다' },
                { id: 2, text: '먹다 - 먹이다' },
                { id: 3, text: '읽다 - 읽히다' },
                { id: 4, text: '보다 - 보이다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: "①열다-열리다, ③읽다-읽히다, ④보다-보이다는 능동-피동 관계입니다. ②먹다-먹이다는 능동-사동 관계입니다. (정답은 ①)",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 26,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 이어진 문장은?',
            options: [
                { id: 1, text: '비가 오면 소풍을 취소한다.' },
                { id: 2, text: '바람이 불고 눈이 온다.' },
                { id: 3, text: '내가 좋아하는 음식은 피자다.' },
                { id: 4, text: '동생이 학교에 간다.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: "'바람이 불고 눈이 온다'는 두 문장이 대등하게 이어진 이어진 문장입니다. ①은 종속적으로 이어진 문장, ③은 안은 문장, ④는 단문입니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 27,
            category: 'grammar',
            questionType: 'choice',
            questionText: "다음 문장에서 관형어와 관형절을 바르게 찾은 것은?\n\n'**아름다운** **내가 어제 본** **영화는** 감동적이었다.'",
            options: [
                { id: 1, text: '관형어: 아름다운 / 관형절: 내가 어제 본' },
                { id: 2, text: '관형어: 영화는 / 관형절: 감동적이었다' },
                { id: 3, text: '관형어: 어제 / 관형절: 아름다운' },
                { id: 4, text: '관형어: 내가 / 관형절: 본' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'medium',
            explanation: "'아름다운'은 관형어(단어), '내가 어제 본'은 관형절(문장)로, 둘 다 '영화'를 꾸며줍니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 28,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 사동 표현이 사용된 문장은?',
            options: [
                { id: 1, text: '물이 끓는다.' },
                { id: 2, text: '엄마가 물을 끓인다.' },
                { id: 3, text: '물이 뜨겁다.' },
                { id: 4, text: '물을 마신다.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: "'끓인다'는 사동 표현으로, 다른 것(물)을 끓게 만드는 행위를 나타냅니다.",
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 29,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 문장 부호가 바르게 사용된 것은?',
            options: [
                { id: 1, text: '"안녕하세요" 선생님이 말했다.' },
                { id: 2, text: '"안녕하세요." 선생님이 말했다.' },
                { id: 3, text: '"안녕하세요", 선생님이 말했다.' },
                { id: 4, text: '"안녕하세요!" 선생님이 말했다,' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'medium',
            explanation: '인용문 안에서 문장이 끝나면 마침표를 찍고 큰따옴표를 닫습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 30,
            category: 'grammar',
            questionType: 'choice',
            questionText: '다음 중 중의적 표현(두 가지 이상의 의미로 해석될 수 있는 표현)이 있는 문장은?',
            options: [
                { id: 1, text: '나는 학교에 간다.' },
                { id: 2, text: '예쁜 선생님의 딸' },
                { id: 3, text: '하늘이 파랗다.' },
                { id: 4, text: '책을 읽었다.' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: "'예쁜 선생님의 딸'은 '예쁜 선생님'의 딸인지, 선생님의 '예쁜 딸'인지 두 가지로 해석될 수 있습니다.",
        },
        // ===== 추론/사고력 (5문항) =====
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 31,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 상황에서 가장 적절한 행동은?\n\n'단체 채팅방에서 친구가 다른 친구의 비밀을 폭로했다.'",
            options: [
                { id: 1, text: '같이 비웃는다' },
                { id: 2, text: '모른 척한다' },
                { id: 3, text: '그 행동이 잘못되었다고 지적하고, 비밀을 존중해야 한다고 말한다' },
                { id: 4, text: '채팅방을 나간다' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'hard',
            explanation: '친구의 비밀을 폭로하는 것은 잘못된 행동이므로, 용기 있게 지적하고 올바른 행동을 알려주는 것이 가장 적절합니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 32,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 내용을 보고 추론할 수 있는 것은?\n\n'철수는 매일 일찍 일어나 조깅을 하고, 채소와 과일을 많이 먹으며,\n충분한 수면을 취한다. 또한 정기적으로 건강검진을 받는다.'",
            options: [
                { id: 1, text: '철수는 건강 관리에 신경 쓴다' },
                { id: 2, text: '철수는 운동을 싫어한다' },
                { id: 3, text: '철수는 건강이 좋지 않다' },
                { id: 4, text: '철수는 의사다' },
            ],
            correctAnswer: '1',
            points: 1,
            difficulty: 'hard',
            explanation: '철수의 행동들(규칙적 운동, 건강한 식습관, 충분한 수면, 정기 검진)을 종합하면 건강 관리에 신경 쓴다고 추론할 수 있습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 33,
            category: 'reasoning',
            questionType: 'choice',
            questionText: '다음 규칙을 찾아 빈칸에 들어갈 수를 구하시오.\n\n1, 1, 2, 3, 5, 8, 13, ____',
            options: [
                { id: 1, text: '18' },
                { id: 2, text: '21' },
                { id: 3, text: '19' },
                { id: 4, text: '20' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: '피보나치 수열로, 앞의 두 수를 더한 값이 다음 수가 됩니다. 8 + 13 = 21',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 34,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 글을 읽고 필자의 주장으로 가장 알맞은 것은?\n\n'많은 학생들이 시험 직전에 벼락치기를 합니다.\n하지만 연구에 따르면 짧은 시간에 몰아서 공부하는 것보다\n매일 조금씩 꾸준히 공부하는 것이 학습 효과가 훨씬 높다고 합니다.'",
            options: [
                { id: 1, text: '시험을 보지 말아야 한다' },
                { id: 2, text: '벼락치기가 효과적이다' },
                { id: 3, text: '꾸준한 학습이 중요하다' },
                { id: 4, text: '공부는 필요 없다' },
            ],
            correctAnswer: '3',
            points: 1,
            difficulty: 'hard',
            explanation: '필자는 벼락치기보다 매일 조금씩 꾸준히 공부하는 것이 더 효과적이라고 주장하고 있습니다.',
        },
        {
            templateCode: 'ELEM6-V1',
            questionNumber: 35,
            category: 'reasoning',
            questionType: 'choice',
            questionText: "다음 두 진술을 보고 논리적으로 도출할 수 있는 결론은?\n\n'진술 1: 모든 학생은 교복을 입는다.\n진술 2: 지수는 학생이다.'",
            options: [
                { id: 1, text: '지수는 교복을 입지 않는다' },
                { id: 2, text: '지수는 교복을 입는다' },
                { id: 3, text: '지수는 학생이 아니다' },
                { id: 4, text: '교복은 필요 없다' },
            ],
            correctAnswer: '2',
            points: 1,
            difficulty: 'hard',
            explanation: '삼단논법에 따라, 모든 학생이 교복을 입고 지수가 학생이므로, 지수는 교복을 입는다는 결론을 도출할 수 있습니다.',
        },
    ],
};
//# sourceMappingURL=grade6.js.map