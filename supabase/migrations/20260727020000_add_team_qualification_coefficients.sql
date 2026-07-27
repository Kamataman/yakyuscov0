-- ============================================================
-- 規定打席・規定投球回のチームごとの係数を追加（Issue #114）
-- 規定打席 = 試合数 × qualified_pa_coefficient
-- 規定投球回 = 試合数 × qualified_ip_coefficient
-- 将来的にチーム管理画面から編集できるようにする想定のため teams に持たせる
-- ============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS qualified_pa_coefficient NUMERIC(4, 2) NOT NULL DEFAULT 3.1,
  ADD COLUMN IF NOT EXISTS qualified_ip_coefficient NUMERIC(4, 2) NOT NULL DEFAULT 1;
