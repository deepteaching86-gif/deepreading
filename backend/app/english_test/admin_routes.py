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
                            source, calibration_status, created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        item['stage'],
                        item['panel'],
                        item['form_id'],
                        item['domain'],
                        item['stem'],
                        json.dumps(item['options']),
                        item['correct_answer'],
                        json.dumps(item.get('skill_tags', [])),
                        item.get('difficulty', 0.0),
                        item.get('discrimination', 1.0),
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
                        item.get('calibration_status', 'uncalibrated'),
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


# ============================================
# Calibration Admin Endpoints (Phase 2-A)
# ============================================

@router.get("/calibration/summary")
async def get_calibration_summary() -> Dict:
    """
    Get item bank calibration status summary.

    Returns counts of items by calibration_status (uncalibrated, provisional,
    calibrated, flagged) and total response data availability.
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        summary = db.get_calibration_summary()

        # Also get total response count for calibration readiness
        conn = db._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM english_test_responses")
        total_responses = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT session_id) FROM english_test_responses")
        total_sessions = cursor.fetchone()[0]
        cursor.close()
        conn.close()

        summary['total_responses'] = total_responses
        summary['total_sessions'] = total_sessions
        summary['calibration_ready'] = total_sessions >= 30

        return summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calibration summary: {str(e)}")


@router.post("/calibration/run")
async def run_calibration(min_responses: int = 30) -> Dict:
    """
    Run IRT calibration pipeline on accumulated response data.

    Performs 2PL MML-EM calibration, computes fit statistics, flags
    problematic items, and updates the database with calibrated parameters.

    Args:
        min_responses: Minimum responses per item to include in calibration (default: 30)
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.calibration import run_calibration as _run_calibration

    try:
        db = EnglishTestDB()
        results = _run_calibration(db, min_responses=min_responses)
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration failed: {str(e)}")


