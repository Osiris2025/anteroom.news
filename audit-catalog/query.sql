\pset format unaligned
\pset fieldsep "|"
SELECT m.name, COALESCE(t.name, '(uncategorized)'), count(a.id)
FROM magazine m
JOIN article a ON a.magazine_id=m.id
LEFT JOIN taxonomy t ON t.id=a.category_id
GROUP BY m.name, t.name
ORDER BY m.name, 3 DESC;
