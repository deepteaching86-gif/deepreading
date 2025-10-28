"""
데이터베이스 정리 및 40개 문항 삽입 스크립트 (VST 포함)
==================================================

기존 문항을 삭제하고 VST 포함 40개 문항을 삽입합니다.
- Grammar: 13개
- Vocabulary: 17개 (VST with frequency bands + pseudowords)
- Reading: 10개 + 4 passages
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

        # 2. VST 필드 추가 (Migration 실행)
        print("\n2️⃣ VST 필드 및 source 컬럼 추가 (Migration)...")
        try:
            # Read and execute migration SQL
            with open('prisma/migrations/add_vst_fields_to_items.sql', 'r', encoding='utf-8') as f:
                migration_sql = f.read()

            # Execute migration
            cursor.execute(migration_sql)
            conn.commit()
            print("   ✅ VST 필드 추가 완료 (frequency_band, target_word, is_pseudoword, band_size, source)")
        except Exception as e:
            print(f"   ℹ️  VST 필드가 이미 존재하거나 추가 중 오류: {e}")
            conn.rollback()

        # 3. 기존 데이터 삭제
        print("\n3️⃣ 기존 나쁜 데이터 삭제 중...")
        cursor.execute("DELETE FROM responses")
        cursor.execute("DELETE FROM sessions")
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM passages")
        conn.commit()
        print("   ✅ 기존 데이터 삭제 완료")

        # 4. 깨끗한 40개 문항 데이터 로드 (VST 포함)
        print("\n4️⃣ 깨끗한 40개 문항 데이터 로드 중 (VST 포함)...")
        with open('complete_40_items.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        passages = data.get('passages', [])
        items = data['items']
        print(f"   로드 완료: {len(passages)}개 지문, {len(items)}개 문항")
        print(f"   - Grammar: {sum(1 for i in items if i['domain'] == 'grammar')}개")
        print(f"   - Vocabulary: {sum(1 for i in items if i['domain'] == 'vocabulary')}개")
        print(f"   - Reading: {sum(1 for i in items if i['domain'] == 'reading')}개")

        # 5. 지문 삽입
        print("\n5️⃣ 지문 삽입 중...")
        for passage in passages:
            # Calculate word_count if not provided
            word_count = passage.get('word_count', len(passage['content'].split()))

            cursor.execute("""
                INSERT INTO passages (title, content, word_count, lexile_score, ar_level, genre, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                passage['title'],
                passage['content'],
                word_count,
                passage.get('lexile_score', 200),
                passage.get('ar_score', 1.5),
                passage.get('text_type', 'expository'),  # text_type → genre
                datetime.now()
            ))
            # Store passage id for items reference
            passage['inserted_id'] = cursor.fetchone()[0]

        conn.commit()
        print(f"   ✅ {len(passages)}개 지문 삽입 완료")

        # 6. 문항 삽입 (VST 필드 포함)
        print("\n6️⃣ 문항 삽입 중 (VST 필드 포함)...")

        # Create passage_id mapping (original_id → inserted_id)
        passage_id_map = {p['id']: p.get('inserted_id') for p in passages if 'inserted_id' in p}

        for item in items:
            # Map passage_id if reading item
            mapped_passage_id = None
            if item.get('passage_id') and passage_id_map:
                mapped_passage_id = passage_id_map.get(item['passage_id'])

            cursor.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, stem, options, correct_answer,
                    skill_tags, difficulty, discrimination, guessing,
                    passage_id, status, exposure_count, exposure_rate,
                    frequency_band, target_word, is_pseudoword, band_size,
                    source, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                mapped_passage_id,
                item.get('status', 'active'),
                item.get('exposure_count', 0),
                item.get('exposure_rate', 0.0),
                # VST fields (vocabulary domain only)
                item.get('frequency_band'),
                item.get('target_word'),
                item.get('is_pseudoword', False),
                item.get('band_size'),
                item.get('source', 'manual'),  # 수동 생성 문항 표시
                datetime.now()
            ))
        conn.commit()
        print(f"   ✅ {len(items)}개 문항 삽입 완료 (VST 필드 포함)")

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
