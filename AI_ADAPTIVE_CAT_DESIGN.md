# AI-Powered Adaptive CAT System Design
**영어 능력 평가 AI 연동형 적응형 컴퓨터 기반 테스트 시스템**

---

## 📋 Executive Summary

### Current System (기존 시스템)
- **MST (Multi-Stage Testing)**: 1→3→3 구조의 고정된 단계
- **IRT 3PL 모델**: 문항 난이도 기반 능력 추정
- **Static Item Pool**: 600개 고정 문항 (현재 237개)
- **Manual Quality Control**: 수동 문항 검토 및 수정

### Proposed AI-Enhanced System (AI 강화 제안 시스템)
- **Dynamic Item Generation**: AI 실시간 문항 생성
- **Adaptive Difficulty**: 실시간 난이도 조정
- **Automated QA**: AI 기반 문항 품질 검증
- **Continuous Learning**: 학습자 반응 기반 모델 업데이트

---

## 🎯 Core Objectives

### 1. Quality Improvement (품질 개선)
- ✅ **No more duplicates**: AI generates unique items
- ✅ **Grammar accuracy**: AI validates grammatical correctness
- ✅ **Context relevance**: Ensures meaningful, real-world contexts
- ✅ **Difficulty precision**: IRT-calibrated item parameters

### 2. Scalability (확장성)
- 🚀 **Unlimited item pool**: Generate items on-demand
- 🚀 **Multi-domain coverage**: Grammar, vocabulary, reading
- 🚀 **Level diversity**: A1-C2 CEFR levels
- 🚀 **Content freshness**: Regular item rotation

### 3. Personalization (개인화)
- 🎯 **Learner profiling**: Track strengths/weaknesses
- 🎯 **Adaptive pathways**: Customize test flow
- 🎯 **Targeted feedback**: Specific skill recommendations
- 🎯 **Progress tracking**: Longitudinal ability monitoring

---

## 🏗️ System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - Test Interface                                           │
│  - Results Dashboard                                        │
│  - Admin Panel                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│              Node.js Backend (Proxy Layer)                  │
│  - Authentication                                           │
│  - Session Management                                       │
│  - Request Routing                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
┌─────┴─────────┐  ┌───────┴──────────┐
│  Python       │  │  AI Service      │
│  FastAPI      │  │  (Claude API)    │
│  - IRT Engine │  │  - Item Gen      │
│  - MST Logic  │  │  - QA Check      │
│  - Scoring    │  │  - Analysis      │
└───────────────┘  └──────────────────┘
       │
┌──────┴──────────────┐
│   PostgreSQL        │
│   (Supabase)        │
│   - Items           │
│   - Sessions        │
│   - Responses       │
│   - AI Metadata     │
└─────────────────────┘
```

---

## 🤖 AI Integration Points

### 1. Intelligent Item Generation

#### Input Parameters
```json
{
  "domain": "vocabulary|grammar|reading",
  "difficulty": -3.0 to +3.0,  // IRT b parameter
  "discrimination": 0.5 to 2.5, // IRT a parameter
  "skill_tag": "present_perfect|conditionals|inference",
  "text_type": "expository|narrative|argumentative",
  "cefr_level": "A1|A2|B1|B2|C1|C2",
  "constraints": {
    "word_count": 50-500,
    "avoid_topics": ["politics", "religion"],
    "required_features": ["real_world_context"]
  }
}
```

#### AI Prompt Template
```
You are an expert English language test item writer following IRT 3PL principles.

Generate a {domain} test item with these specifications:
- CEFR Level: {cefr_level}
- Skill: {skill_tag}
- Difficulty: {difficulty_description}
- Discrimination: {discrimination_level}

Requirements:
1. Item must have exactly 4 options (A, B, C, D)
2. Only ONE correct answer
3. Distractors must be plausible but clearly incorrect
4. Use natural, authentic language
5. Avoid cultural bias or sensitive topics
6. For reading items, include a passage (50-200 words)

