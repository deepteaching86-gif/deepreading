import random
import math
import json
from datetime import datetime

# 학년별 기본 난이도 (1-9학년)
GRADE_DIFFICULTY_BASELINE = {
    1: 85,  # 초1 - 쉬움
    2: 82,
    3: 78,
    4: 75,
    5: 72,
    6: 70,  # 초6
    7: 68,  # 중1
    8: 66,
    9: 64,  # 중3 - 어려움
}

# 영역별 난이도 조정 계수
CATEGORY_DIFFICULTY_MODIFIER = {
    'vocabulary': 0,              # 기준
    'reading': -3,                # 조금 더 어려움
    'grammar': -5,                # 더 어려움
    'reasoning': -7,              # 가장 어려움
    'reading_motivation': 10,     # 설문은 높게
    'writing_motivation': 10,
    'reading_environment': 10,
    'reading_habit': 10,
    'reading_preference': 10,
}

def normal_random(mean, std_dev):
    """정규분포 랜덤 생성 (Box-Muller transform)"""
    u1 = random.random()
    u2 = random.random()
    z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
    return z0 * std_dev + mean

def generate_simulated_scores(mean, std_dev, sample_size):
    """시뮬레이션된 학생 점수 생성"""
    scores = []
    for _ in range(sample_size):
        score = normal_random(mean, std_dev)
        # 0-100 범위로 제한
        scores.append(max(0, min(100, score)))
    return scores

def calculate_percentiles(scores):
    """백분위 계산"""
    sorted_scores = sorted(scores)

    def get_percentile(p):
        idx = int((p / 100) * len(sorted_scores))
        return sorted_scores[min(idx, len(sorted_scores) - 1)]

    return {
        'p10': round(get_percentile(10)),
        'p25': round(get_percentile(25)),
        'p50': round(get_percentile(50)),
        'p75': round(get_percentile(75)),
        'p90': round(get_percentile(90)),
    }

def calculate_std_dev(scores, mean):
    """표준편차 계산"""
    variance = sum((x - mean) ** 2 for x in scores) / len(scores)
    return math.sqrt(variance)

def generate_peer_statistics():
    """또래 평균 통계 생성"""
    categories = [
        'vocabulary',
        'reading',
        'grammar',
        'reasoning',
        'reading_motivation',
        'writing_motivation',
        'reading_environment',
        'reading_habit',
        'reading_preference',
    ]

    std_deviation = 12  # 표준편차
    sample_size = 100   # 시뮬레이션 학생 수

    sql_statements = []

    print("-- Generated Peer Statistics Seed Data")
    print(f"-- Generated at: {datetime.now()}")
    print("-- Total records: " + str(len(categories) * 9))
    print("")

    for grade in range(1, 10):  # 1-9학년
        baseline = GRADE_DIFFICULTY_BASELINE[grade]

        for category in categories:
            modifier = CATEGORY_DIFFICULTY_MODIFIER[category]
            mean = baseline + modifier

            # 시뮬레이션 점수 생성
            scores = generate_simulated_scores(mean, std_deviation, sample_size)

            # 통계 계산
            avg_score = sum(scores) / len(scores)
            std_dev = calculate_std_dev(scores, avg_score)
            percentiles = calculate_percentiles(scores)

            # SQL INSERT 문 생성
            percentile_json = json.dumps(percentiles).replace("'", "''")

            sql = f"""INSERT INTO peer_statistics (
    id,
    grade,
    category,
    avg_score,
    avg_percentage,
    std_deviation,
    sample_size,
    simulated_sample_size,
    percentile_distribution,
    last_updated,
    created_at
) VALUES (
    gen_random_uuid(),
    {grade},
    '{category}',
    {avg_score:.2f},
    {avg_score:.2f},
    {std_dev:.2f},
    {sample_size},
    {sample_size},
    '{percentile_json}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);"""

            sql_statements.append(sql)

            print(f"-- Grade {grade}, Category: {category}, Mean: {avg_score:.2f}, StdDev: {std_dev:.2f}")

    print("\n-- SQL INSERT Statements\n")
    for sql in sql_statements:
        print(sql)
        print("")

if __name__ == '__main__':
    generate_peer_statistics()
