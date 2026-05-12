-- BØLG Atlas — product catalog seed (Sesión 2)
--
-- Catálogo real de BØLG Concept ordenado por unidades vendidas L365 (top
-- al final del archivo, según fuente: BOLG_atlas_models_seed.json).
-- Solo seedeamos el nivel "model" — las variantes por color/SKU se modelan
-- en una tabla aparte en Sesión 5 cuando wireemos el flujo QR → producto
-- físico. Por eso sku queda NULL en todos los rows.
--
-- Idempotente vía ON CONFLICT: re-correr esta migration sólo actualiza
-- name/category si cambian.

insert into public.product_models (id, name, category) values
  -- Top 10 por unidades L365
  ('kids',         'Botella Insulada Kids',     'botella'),
  ('berlin',       'Mochila Berlin',            'mochila'),
  ('oslo',         'Mochila Oslo',              'mochila'),
  ('annapurna',    'Mochila Annapurna',         'mochila'),
  ('zermatt',      'Botella Insulada Zermatt',  'botella'),
  ('islandia',     'Botella Insulada Islandia', 'botella'),
  ('new-york-2-0', 'Mochila New York 2.0',      'mochila'),
  ('namibia',      'Mochila Namibia',           'mochila'),
  ('portland',     'Mug Insulado Portland',     'mug'),
  ('singapur',     'Billetera Singapur',        'billetera'),
  -- Resto del catálogo activo
  ('borneo',       'Mochila Borneo',            'mochila'),
  ('texas',        'Jockey Texas',              'jockey'),
  ('experience',   'Llavero Experience',        'llavero'),
  ('lisboa',       'Jockey Lisboa',             'jockey'),
  ('palau',        'Bolso Duffel Palau',        'duffel'),
  ('vanuatu',      'Bolso Duffel Vanuatu',      'duffel'),
  ('busan',        'Billetera Busan',           'billetera'),
  ('memories',     'Llavero Memories',          'llavero'),
  ('nankin',       'Billetera Nankin',          'billetera'),
  ('vientian',     'Billetera Vientian',        'billetera')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category;