Output format (JSON):
{
  "stem": "question text",
  "passage": "reading passage (if applicable)",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correct_answer": "A",
  "rationale": "why this tests the target skill",
  "estimated_difficulty": -1.5,
  "estimated_discrimination": 1.2
}
```

### 2. Automated Quality Assurance

#### QA Checks
```python
class AIItemQA:
    def validate_item(self, item):
        checks = [
            self.check_grammar(),           # Grammar correctness
            self.check_uniqueness(),        # No duplicates
            self.check_difficulty(),        # Matches target
            self.check_distractors(),       # Quality of wrong answers
            self.check_bias(),              # Cultural/gender bias
            self.check_answer_key(),        # Only one correct answer
        ]
        return all(checks)

    def check_grammar(self, text):
        """Use Claude API to verify grammatical correctness"""
        prompt = f"Is this sentence grammatically correct? {text}"
        # Claude API call

    def check_uniqueness(self, stem):
        """Check against existing items in database"""
        # Cosine similarity with existing items
        # Reject if similarity > 0.85

    def check_difficulty(self, item, target_difficulty):
        """Estimate difficulty and compare to target"""
        # Use AI to estimate difficulty
        # Compare with target ± 0.5 range
```

### 3. Dynamic Difficulty Adjustment

#### Real-Time Calibration
```python
class AdaptiveItemSelector:
    def select_next_item(self, theta_estimate, se, responses):
        # Traditional: Select from static pool
        # AI-Enhanced: Generate if no suitable item

        candidates = self.query_item_pool(
            difficulty_range=(theta_estimate - 1, theta_estimate + 1),
            min_discrimination=1.0
        )

        if len(candidates) < 3:
            # Generate new item on-the-fly
            new_item = self.ai_generate_item(
                target_difficulty=theta_estimate,
                domain=self.next_domain(),
                avoid_skills=self.tested_skills
            )

            # Quick QA
            if self.ai_qa.validate_item(new_item):
                candidates.append(new_item)

        # Fisher Information-based selection
        selected = max(candidates, key=lambda i: self.fisher_info(i, theta_estimate))
        return selected
```

### 4. Intelligent Feedback Generation

#### Personalized Reports
```python
class AIFeedbackGenerator:
    def generate_report(self, session_data):
        prompt = f"""
        Analyze this test performance and generate actionable feedback:

        - Final ability: {session_data['theta']} (SE: {session_data['se']})
        - Vocabulary: {session_data['vocab_score']}/14 correct
        - Grammar: {session_data['grammar_score']}/13 correct
        - Reading: {session_data['reading_score']}/13 correct

        Weak areas: {session_data['weak_skills']}
        Strong areas: {session_data['strong_skills']}

        Provide:
        1. Overall proficiency level (CEFR)
        2. Domain-specific strengths/weaknesses
        3. 3-5 specific study recommendations
        4. Suggested resources (books, exercises)
        """

        return claude_api_call(prompt)
```

---

## 📊 Data Flow

### Test Session Lifecycle

```
1. Start Test
   ├─> AI generates initial routing module (8 items)
   └─> IRT estimates initial θ

2. Stage 1 (Routing)
   ├─> Select/generate items near θ=0
   ├─> Record responses
   └─> Update θ estimate

3. Stage 2 Routing
   ├─> AI generates panel-specific items
   │   ├─> Low: θ < -1.0
   │   ├─> Medium: -1.0 ≤ θ ≤ 1.0
   │   └─> High: θ > 1.0
   └─> Record 16 responses

4. Stage 3 Routing
   ├─> AI generates subtrack items
   └─> Record final 16 responses

5. Finalize
   ├─> Calculate final θ and SE
   ├─> Map to CEFR/Lexile/AR
   ├─> AI generates feedback report
   └─> Store all data for model training
