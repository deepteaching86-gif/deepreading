-- Phase 3: Growth Tracking, Validity Study, MST Routing Optimization
-- ===================================================================

-- 1. Add demographics to sessions (for DIF analysis and growth tracking)
ALTER TABLE english_test_sessions
  ADD COLUMN IF NOT EXISTS grade_level INTEGER,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- 2. MST routing configuration (replaces hardcoded cutpoints)
CREATE TABLE IF NOT EXISTS mst_routing_config (
  id SERIAL PRIMARY KEY,
  stage_transition VARCHAR(30) NOT NULL,
  cutpoints JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DIF analysis results
CREATE TABLE IF NOT EXISTS dif_results (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  grouping_variable VARCHAR(20) NOT NULL,
  reference_group VARCHAR(50),
  focal_group VARCHAR(50),
  mh_chi_square FLOAT,
  mh_d_dif FLOAT,
  dif_classification VARCHAR(10),
  n_reference INTEGER,
  n_focal INTEGER,
  analysis_date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reliability tracking
CREATE TABLE IF NOT EXISTS reliability_results (
  id SERIAL PRIMARY KEY,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  n_sessions INTEGER,
  marginal_reliability FLOAT,
  mean_se FLOAT,
  theta_variance FLOAT,
  sem_at_cutpoints JSONB,
  notes TEXT
);

-- 5. Simulation results for MST optimization
CREATE TABLE IF NOT EXISTS simulation_results (
  id SERIAL PRIMARY KEY,
  config_label VARCHAR(100),
  cutpoints JSONB,
  n_simulees INTEGER,
  rmse FLOAT,
  bias FLOAT,
  mean_se FLOAT,
  classification_accuracy FLOAT,
  theta_correlation FLOAT,
  run_date TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default routing config (current hardcoded values)
INSERT INTO mst_routing_config (stage_transition, cutpoints, description)
SELECT 'stage1_to_2', '{"low": -0.5, "high": 0.5}'::jsonb, 'Stage 1 to Stage 2 routing'
WHERE NOT EXISTS (SELECT 1 FROM mst_routing_config WHERE stage_transition = 'stage1_to_2');

INSERT INTO mst_routing_config (stage_transition, cutpoints, description)
SELECT 'stage2_to_3_low', '{"L1": -1.0, "L2": -0.5}'::jsonb, 'Low panel to Stage 3'
WHERE NOT EXISTS (SELECT 1 FROM mst_routing_config WHERE stage_transition = 'stage2_to_3_low');

INSERT INTO mst_routing_config (stage_transition, cutpoints, description)
SELECT 'stage2_to_3_medium', '{"M1": -0.25, "M2": 0.25}'::jsonb, 'Medium panel to Stage 3'
WHERE NOT EXISTS (SELECT 1 FROM mst_routing_config WHERE stage_transition = 'stage2_to_3_medium');

INSERT INTO mst_routing_config (stage_transition, cutpoints, description)
SELECT 'stage2_to_3_high', '{"H1": 0.5, "H2": 1.0}'::jsonb, 'High panel to Stage 3'
WHERE NOT EXISTS (SELECT 1 FROM mst_routing_config WHERE stage_transition = 'stage2_to_3_high');
