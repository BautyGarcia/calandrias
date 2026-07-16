create extension if not exists btree_gist;

create type reservation_state as enum ('pending', 'confirmed', 'cancelled', 'blocked');
create type reservation_source as enum ('direct', 'airbnb', 'manual');

-- ============ CABINS ============
create table cabins (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    subtitle text not null default '',
    description text not null default '',
    setting text not null default '',
    capacity text not null default '',
    bedrooms text not null default '',
    bathrooms text not null default '',
    image_url text,
    thumbnail_url text,
    -- [{"icon":"Mountain","label":"..."}] — icon ∈ Mountain|Waves|Flame|Car|Wifi|ChefHat|TreePine|Utensils
    features jsonb not null default '[]',
    highlights jsonb not null default '[]',            -- string[]
    amenities jsonb not null default '{}',             -- {kitchen:bool, air_conditioning:text, pool_shared:bool}
    nearby_attractions jsonb not null default '[]',    -- string[]
    rating_score numeric(2,1) not null default 5.0,
    rating_review_count int not null default 0,
    precio_base_noche numeric not null default 0,
    descuento_dia_semana_default int not null default 0,
    -- [{"mes":"enero","precio_override":123,"descuento_dia_semana_override":10}]
    overrides_mensuales jsonb not null default '[]',
    is_published boolean not null default true,
    sort_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- URL iCal de Airbnb: tabla aparte para que NUNCA sea legible por anon
-- (RLS es por fila, no por columna).
create table cabin_sync_config (
    cabin_id uuid primary key references cabins(id) on delete cascade,
    airbnb_ical_url text not null default '',
    updated_at timestamptz not null default now()
);

-- ============ RESERVATIONS ============
create table reservations (
    id uuid primary key default gen_random_uuid(),
    cabin_slug text not null references cabins(slug) on update cascade,
    check_in date not null,
    check_out date not null,
    guest_name text not null default '',
    guest_email text not null default '',
    guest_phone text,
    guests int not null default 1,
    pets int not null default 0,
    state reservation_state not null default 'pending',
    source reservation_source not null default 'direct',
    external_id text,                    -- UID del evento iCal de Airbnb
    reservation_code text unique,        -- CAL-XXXXXXXX
    total_price numeric,
    currency text not null default 'ARS',
    special_requests text,
    mp_payment_id text,
    mp_preference_id text,
    payment_status text,
    payment_method text,
    paid_amount numeric,
    payment_date timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint valid_dates check (check_out > check_in),
    -- Garantía dura anti doble-reserva: dos reservas activas de la misma
    -- cabaña no pueden solapar noches (checkout de una = checkin de otra es válido).
    constraint no_overlap exclude using gist (
        cabin_slug with =,
        daterange(check_in, check_out) with &&
    ) where (state in ('confirmed', 'blocked'))
);

create unique index uq_reservations_airbnb on reservations (cabin_slug, external_id)
    where source = 'airbnb' and external_id is not null;
create index idx_reservations_cabin_dates on reservations (cabin_slug, check_in, check_out)
    where state <> 'cancelled';

-- ============ CONTENIDO EDITABLE ============
create table faqs (
    id uuid primary key default gen_random_uuid(),
    question text not null,
    answer text not null,
    sort_order int not null default 0,
    is_published boolean not null default true,
    updated_at timestamptz not null default now()
);

create table reviews (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    location text not null default '',
    text text not null,
    avatar_url text,
    rating int not null default 5 check (rating between 1 and 5),
    sort_order int not null default 0,
    is_published boolean not null default true,
    updated_at timestamptz not null default now()
);

create table gallery_items (
    id uuid primary key default gen_random_uuid(),
    title text not null default '',
    description text not null default '',
    image_url text not null,
    span text not null default 'normal',   -- valor de data/bentoGalleryItems.ts (layout bento)
    sort_order int not null default 0,
    is_published boolean not null default true,
    updated_at timestamptz not null default now()
);

-- Bloques de texto de la web: un registro por sección, valor jsonb libre
-- Claves iniciales: 'hero', 'services', 'cta', 'cabins_teaser', 'seo'
create table site_content (
    key text primary key,
    value jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

-- Config global de una sola fila (id fijo = true)
create table site_settings (
    id boolean primary key default true check (id),
    bookings_enabled boolean not null default false,
    whatsapp text not null default '5492494027920',
    phone text not null default '+5492494027920',
    email text not null default 'Lascalandrias123@gmail.com',
    address text not null default 'Ronca-Hue 50, B7000 Tandil, Buenos Aires',
    checkin_time text not null default '15:00',
    checkout_time text not null default '11:00',
    updated_at timestamptz not null default now()
);

-- updated_at automático
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
    foreach t in array array['cabins','cabin_sync_config','reservations','faqs','reviews','gallery_items','site_content','site_settings']
    loop
        execute format('create trigger trg_%s_updated_at before update on %I for each row execute function set_updated_at()', t, t);
    end loop;
end $$;
