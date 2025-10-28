"""
English Test Admin Routes
=========================

관리자 전용 라우트: 데이터베이스 관리 및 문항 생성
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import json
import os
from datetime import datetime

router = APIRouter()


@router.post("/cleanup-and-insert-clean-items")
async def cleanup_and_insert_clean_items() -> Dict:
    """
    데이터베이스 정리 및 깨끗한 52개 문항 삽입

    WARNING: 이 엔드포인트는 모든 기존 데이터를 삭제합니다!
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        conn = db._get_connection()
        cursor = conn.cursor()

        results = {
            "status": "success",
            "steps": []
        }

        # 1. 현재 상태 확인
        cursor.execute("SELECT COUNT(*) FROM items")
        old_item_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM passages")
        old_passage_count = cursor.fetchone()[0]

        results["steps"].append({
            "step": "1_check_current",
            "old_items": old_item_count,
            "old_passages": old_passage_count
        })

        # 2. source 컬럼 추가
        try:
            cursor.execute("""
                ALTER TABLE items
                ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
            """)
            cursor.execute("""
                COMMENT ON COLUMN items.source IS '문항 출처: manual(수동), ai_generated(AI 생성)';
            """)
            conn.commit()
            results["steps"].append({"step": "2_add_source_column", "status": "success"})
        except Exception as e:
            conn.rollback()
            results["steps"].append({"step": "2_add_source_column", "status": "already_exists"})

        # 3. 기존 데이터 삭제
        cursor.execute("DELETE FROM responses")
        cursor.execute("DELETE FROM sessions")
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM passages")
        conn.commit()
        results["steps"].append({"step": "3_delete_old_data", "status": "success"})

        # 4. 깨끗한 52개 문항 데이터 로드
        json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'generated_52_items.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        passages = data['passages']
        items = data['items']
        results["steps"].append({
            "step": "4_load_data",
            "passages_count": len(passages),
            "items_count": len(items)
        })

        # 5. 지문 삽입
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
        results["steps"].append({"step": "5_insert_passages", "count": len(passages)})

        # 6. 문항 삽입
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
                'manual'
            ))
        conn.commit()
        results["steps"].append({"step": "6_insert_items", "count": len(items)})

        # 7. 최종 상태 확인
        cursor.execute("SELECT COUNT(*) FROM items")
        new_item_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM passages")
        new_passage_count = cursor.fetchone()[0]
        cursor.execute("SELECT domain, COUNT(*) FROM items GROUP BY domain ORDER BY domain")
        domain_counts = dict(cursor.fetchall())

        results["steps"].append({
            "step": "7_final_check",
            "total_items": new_item_count,
            "total_passages": new_passage_count,
            "by_domain": domain_counts
        })

        cursor.close()
        conn.close()

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database cleanup failed: {str(e)}")
