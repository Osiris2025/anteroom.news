\pset format unaligned
\pset fieldsep "|"
SELECT m.name, c.name, c.slug
FROM magazine m
LEFT JOIN category c ON c.magazine_id = m.id
ORDER BY m.name, c.name;
