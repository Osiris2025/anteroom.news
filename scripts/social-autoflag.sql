-- Flags fresh live articles for Bluesky (social_repeat=true) so the daily queue job has material.
-- Picks the newest articles per magazine (last 3 days, with image + plain-text summary, never
-- posted or queued before), about 2 per magazine, capped at 12 per run (~1 per magazine).
-- Run daily before `publisher.run queue`. Safe to re-run.
WITH ranked AS (
  SELECT a.id,
         row_number() OVER (PARTITION BY a.magazine_id ORDER BY a.created_at DESC) AS rn,
         row_number() OVER (ORDER BY a.created_at DESC) AS overall
  FROM article a
  WHERE a.status = 'live'
    AND a.social_repeat = FALSE
    AND a.created_at > now() - interval '3 days'
    AND a.image_url LIKE 'http%'
    AND coalesce(a.summary, '') <> '' AND a.summary NOT LIKE '<%'
    AND length(a.title) > 25
    AND a.id NOT IN (SELECT article_id FROM social_post WHERE platform = 'bluesky')
), picks AS (
  SELECT id FROM ranked WHERE rn = 1 ORDER BY overall LIMIT 12
)
UPDATE article SET social_repeat = TRUE WHERE id IN (SELECT id FROM picks);
