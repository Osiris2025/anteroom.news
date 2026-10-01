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
    -- Geeky magazines only (AI Frontier, Weekly Weird News, Open Source, Science Frontiers, Dark Matter,
    -- Vital Signs, Chart Room, The Veil, Green Room); also skip political keywords.
    AND a.magazine_id IN ('neural-hardware', 'weekly-weird-news', 'oss-report', 'weird-and-wild', 'dark-matter', 'vital-sign', 'starfall-weekly', 'the-veil', 'the-green-room')
    AND (a.title || ' ' || coalesce(a.summary, '')) !~* '(trump|biden|harris|congress|senate|republican|democrat|\mgop\M|israel|gaza|palestin|ukrain|russia|election|midterm|white house|immigra|supreme court|pentagon|tariff|political|politic|lawmaker|federal agenc|\mmaha\M|campaign trail)'
    AND a.id NOT IN (SELECT article_id FROM social_post WHERE platform = 'bluesky')
), picks AS (
  SELECT id FROM ranked WHERE rn = 1 ORDER BY overall LIMIT 12
)
UPDATE article SET social_repeat = TRUE WHERE id IN (SELECT id FROM picks);
