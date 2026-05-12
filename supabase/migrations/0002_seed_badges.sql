-- BØLG Atlas — badge catalog seed (Sesión 2)
--
-- Badges per concepto §6. Awarded by system triggers/edge functions when
-- their criteria match (logic ships in Sesión 7). Idempotent via ON CONFLICT
-- so re-running this migration is safe.

insert into public.badges (id, name, description, rarity) values
  (
    'aurora',
    'Aurora',
    'Trip arriba del paralelo 60° — has visto la luz del norte.',
    'rare'
  ),
  (
    'antipoda',
    'Antípoda',
    'Dos trips en puntos opuestos del planeta — cruzaste el mundo entero.',
    'epic'
  ),
  (
    'volcanero',
    'Volcanero',
    'Cinco trips en volcanes. El fuego de la tierra te conoce.',
    'rare'
  ),
  (
    'sal_del_mundo',
    'Sal del Mundo',
    'Un salar, una playa y un desierto en el mismo año.',
    'rare'
  ),
  (
    'first_mover',
    'First Mover',
    'Primer usuario BØLG en pisar un país nuevo. Bandera plantada.',
    'legendary'
  ),
  (
    'caudillo',
    'Caudillo',
    'Tres o más amigos se inscribieron por tu invitación y subieron un trip.',
    'common'
  ),
  (
    'equinoccio',
    'Equinoccio',
    'Trip subido el día exacto del equinoccio.',
    'rare'
  ),
  (
    'maratonista',
    'Maratonista',
    'Un solo trip con más de 100 km caminados o corridos.',
    'common'
  ),
  (
    'anti_turista',
    'Anti-turista',
    'Trip en una ciudad fuera del top-1000 mundial. Lugares que nadie mira.',
    'common'
  ),
  (
    'heritage_keeper',
    'Heritage Keeper',
    'Recibiste o compraste un BØLG usado y le sumaste más de 500 km.',
    'epic'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity;
