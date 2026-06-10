-- BØLG Atlas v2 — premio mensual al conquistador (slide 4 del PPT)
--
-- Esquema mínimo para auditar quién gana cada mes + estado del flujo
-- semi-auto:
--   1. Cron de Vercel calcula al ganador y inserta row con
--      status='calculated'.
--   2. Mail va al admin (benja.bolgen@gmail.com) con un link firmado.
--   3. Admin abre /api/admin/monthly-prize/[token], revisa, click
--      "notificar al ganador" → status='notified' + mail al ganador.
--
-- También: monthly_prizes deja constancia para nunca repetir ganador
-- (el slide 4 dice "Si ya ganó, pasa al siguiente del ranking").

create table public.monthly_prizes (
  id uuid primary key default gen_random_uuid(),
  -- Mes del premio. YYYY-MM-01.
  prize_month date not null,
  -- Tipo de premio. main = conquistador del mes, wonders = todas las 7,
  -- continents = todos los continentes, fifty = 50 países.
  prize_type text not null
    check (prize_type in ('main', 'wonders', 'continents', 'fifty')),
  winner_id uuid not null references public.users(id) on delete restrict,
  -- Stats al momento del cálculo para auditar.
  continents_count int not null default 0,
  countries_count int not null default 0,
  cities_count int not null default 0,
  -- Token opaco para el link admin.
  admin_token text unique not null,
  -- Workflow.
  status text not null default 'calculated'
    check (status in ('calculated', 'confirmed', 'notified', 'skipped')),
  notified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (prize_month, prize_type)
);
create index monthly_prizes_winner_idx on public.monthly_prizes (winner_id);

-- RLS: solo service_role lee/escribe. Los clientes no tocan esta tabla
-- (cron lo hace via admin client; endpoint admin valida por token).
alter table public.monthly_prizes enable row level security;

grant select, insert, update on public.monthly_prizes to service_role;

notify pgrst, 'reload schema';