@router.get("/calibration/flagged")
async def get_flagged_items() -> Dict:
    """
    Get list of items flagged during calibration for review.

    Returns items with calibration_status='flagged' along with their
    current parameters and quality metrics.
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        conn = db._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, domain, stem, discrimination, difficulty, guessing,
                   point_biserial, correct_rate, calibration_status,
                   calibration_n, status, stage, panel
            FROM items
            WHERE calibration_status = 'flagged'
            ORDER BY calibration_n DESC
        """)

        columns = [desc[0] for desc in cursor.description]
        flagged_items = [dict(zip(columns, row)) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return {
            'flagged_count': len(flagged_items),
            'items': flagged_items,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get flagged items: {str(e)}")


@router.get("/calibration/item-stats/{item_id}")
async def get_item_statistics(item_id: int) -> Dict:
    """
    Get detailed response statistics for a single item.

    Returns response count, correct rate, and average response time.
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        stats = db.get_item_statistics(item_id)

        if not stats or stats.get('response_count', 0) == 0:
            raise HTTPException(status_code=404, detail=f"No response data for item {item_id}")

        return stats

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get item statistics: {str(e)}")


# ============================================
# MST Routing Configuration Endpoints (Phase 3-C)
# ============================================

class RoutingConfigUpdate(BaseModel):
    cutpoints: Dict


@router.get("/routing-config")
async def get_routing_config() -> Dict:
    """
    Get current MST routing cutpoints from database.

    Returns all active stage transition cutpoints used for MST routing.
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        config = db.get_routing_config()

        return {
            'status': 'success',
            'routing_config': config,
            'description': {
                'stage1_to_2': 'Stage 1 to Stage 2 panel routing (low/high theta cuts)',
                'stage2_to_3_low': 'Low panel to Stage 3 subtrack routing',
                'stage2_to_3_medium': 'Medium panel to Stage 3 subtrack routing',
                'stage2_to_3_high': 'High panel to Stage 3 subtrack routing',
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get routing config: {str(e)}")


@router.put("/routing-config/{stage_transition}")
async def update_routing_config(stage_transition: str, request: RoutingConfigUpdate) -> Dict:
    """
    Update routing cutpoints for a specific stage transition.

    Args:
        stage_transition: One of 'stage1_to_2', 'stage2_to_3_low',
                          'stage2_to_3_medium', 'stage2_to_3_high'
        request: RoutingConfigUpdate with cutpoints dict

    Returns:
        Updated config row
    """
    from app.english_test.database import EnglishTestDB

    valid_transitions = [
        'stage1_to_2', 'stage2_to_3_low', 'stage2_to_3_medium', 'stage2_to_3_high'
    ]
    if stage_transition not in valid_transitions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stage_transition. Must be one of: {valid_transitions}"
        )

    try:
        db = EnglishTestDB()
        result = db.update_routing_config(stage_transition, request.cutpoints)
        return {
            'status': 'success',
            'updated': result
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update routing config: {str(e)}")


# ============================================
# MST Simulation Endpoints (Phase 3-C)
# ============================================

class SimulationRequest(BaseModel):
    n_simulees: int = 500
    cutpoints: Optional[Dict] = None
    config_label: Optional[str] = None


@router.post("/simulation/run")
async def run_simulation(request: SimulationRequest) -> Dict:
    """
    Run MST simulation with specified cutpoints.

    If cutpoints not provided, uses current DB config.
    Results are stored in simulation_results table.

    Args:
        n_simulees: Number of simulated examinees (default: 500)
        cutpoints: Optional cutpoints dict. If None, loads from DB.
        config_label: Optional label for this configuration
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.irt_engine import IRTEngine
    from app.english_test.simulation import MSTSimulator

    try:
        db = EnglishTestDB()
        irt = IRTEngine()
        simulator = MSTSimulator(irt)

        # Load item bank from DB
        conn = db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, stage, panel, domain, difficulty as b,
                   discrimination as a, guessing as c
            FROM items WHERE status = 'active'
        """)
        columns = [desc[0] for desc in cursor.description]
        item_bank = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        db._return_connection(conn)

        if not item_bank:
            raise HTTPException(status_code=400, detail="No active items in database for simulation")

        # Use provided cutpoints or load from DB
        cutpoints = request.cutpoints
        if cutpoints is None:
            cutpoints = db.get_routing_config()
            if not cutpoints:
                cutpoints = {
                    'stage1_to_2': {"low": -0.5, "high": 0.5},
                    'stage2_to_3_low': {"L1": -1.0, "L2": -0.5},
                    'stage2_to_3_medium': {"M1": -0.25, "M2": 0.25},
                    'stage2_to_3_high': {"H1": 0.5, "H2": 1.0},
                }

        # Run simulation
        result = simulator.simulate(
            n_simulees=request.n_simulees,
            item_bank=item_bank,
            cutpoints=cutpoints
        )

        # Store results in simulation_results table
        label = request.config_label or f"sim_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        conn = db._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO simulation_results (
                config_label, cutpoints, n_simulees, rmse, bias,
                mean_se, classification_accuracy, theta_correlation, run_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            label,
            json.dumps(cutpoints),
            request.n_simulees,
            result['rmse'],
            result['bias'],
            result['mean_se'],
            result['classification_accuracy'],
            result['theta_correlation'],
            datetime.now()
        ))
        sim_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        db._return_connection(conn)

        result['simulation_id'] = sim_id
        result['config_label'] = label
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/simulation/results")
async def get_simulation_results(limit: int = 20) -> Dict:
    """
    Get past simulation results for comparison.

    Args:
        limit: Max results to return (default: 20)
    """
    from app.english_test.database import EnglishTestDB

    try:
        db = EnglishTestDB()
        conn = db._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, config_label, cutpoints, n_simulees,
                   rmse, bias, mean_se, classification_accuracy,
                   theta_correlation, run_date
            FROM simulation_results
            ORDER BY run_date DESC
            LIMIT %s;
        """, (limit,))

        columns = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            r = dict(zip(columns, row))
            if r.get('run_date'):
                r['run_date'] = r['run_date'].isoformat()
            results.append(r)

        cursor.close()
        db._return_connection(conn)

        return {
            'status': 'success',
            'count': len(results),
            'results': results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get simulation results: {str(e)}")


# ============================================
# Validity Study Endpoints (Phase 3-A)
# ============================================

class DIFRequest(BaseModel):
    item_ids: List[int]
    grouping_var: str = "gender"
    reference_group: str = "male"
    focal_group: str = "female"


class ExternalCorrelationRequest(BaseModel):
    scores: Dict[str, float]


@router.post("/validity/dif")
async def run_dif_analysis(request: DIFRequest) -> Dict:
    """
    Run Mantel-Haenszel DIF analysis on specified items.

    ETS classification: A (negligible, |d|<1.0), B (moderate, 1.0-1.5), C (large, >1.5)
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.validity import ValidityAnalysis

    try:
        db = EnglishTestDB()
        validity = ValidityAnalysis(db)

        results = []
        for item_id in request.item_ids:
            result = validity.mantel_haenszel_dif(
                item_id=item_id,
                grouping_var=request.grouping_var,
                reference_group=request.reference_group,
                focal_group=request.focal_group
            )
            results.append(result)

        # Summary counts
        a_count = sum(1 for r in results if r.get('dif_classification') == 'A')
        b_count = sum(1 for r in results if r.get('dif_classification') == 'B')
        c_count = sum(1 for r in results if r.get('dif_classification') == 'C')

        return {
            'status': 'success',
            'items_analyzed': len(results),
            'classification_summary': {'A': a_count, 'B': b_count, 'C': c_count},
            'results': results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DIF analysis failed: {str(e)}")


@router.get("/validity/reliability")
async def get_reliability() -> Dict:
    """
    Compute marginal reliability of the test.

    Target: rho >= 0.85
    Formula: rho = 1 - mean(SE^2) / var(theta)
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.validity import ValidityAnalysis

    try:
        db = EnglishTestDB()
        validity = ValidityAnalysis(db)
        return validity.marginal_reliability()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reliability computation failed: {str(e)}")


@router.get("/validity/test-retest")
async def get_test_retest(max_days: int = 30) -> Dict:
    """
    Compute test-retest reliability.

    Pearson correlation between first and second theta for repeat examinees.
    Target: r >= 0.85
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.validity import ValidityAnalysis

    try:
        db = EnglishTestDB()
        validity = ValidityAnalysis(db)
        return validity.test_retest_reliability(max_days_between=max_days)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test-retest computation failed: {str(e)}")


@router.post("/validity/external-correlation")
async def external_correlation(request: ExternalCorrelationRequest) -> Dict:
    """
    Correlate CAT theta with external assessment scores.

    Input: {user_id: external_score} mapping
    Returns Pearson r with 95% CI.
    """
    from app.english_test.database import EnglishTestDB
    from app.english_test.validity import ValidityAnalysis

    try:
        db = EnglishTestDB()
        validity = ValidityAnalysis(db)
        return validity.external_criterion_correlation(request.scores)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"External correlation failed: {str(e)}")


# ============================================
# Bulk Insert Endpoints (Seed Data)
# ============================================

@router.post("/bulk-insert-seed-items")
async def bulk_insert_seed_items(clear_existing: bool = False) -> Dict:
    """
    Bulk insert items from seed_items_600.json into the database.

    Args:
        clear_existing: If True, deletes all existing items/passages/sessions/responses first.
                        Default False (appends to existing data).

    Returns:
        Insertion summary with counts by domain and stage/panel.
    """
    from app.english_test.database import EnglishTestDB

    try:
        # Load seed data
        json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'seed_items_600.json')
        if not os.path.exists(json_path):
            raise HTTPException(
                status_code=404,
                detail="seed_items_600.json not found. Run generate_seed_items.py first."
            )

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        passages = data.get('passages', [])
        items = data['items']

        db = EnglishTestDB()
        conn = db._get_connection()
        cursor = conn.cursor()

        results = {"status": "success", "steps": []}

        # Optionally clear existing data
        if clear_existing:
            cursor.execute("SELECT COUNT(*) FROM items")
            old_items = cursor.fetchone()[0]
            cursor.execute("DELETE FROM english_test_responses")
            cursor.execute("DELETE FROM english_test_sessions")
            cursor.execute("DELETE FROM items")
            cursor.execute("DELETE FROM passages")
            conn.commit()
            results["steps"].append({
                "step": "clear_existing",
                "deleted_items": old_items
            })

        # Run calibration fields migration (idempotent)
        try:
            cal_migration_path = os.path.join(
                os.path.dirname(__file__), '..', '..',
                'prisma', 'migrations', 'add_calibration_fields.sql'
            )
            if os.path.exists(cal_migration_path):
                with open(cal_migration_path, 'r', encoding='utf-8') as f:
                    cursor.execute(f.read())
                conn.commit()
        except Exception:
            conn.rollback()

        # Insert passages
        passage_id_map = {}  # temp_id -> real DB id
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
                passage.get('ar_level', 1.5),
                passage.get('genre', 'expository'),
                datetime.now()
            ))
            real_id = cursor.fetchone()[0]
            passage_id_map[passage.get('temp_id')] = real_id

        conn.commit()
        results["steps"].append({"step": "insert_passages", "count": len(passages)})

        # Insert items
        inserted = 0
        for item in items:
            # Map passage temp_id to real DB id for reading items
            mapped_passage_id = None
            if item.get('passage_temp_id'):
                mapped_passage_id = passage_id_map.get(item['passage_temp_id'])

            # skill_tag may already be JSON string or a list
            skill_tag = item.get('skill_tag', '[]')
            if isinstance(skill_tag, list):
                skill_tag = json.dumps(skill_tag)

            # options may be dict or JSON string
            options = item.get('options', {})
            if isinstance(options, dict):
                options = json.dumps(options)

            cursor.execute("""
                INSERT INTO items (
                    stage, panel, form_id, domain, stem, options, correct_answer,
                    skill_tag, difficulty, discrimination, guessing,
                    passage_id, status, exposure_count, exposure_rate,
                    source, calibration_status, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                item['stage'],
                item['panel'],
                item.get('form_id', 1),
                item['domain'],
                item['stem'],
                options,
                item['correct_answer'],
                skill_tag,
                item.get('difficulty', 0.0),
                item.get('discrimination', 1.0),
                item.get('guessing', 0.25),
                mapped_passage_id,
                item.get('status', 'active'),
                0,   # exposure_count
                0.0, # exposure_rate
                item.get('source', 'seed_data'),
                item.get('calibration_status', 'uncalibrated'),
                datetime.now()
            ))
            inserted += 1

        conn.commit()
        results["steps"].append({"step": "insert_items", "count": inserted})

        # Final verification
        cursor.execute("SELECT COUNT(*) FROM items")
        total_items = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM passages")
        total_passages = cursor.fetchone()[0]
        cursor.execute("SELECT domain, COUNT(*) FROM items GROUP BY domain ORDER BY domain")
        domain_counts = dict(cursor.fetchall())
        cursor.execute("""
            SELECT stage, panel, COUNT(*) FROM items
            GROUP BY stage, panel ORDER BY stage, panel
        """)
        panel_counts = {f"S{r[0]}_{r[1]}": r[2] for r in cursor.fetchall()}

        results["steps"].append({
            "step": "verify",
            "total_items": total_items,
            "total_passages": total_passages,
            "by_domain": domain_counts,
            "by_panel": panel_counts,
        })

        cursor.close()
        conn.close()

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk insert failed: {str(e)}")
