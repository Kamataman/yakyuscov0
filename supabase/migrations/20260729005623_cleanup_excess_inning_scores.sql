-- イニング数を減らした際に削除されずDBに残っていた超過イニングのスコアを削除する
-- （試合一覧・チームトップの合計得点が試合結果画面と食い違う原因の一つ）
DELETE FROM inning_scores s
USING games g
WHERE s.game_id = g.id
  AND s.inning > COALESCE(g.total_innings, 9);
