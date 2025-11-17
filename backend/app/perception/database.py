"""
Database Operations for Visual Perception Test
"""

import sys
import os

# Diagnostic logging
print("=" * 80)
print("PERCEPTION DATABASE MODULE LOADING")
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")
print(f"Current directory: {os.getcwd()}")
print(f"Attempting to import Prisma...")
print("=" * 80)

try:
    from prisma import Prisma
    print("SUCCESS: Prisma imported successfully!")
except Exception as e:
    print(f"ERROR: Failed to import Prisma: {type(e).__name__}: {e}")
    print(f"Error details: {repr(e)}")
    import traceback
    traceback.print_exc()
    raise

from typing import Optional, List, Dict
from datetime import datetime
import uuid


class PerceptionDatabase:
    """Database operations for perception test"""

    def __init__(self):
        self.db = Prisma()

    async def connect(self):
        """Connect to database"""
        if not self.db.is_connected():
            await self.db.connect()

    async def disconnect(self):
        """Disconnect from database"""
        if self.db.is_connected():
            await self.db.disconnect()

    # ===== Session Operations =====

    async def create_session(
        self,
        student_id: str,
        grade: int,
        passage_id: str
    ) -> Dict:
        """Create a new perception test session"""
        try:
            print(f"🔍 DATABASE: Creating session - student_id={student_id}, grade={grade}, passage_id={passage_id}")
            session_code = f"PERCEPTION-{uuid.uuid4().hex[:12].upper()}"
            print(f"🔍 DATABASE: Generated session_code: {session_code} (length: {len(session_code)})")

            print(f"🔍 DATABASE: Calling Prisma create with data...")
            session = await self.db.perceptiontestsession.create(
                data={
                    "studentId": student_id,
                    "grade": grade,
                    "passageId": passage_id,
                    "sessionCode": session_code,
                    "currentPhase": "introduction",
                    "status": "in_progress"
                },
                include={
                    "passage": {
                        "include": {
                            "questions": True
                        }
                    }
                }
            )
            print(f"✅ DATABASE: Session created successfully")

            # Convert Prisma object to dict
            result = session.model_dump() if hasattr(session, 'model_dump') else dict(session)
            print(f"✅ DATABASE: Successfully converted session to dict")
            return result
        except Exception as e:
            print(f"❌ DATABASE ERROR in create_session: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session by ID"""
        session = await self.db.perceptiontestsession.find_unique(
            where={"id": session_id},
            include={
                "passage": {
                    "include": {
                        "questions": True
                    }
                },
                "responses": True,
                "result": True
            }
        )

        # Convert Prisma object to dict
        return session.model_dump() if session and hasattr(session, 'model_dump') else (dict(session) if session else None)

    async def update_session_phase(
        self,
        session_id: str,
        phase: str
    ) -> Dict:
        """Update session phase"""
        # Determine timestamp field based on phase
        timestamp_fields = {
            "calibration": {"calibrationStartedAt": datetime.utcnow()},
            "reading": {"readingStartedAt": datetime.utcnow()},
            "questions": {"questionsStartedAt": datetime.utcnow()},
            "completed": {"completedAt": datetime.utcnow()}
        }

        update_data = {
            "currentPhase": phase,
            **timestamp_fields.get(phase, {})
        }

        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data=update_data
        )

        return session

    async def save_calibration(
        self,
        session_id: str,
        calibration_points: List[Dict],
        calibration_accuracy: float
    ) -> Dict:
        """Save calibration data"""
        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data={
                "calibrationPoints": calibration_points,
                "calibrationAccuracy": calibration_accuracy,
                "calibrationCompletedAt": datetime.utcnow()
            }
        )

        return session

    async def complete_session(self, session_id: str) -> Dict:
        """Mark session as completed"""
        session = await self.db.perceptiontestsession.update(
            where={"id": session_id},
            data={
                "status": "completed",
                "completedAt": datetime.utcnow()
            }
        )

        return session

    # ===== Gaze Data Operations =====

    async def save_gaze_data(
        self,
        session_id: str,
        gaze_data: Dict
    ) -> Dict:
        """Save gaze tracking data"""
        data = await self.db.perceptiongazedata.create(
            data={
                "sessionId": session_id,
                "phase": gaze_data["phase"],
                "gazeX": gaze_data["gaze_x"],
                "gazeY": gaze_data["gaze_y"],
                "confidence": gaze_data["confidence"],
                "headPitch": gaze_data.get("head_pitch"),
                "headYaw": gaze_data.get("head_yaw"),
                "headRoll": gaze_data.get("head_roll"),
                "leftPupilDiameter": gaze_data.get("left_pupil_diameter"),
                "rightPupilDiameter": gaze_data.get("right_pupil_diameter"),
                "timestamp": gaze_data.get("timestamp", datetime.utcnow())
            }
        )

        return data

    async def get_gaze_data(
        self,
        session_id: str,
        phase: Optional[str] = None
    ) -> List[Dict]:
        """Get gaze data for session"""
        where_clause = {"sessionId": session_id}

        if phase:
            where_clause["phase"] = phase

        data = await self.db.perceptiongazedata.find_many(
            where=where_clause,
            order_by={"timestamp": "asc"}
        )

        return data

    # ===== Response Operations =====

    async def save_response(
        self,
        session_id: str,
        question_id: str,
        selected_answer: str,
        is_correct: bool,
        response_time: Optional[int] = None
    ) -> Dict:
        """Save student response"""
        response = await self.db.perceptionresponse.create(
            data={
                "sessionId": session_id,
                "questionId": question_id,
                "selectedAnswer": selected_answer,
                "isCorrect": is_correct,
                "responseTime": response_time
            }
        )

        return response

    async def get_responses(self, session_id: str) -> List[Dict]:
        """Get all responses for session"""
        responses = await self.db.perceptionresponse.find_many(
            where={"sessionId": session_id},
            include={"question": True}
        )

        return responses

    # ===== Result Operations =====

    async def save_result(
        self,
        session_id: str,
        result_data: Dict
    ) -> Dict:
        """Save test result"""
        result = await self.db.perceptiontestresult.create(
            data={
                "sessionId": session_id,
                **result_data
            }
        )

        return result

    async def get_result(self, session_id: str) -> Optional[Dict]:
        """Get test result"""
        result = await self.db.perceptiontestresult.find_unique(
            where={"sessionId": session_id}
        )

        return result

    # ===== Passage Operations =====

    async def get_passage_for_grade(self, grade: int) -> Optional[Dict]:
        """Get a random passage for the given grade"""
        try:
            print(f"🔍 DATABASE: Querying passages for grade {grade}")
            passages = await self.db.perceptionpassage.find_many(
                where={"grade": grade},
                include={"questions": True}
            )
            print(f"🔍 DATABASE: Found {len(passages)} passages")

            if not passages:
                print(f"⚠️ DATABASE: No passages found for grade {grade}")
                return None

            passage = passages[0]
            print(f"🔍 DATABASE: Selected passage ID: {passage.id if hasattr(passage, 'id') else 'unknown'}")
            print(f"🔍 DATABASE: Passage has {len(passage.questions) if hasattr(passage, 'questions') else 0} questions")

            # Return first passage for now (can implement random selection later)
            # Convert Prisma object to dict
            result = passage.model_dump() if hasattr(passage, 'model_dump') else dict(passage)
            print(f"✅ DATABASE: Successfully converted passage to dict")
            return result
        except Exception as e:
            print(f"❌ DATABASE ERROR in get_passage_for_grade: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def get_passage(self, passage_id: str) -> Optional[Dict]:
        """Get passage by ID"""
        passage = await self.db.perceptionpassage.find_unique(
            where={"id": passage_id},
            include={"questions": True}
        )

        # Convert Prisma object to dict
        return passage.model_dump() if passage and hasattr(passage, 'model_dump') else (dict(passage) if passage else None)
