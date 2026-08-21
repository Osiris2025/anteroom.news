\pset format unaligned
\pset fieldsep "|"
SELECT m.name,
       COALESCE(a.subcategory, '(none)'),
       count(a.id) AS n
FROM magazine m
LEFT JOIN article a ON a.magazine_id = m.id
GROUP BY m.name, a.subcategory
ORDER BY m.name, n DESC;
