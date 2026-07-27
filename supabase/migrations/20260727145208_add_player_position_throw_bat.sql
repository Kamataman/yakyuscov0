-- ============================================================
-- 選手のポジション・投打を追加（Issue #21）
-- 選手一覧のカード表示・編集モーダルで使用する
-- ============================================================

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS throw_bat TEXT;

ALTER TABLE public.players
  ADD CONSTRAINT players_position_check
    CHECK (position IS NULL OR position IN ('投手', '捕手', '内野手', '外野手', '監督・コーチ', 'スタッフ')),
  ADD CONSTRAINT players_throw_bat_check
    CHECK (throw_bat IS NULL OR throw_bat IN ('右右', '右左', '右両', '左右', '左左', '左両'));