```

---

## 🛠️ Implementation Plan

### Phase 1: AI Item Generation Service (Week 1-2)

**Deliverables:**
- [ ] Claude API integration module
- [ ] Item generation prompt templates
- [ ] JSON schema validation
- [ ] Initial QA pipeline

**Files to Create:**
- `backend/app/ai_service/item_generator.py`
- `backend/app/ai_service/qa_validator.py`
- `backend/app/ai_service/prompts.py`

### Phase 2: Dynamic Item Pool (Week 3-4)

**Deliverables:**
- [ ] AI-generated item caching
- [ ] Real-time item generation endpoint
- [ ] Quality scoring system
- [ ] Item metadata tracking

**Database Changes:**
```sql
-- Add AI metadata to items table
ALTER TABLE items ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE items ADD COLUMN generation_model VARCHAR(50);
ALTER TABLE items ADD COLUMN qa_score FLOAT;
ALTER TABLE items ADD COLUMN generation_prompt TEXT;
```

### Phase 3: Adaptive Test Engine (Week 5-6)

**Deliverables:**
- [ ] Hybrid static/dynamic item selection
- [ ] Real-time difficulty adjustment
- [ ] Exposure control for AI items
- [ ] Performance monitoring

### Phase 4: Admin Dashboard (Week 7-8)

**Deliverables:**
- [ ] AI item generation UI
- [ ] Quality review interface
- [ ] Item analytics dashboard
- [ ] Manual override controls

---

## 👤 Admin Panel Features

### 1. AI Item Generator

**UI Components:**
```
┌──────────────────────────────────────┐
│ Generate New Items                   │
├──────────────────────────────────────┤
│ Domain:     [Vocabulary ▼]           │
│ CEFR Level: [B1 ▼]                   │
│ Skill:      [Collocations ▼]         │
│ Quantity:   [10        ]             │
│                                      │
│ Advanced Options ▼                   │
│  ☑ Auto-validate grammar             │
│  ☑ Check for duplicates              │
│  ☑ Estimate IRT parameters           │
│  ☐ Generate with passages            │
│                                      │
│ [Generate Items]  [Preview First]   │
└──────────────────────────────────────┘
```

### 2. Quality Review Dashboard

**Features:**
- Review AI-generated items before activation
- Approve/reject/edit functionality
- Batch operations
- Quality score visualization

### 3. Item Analytics

**Metrics:**
- Exposure rates
- p-values (difficulty)
- Point-biserial correlations
- IRT parameter drift
- AI vs human-written performance

### 4. Test Configuration

**Settings:**
- Enable/disable AI generation
- Set quality thresholds
- Configure item rotation
- Manage item pools

---

## 🔒 Quality Assurance

### Multi-Layer Validation

1. **Pre-Generation**
   - Validate input parameters
   - Check domain constraints
   - Verify target difficulty range

2. **Post-Generation**
   - Grammar check (AI + rule-based)
   - Duplicate detection (cosine similarity)
   - Answer key validation
   - Distractor quality analysis

3. **Pre-Deployment**
   - Admin review (optional)
   - Pilot testing (optional)
   - IRT calibration (field testing)

4. **Post-Deployment**
   - Monitor performance metrics
   - Flag anomalies
   - Continuous recalibration

---

## 📈 Success Metrics

### Item Quality
- Grammar error rate < 1%
- Duplicate rate < 0.1%
- Distractor effectiveness > 10% selection rate
- Point-biserial > 0.15

### Test Efficiency
- Standard error < 0.4 after 40 items
- Test-retest reliability > 0.85
- Item exposure balanced (SD < 5%)

### User Experience
- Test completion rate > 95%
- Average completion time: 30-40 minutes
- User satisfaction > 4.0/5.0

---

## 🚀 Future Enhancements

### Short-term (3-6 months)
- Multi-modal items (audio, images)
- Automated passage generation
- Real-time cheating detection
- Multi-language support (Korean, Spanish)

### Long-term (6-12 months)
- Speech assessment integration
- Writing assessment with AI scoring
- Personalized learning pathways
- Teacher dashboard with class analytics

---

## 💡 Technical Considerations

### API Rate Limits
- Claude API: 100 requests/minute
- Cache frequently used items
- Pre-generate item pools during low-traffic hours

### Cost Optimization
- Batch generation requests
- Reuse similar items across panels
- Implement smart caching strategy
- Estimated cost: $0.10-0.30 per test

### Performance
- Target latency: <2s per item generation
- Database query optimization
- Redis caching for hot items
- CDN for static assets

---

## 📚 References

### Academic Foundations
- IRT 3PL Model (Birnbaum, 1968)
- MST Design (Luecht & Nungester, 1998)
- CAT Algorithms (van der Linden & Glas, 2000)

### Implementation Guides
- Claude API Documentation
- Supabase PostgreSQL Best Practices
- FastAPI Async Patterns

---

**Document Version:** 1.0
**Last Updated:** 2025-01-27
**Author:** AI Architecture Team
**Status:** 🟢 Approved for Implementation
