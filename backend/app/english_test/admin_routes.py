"""
English Test Admin Routes
=========================

관리자 전용 라우트: 데이터베이스 관리 및 문항 생성
Version: 2.1.0 - Fixed skill_tag column name for VST implementation
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from pydantic import BaseModel
import json
import os
from datetime import datetime

router = APIRouter()


# Request models for AI generation
class GenerateItemsRequest(BaseModel):
    stage: int  # 1, 2, or 3
    panel: str  # routing, low, medium, high
    count: int = 5  # Number of items to generate
    domains: Optional[List[str]] = None  # grammar, vocabulary, reading
    auto_insert: bool = False  # Auto-insert to database


@router.post("/cleanup-and-insert-clean-items")
async def cleanup_and_insert_clean_items() -> Dict:
    """
    데이터베이스 정리 및 40개 문항 삽입 (VST 포함)

    WARNING: 이 엔드포인트는 모든 기존 데이터를 삭제합니다!

    40개 문항 구성:
    - Grammar: 13개
    - Vocabulary: 17개 (VST with frequency bands + pseudowords)
    - Reading: 10개 + 4 passages
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

        # 2. VST 필드 및 source 컬럼 추가 (Migration)
        try:
            migration_sql_path = os.path.join(os.path.dirname(__file__), '..', '..', 'prisma', 'migrations', 'add_vst_fields_to_items.sql')
            with open(migration_sql_path, 'r', encoding='utf-8') as f:
                migration_sql = f.read()

            cursor.execute(migration_sql)
            conn.commit()
            results["steps"].append({"step": "2_vst_migration", "status": "success"})
        except Exception as e:
            conn.rollback()
            results["steps"].append({"step": "2_vst_migration", "status": f"already_exists or error: {str(e)}"})

        # 3. 기존 데이터 삭제
        cursor.execute("DELETE FROM english_test_responses")
        cursor.execute("DELETE FROM english_test_sessions")
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM passages")
        conn.commit()
        results["steps"].append({"step": "3_delete_old_data", "status": "success"})

        # 4. 40개 문항 데이터 로드 (VST 포함)
        json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'complete_40_items.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        passages = data.get('passages', [])
        items = data['items']
        results["steps"].append({
            "step": "4_load_data",
            "passages_count": len(passages),
            "items_count": len(items),
            "grammar_count": sum(1 for i in items if i['domain'] == 'grammar'),
            "vocabulary_count": sum(1 for i in items if i['domain'] == 'vocabulary'),
            "reading_count": sum(1 for i in items if i['domain'] == 'reading')
        })

        # 5. 지문 삽입
        for passage in passages:
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
                passage.get('text_type', 'expository'),
                datetime.now()
            ))
            passage['inserted_id'] = cursor.fetchone()[0]

        conn.commit()
        results["steps"].append({"step": "5_insert_passages", "count": len(passages)})

        # 6. 문항 삽입 (VST 필드 포함)
        passage_id_map = {p['id']: p.get('inserted_id') for p in passages if 'inserted_id' in p}

        for item in items:
            mapped_passage_id = None
            if item.get('passage_id') and passage_id_map:
                mapped_passage_id = passage_id_map.get(item['passage_id'])

            cursor.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, stem, options, correct_answer,
                    skill_tag, difficulty, discrimination, guessing,
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
                item.get('source', 'manual'),
                datetime.now()
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


@router.post("/generate-items")
async def generate_items_with_ai(request: GenerateItemsRequest) -> Dict:
    """
    Generate test items using Gemini AI.

    Args:
        stage: MST stage (1, 2, 3)
        panel: Panel name (routing, low, medium, high)
        count: Number of items to generate (default: 5)
        domains: List of domains or None for balanced distribution
        auto_insert: If True, automatically insert into database

    Returns:
        Generated items and insertion status
    """
    try:
        from app.english_test.ai_item_generator import get_generator
        from app.english_test.database import EnglishTestDB

        # Validate input
        if request.stage not in [1, 2, 3]:
            raise HTTPException(status_code=400, detail="Stage must be 1, 2, or 3")

        valid_panels = {
            1: ['routing'],
            2: ['low', 'medium', 'high'],
            3: ['low', 'medium', 'high']
        }
        if request.panel not in valid_panels[request.stage]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid panel '{request.panel}' for stage {request.stage}"
            )

        if request.count < 1 or request.count > 20:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 20")

        # Generate items
        generator = get_generator()
        items = generator.generate_items(
            stage=request.stage,
            panel=request.panel,
            count=request.count,
            domains=request.domains
        )

        result = {
            "status": "success",
            "generated_count": len(items),
            "items": items
        }

        # Auto-insert if requested
        if request.auto_insert:
            db = EnglishTestDB()
            conn = db._get_connection()
            cursor = conn.cursor()

            inserted_count = 0
            try:
                for item in items:
                    cursor.execute("""
                        INSERT INTO items (
                            stage, panel, form_id, domain, stem, options, correct_answer,
                            skill_tag, difficulty, discrimination, guessing,
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
                        None,  # passage_id
                        item.get('status', 'active'),
                        item.get('exposure_count', 0),
                        item.get('exposure_rate', 0.0),
                        item.get('frequency_band'),
                        item.get('target_word'),
                        item.get('is_pseudoword', False),
                        item.get('band_size'),
                        item.get('source', 'ai_generated'),
                        datetime.now()
                    ))
                    inserted_count += 1

                conn.commit()
                result["auto_inserted"] = True
                result["inserted_count"] = inserted_count

            except Exception as e:
                conn.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to insert items: {str(e)}"
                )
            finally:
                cursor.close()
                conn.close()

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Item generation failed: {str(e)}")
