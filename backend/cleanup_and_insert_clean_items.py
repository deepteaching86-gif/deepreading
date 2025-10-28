"""
데이터베이스 정리 및 깨끗한 문항 삽입 스크립트
==================================================

나쁜 600개 문항을 삭제하고 깨끗한 52개 수동 문항을 삽입합니다.
문항 출처 구분을 위해 'source' 필드를 추가합니다.
"""

import os
import sys
import json
from datetime import datetime

# 데이터베이스 URL 설정
os.environ['DATABASE_URL'] = 'postgresql://postgres.sxnjeqqvqbhueqbwsnpj:DeepReading2025!@#$SecureDB@db.sxnjeqqvqbhueqbwsnpj.supabase.co:5432/postgres'

sys.path.append('.')
from app.english_test.database import EnglishTestDB

def main():
    print("=" * 60)
    print("데이터베이스 정리 및 깨끗한 문항 삽입")
    print("=" * 60)

    db = EnglishTestDB()
    conn = db._get_connection()
    cursor = conn.cursor()

    try:
        # 1. 현재 상태 확인
        print("\n1️⃣ 현재 데이터베이스 상태 확인...")
        cursor.execute("SELECT COUNT(*) FROM items")
        old_item_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM passages")
        old_passage_count = cursor.fetchone()[0]
        print(f"   기존 문항 수: {old_item_count}")
        print(f"   기존 지문 수: {old_passage_count}")

        # 2. source 컬럼 추가 (이미 존재하면 무시)
        print("\n2️⃣ 문항 출처 구분을 위한 'source' 컬럼 추가...")
        try:
            cursor.execute("""
                ALTER TABLE items
                ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
            """)
            cursor.execute("""
                COMMENT ON COLUMN items.source IS '문항 출처: manual(수동), ai_generated(AI 생성)';
            """)
            conn.commit()
            print("   ✅ source 컬럼 추가 완료")
        except Exception as e:
            print(f"   ℹ️  source 컬럼이 이미 존재하거나 추가 중 오류: {e}")
            conn.rollback()

        # 3. 기존 데이터 삭제
        print("\n3️⃣ 기존 나쁜 데이터 삭제 중...")
        cursor.execute("DELETE FROM responses")
        cursor.execute("DELETE FROM sessions")
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM passages")
        conn.commit()
        print("   ✅ 기존 데이터 삭제 완료")

        # 4. 깨끗한 52개 문항 데이터 로드
        print("\n4️⃣ 깨끗한 문항 데이터 로드 중...")
        with open('generated_52_items.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        passages = data['passages']
        items = data['items']
        print(f"   로드 완료: {len(passages)}개 지문, {len(items)}개 문항")

        # 5. 지문 삽입
        print("\n5️⃣ 지문 삽입 중...")
        for passage in passages:
            cursor.execute("""
                INSERT INTO passages (id, title, content, cefr_level, lexile_score, ar_score, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                passage['id'],
                passage['title'],
                passage['content'],
                passage.get('cefr_level', 'A2'),
                passage.get('lexile_score', 200),
                passage.get('ar_score', 1.5),
                datetime.fromisoformat(passage.get('created_at', '2025-01-15T00:00:00'))
            ))
        conn.commit()
        print(f"   ✅ {len(passages)}개 지문 삽입 완료")

        # 6. 문항 삽입
        print("\n6️⃣ 문항 삽입 중...")
        for item in items:
            cursor.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, stem, options, correct_answer,
                    skill_tags, difficulty, discrimination, guessing,
                    passage_id, status, exposure_count, exposure_rate, created_at, source
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                item['stage'],
                item['panel'],
                item['form_id'],
                item['domain'],
                item['stem'],
                json.dumps(item['options']),
                item['correct_answer'],
                json.dumps(item.get('skill_tags', [])),
                item['difficulty'],
                item['discrimination'],
                item.get('guessing', 0.25),
                item.get('passage_id'),
                item.get('status', 'active'),
                item.get('exposure_count', 0),
                item.get('exposure_rate', 0.0),
                datetime.fromisoformat(item.get('created_at', '2025-01-15T00:00:00')),
                'manual'  # 수동 생성 문항 표시
            ))
        conn.commit()
        print(f"   ✅ {len(items)}개 문항 삽입 완료 (모두 'manual'로 표시)")

        # 7. 최종 상태 확인
        print("\n7️⃣ 최종 데이터베이스 상태 확인...")
        cursor.execute("SELECT COUNT(*) FROM items")
        new_item_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM passages")
        new_passage_count = cursor.fetchone()[0]
        cursor.execute("SELECT domain, COUNT(*) FROM items GROUP BY domain ORDER BY domain")
        domain_counts = cursor.fetchall()

        print(f"   총 문항 수: {new_item_count}")
        print(f"   총 지문 수: {new_passage_count}")
        print("\n   도메인별 문항 수:")
        for domain, count in domain_counts:
            print(f"   - {domain}: {count}개")

        print("\n" + "=" * 60)
        print("✅ 데이터베이스 정리 및 깨끗한 문항 삽입 완료!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
