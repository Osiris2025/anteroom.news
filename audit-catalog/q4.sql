\pset format unaligned
\pset fieldsep "|"
SELECT m.name, t.subcategory, count(t.keyword)
FROM magazine m
JOIN taxonomy t ON t.magazine_id = m.id
GROUP BY m.name, t.subcategory
ORDER BY m.name, t.subcategory;
