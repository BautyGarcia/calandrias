# Backoffice Propio + Migración Strapi → Supabase — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el backend Strapi (ya inexistente) por Supabase (Postgres + Auth + Storage) y construir un backoffice propio en `admin.calandrias.com.ar` donde el cliente administra cabañas, precios, reservas y todos los textos de la web.

**Architecture:** Un solo proyecto Next.js 15 (App Router) que sirve la web pública en `calandrias.com.ar` y el backoffice bajo `/admin`, ruteado por host en `middleware.ts` (`admin.calandrias.com.ar` → rewrite a `/admin/*`). Todos los datos viven en Supabase Postgres con RLS "deny-by-default": el público solo lee contenido publicado vía policies `anon`; toda escritura pasa por server actions / route handlers que usan el cliente `service_role` tras verificar sesión admin (`requireAdmin()`). Autenticación con Supabase Auth (email + password, cookies vía `@supabase/ssr`). Imágenes en Supabase Storage (bucket público de solo-lectura).

**Tech Stack:** Next.js 15.3.8, React 19, TypeScript, Tailwind v4 + shadcn/radix (ya en el repo), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), MercadoPago SDK (ya en el repo), Resend + react-email (ya en el repo), Vitest para tests de lógica, pnpm.

## Global Constraints

- Gestor de paquetes: **pnpm** (existe `pnpm-lock.yaml`; nunca usar npm/yarn).
- Idioma de toda la UI del backoffice y mensajes al usuario final: **español (es-AR)**. Código, identificadores y commits en inglés.
- Los nombres de campo existentes se conservan en la capa de aplicación (`camelCase`: `checkIn`, `guestName`, `precio_base_noche`, etc. tal como están en `types/`). En Postgres se usa `snake_case`; el mapeo vive SOLO en `lib/db/*`.
- `cabinId` en reservas es el **slug** de la cabaña (así funciona hoy todo el código). No cambiar esa semántica.
- Estados de reserva: `pending | confirmed | cancelled | blocked`. Fuentes: `direct | airbnb | manual`. No inventar otros.
- **Ninguna** clave con prefijo `NEXT_PUBLIC_` puede contener secretos. `NEXT_PUBLIC_CRON_SECRET` se elimina del proyecto.
- El cliente `service_role` de Supabase (`createAdminClient()`) solo puede importarse desde código server-side (route handlers, server actions, server components). Nunca en componentes client.
- Endpoints públicos jamás devuelven PII de huéspedes (nombre, email, teléfono). Solo el backoffice autenticado ve esos datos.
- Componentes UI: reutilizar los primitivos existentes de `components/ui/*` (shadcn). No agregar librerías de UI nuevas.
- Cada task termina con `pnpm build` exitoso (y `pnpm vitest run` desde el Task 2 en adelante) y un commit.
- Commits terminan con: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Prerrequisitos manuales (los hace el humano, NO los agentes)

1. Crear proyecto en [supabase.com](https://supabase.com) (región `sa-east-1` São Paulo, la más cercana a Argentina). Anotar: Project URL, publishable key, secret key, y el connection string.
2. Instalar Supabase CLI (`brew install supabase/tap/supabase`) y hacer `supabase login` + `supabase link --project-ref <ref>`.
3. Crear el usuario admin del cliente en Supabase Dashboard → Authentication → Users → "Add user" (email del cliente + password temporal; el cliente luego usa "¿Olvidaste tu contraseña?").
4. En Vercel: agregar los dominios `calandrias.com.ar`, `www.calandrias.com.ar` y `admin.calandrias.com.ar` al proyecto; configurar DNS (CNAME `admin` → `cname.vercel-dns.com`).
5. ~~Rotar credenciales comprometidas~~ — **DECISIÓN DEL USUARIO (2026-07-15): los secretos de MercadoPago/Resend/cron se mantienen tal cual.** No proponer ni ejecutar rotación; el `.env` igualmente sale del repo (Task 1).
6. Cargar en Vercel (Production + Preview) las env vars listadas en el Task 1.

---

### Task 1: Dependencias, saneamiento de secretos, clientes Supabase y Vitest

**Files:**
- Modify: `package.json` (deps + script test)
- Create: `.gitignore` entrada para `.env*` (verificar si existe `.gitignore`; si no, crearlo)
- Create: `.env.example`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/client.ts`
- Create: `vitest.config.ts`
- Delete (de git): `.env` (el archivo local se conserva, se borra del índice)

**Interfaces:**
- Produces: `createServerSupabase(): Promise<SupabaseClient>` (cliente con sesión del usuario, cookies), `createAdminClient(): SupabaseClient` (service role, solo server), `createBrowserSupabase(): SupabaseClient` (anon, para el login del backoffice).

- [ ] **Step 1: Instalar dependencias**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D vitest
```

- [ ] **Step 2: Sacar `.env` del repo y crear `.env.example`**

```bash
git rm --cached .env
printf '\n# local env\n.env\n.env.local\n.env*.local\n' >> .gitignore
```

Crear `.env.example` con este contenido exacto (sin valores reales):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Admin
ADMIN_EMAILS=            # emails separados por coma con acceso al backoffice

# MercadoPago (ROTADOS post-leak)
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=reservas@calandrias.com.ar

# Cron (ROTADO post-leak; solo server, sin variante NEXT_PUBLIC)
CRON_SECRET=

# Sitio
NEXT_PUBLIC_SITE_URL=https://calandrias.com.ar
NEXT_PUBLIC_ADMIN_URL=https://admin.calandrias.com.ar

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=
NEXT_PUBLIC_GTM_ID=
```

- [ ] **Step 3: Clientes Supabase**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // llamado desde un Server Component: el middleware refresca la sesión
                    }
                },
            },
        }
    )
}
```

`lib/supabase/admin.ts`:

```typescript
import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente service_role: bypasea RLS. SOLO importable desde código server.
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    )
}
```

(`pnpm add server-only` si no resuelve; es un paquete de 1KB que hace fallar el build si se importa desde cliente.)

`lib/supabase/client.ts`:

```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabase() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}
```

- [ ] **Step 4: Vitest**

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    resolve: { alias: { '@': path.resolve(__dirname) } },
    test: { include: ['tests/**/*.test.ts'] },
})
```

Agregar a `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 5: Verificar build y commitear**

Run: `pnpm build` → Expected: build OK (nada usa aún los clientes nuevos).

```bash
git add -A
git commit -m "chore: add supabase clients, remove .env from repo, add vitest

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Schema de base de datos, RLS y seed

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/migrations/0002_rls.sql`
- Create: `supabase/seed.sql`
- Test: `tests/schema-seed.test.ts` (validación estática del seed vs. `data/cabins.ts`)

**Interfaces:**
- Produces: tablas `cabins`, `cabin_sync_config`, `reservations`, `faqs`, `reviews`, `gallery_items`, `site_content`, `site_settings` con los nombres de columna exactos de abajo. Los Tasks 3+ dependen de estos nombres.

- [ ] **Step 1: Migración de schema**

`supabase/migrations/0001_initial_schema.sql`:

```sql
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
```

- [ ] **Step 2: Migración de RLS y Storage**

`supabase/migrations/0002_rls.sql`:

```sql
-- Deny-by-default: se habilita RLS en todo; solo se crean policies de LECTURA
-- pública sobre contenido publicado. NINGUNA policy de escritura: toda escritura
-- entra por service_role (server actions con requireAdmin()).
alter table cabins enable row level security;
alter table cabin_sync_config enable row level security;
alter table reservations enable row level security;
alter table faqs enable row level security;
alter table reviews enable row level security;
alter table gallery_items enable row level security;
alter table site_content enable row level security;
alter table site_settings enable row level security;

create policy "public read published cabins" on cabins
    for select to anon, authenticated using (is_published);
create policy "public read published faqs" on faqs
    for select to anon, authenticated using (is_published);
create policy "public read published reviews" on reviews
    for select to anon, authenticated using (is_published);
create policy "public read published gallery" on gallery_items
    for select to anon, authenticated using (is_published);
create policy "public read site content" on site_content
    for select to anon, authenticated using (true);
create policy "public read site settings" on site_settings
    for select to anon, authenticated using (true);
-- cabin_sync_config y reservations: SIN policies → invisibles fuera de service_role.

-- Storage: bucket público de solo lectura; escritura solo via service_role.
insert into storage.buckets (id, name, public) values ('images', 'images', true)
    on conflict (id) do nothing;
create policy "public read images" on storage.objects
    for select to anon, authenticated using (bucket_id = 'images');
```

- [ ] **Step 3: Seed**

`supabase/seed.sql` — portar **fielmente** los datos existentes. Fuentes (leerlas antes de escribir el seed):
- Las 3 cabañas de `data/cabins.ts` (slug, name, subtitle, description, setting, capacity, bedrooms, bathrooms, features, highlights, amenities, rating, nearby_attractions; `image_url`/`thumbnail_url` = rutas locales `/cabinN.jpg` tal cual). `precio_base_noche`: usar el campo `price` numérico ×1000 NO — copiar tal cual el número (`100`, `150`, `150`) y dejar que el cliente lo corrija desde el backoffice; `descuento_dia_semana_default = 15`.
- Las 6 FAQs completas hardcodeadas en `app/page.tsx` (pregunta y respuesta textuales).
- Las 5 reseñas de `data/reviews.ts` (name, location→`location`, text, avatar→`avatar_url`).
- Los 12 items de `data/bentoGalleryItems.ts` (title, description, image→`image_url`, span).
- `site_content`: claves `hero`, `services`, `cta`, `cabins_teaser` con los textos actuales de `app/page.tsx` y `components/CabinsTeaser.tsx` como jsonb. Estructura exacta de cada clave definida en el Task 9 (usar la misma).
- `site_settings`: una fila con los defaults del schema y `bookings_enabled = false` (hoy las reservas están suspendidas — se mantiene ese estado).
- `cabin_sync_config`: una fila por cabaña con `airbnb_ical_url = ''` (las URLs reales las carga el cliente en el backoffice).

Formato: `insert into ... values ...;` con dólar-quoting (`$txt$...$txt$`) para textos largos.

- [ ] **Step 4: Test de consistencia del seed**

`tests/schema-seed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { cabins } from '@/data/cabins'

const seed = readFileSync('supabase/seed.sql', 'utf-8')

describe('seed.sql', () => {
    it('contiene las 3 cabañas de data/cabins.ts', () => {
        for (const c of cabins) {
            expect(seed).toContain(c.slug)
            expect(seed).toContain(c.name)
        }
    })
    it('inicia con reservas deshabilitadas', () => {
        expect(seed).toMatch(/bookings_enabled/)
        expect(seed).not.toMatch(/bookings_enabled[^)]*true/i)
    })
})
```

Run: `pnpm vitest run` → Expected: PASS.

- [ ] **Step 5: Aplicar migraciones al proyecto linkeado**

```bash
supabase db push
supabase db query < supabase/seed.sql   # o: psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Expected: sin errores; verificar con `supabase db query "select slug from cabins"` que devuelve 3 filas.

- [ ] **Step 6: Commit**

```bash
git add supabase tests
git commit -m "feat: supabase schema, RLS deny-by-default and seed from hardcoded data

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Capa de datos `lib/db/*` (reemplazo de `lib/strapi.ts`)

**Files:**
- Create: `types/db.ts`
- Create: `lib/db/cabins.ts`
- Create: `lib/db/reservations.ts`
- Create: `lib/db/content.ts`
- Test: `tests/db-mappers.test.ts`

**Interfaces:**
- Consumes: clientes de `lib/supabase/*` (Task 1), tablas del Task 2.
- Produces (los Tasks 4–12 llaman exactamente esto):
  - `types/db.ts`: `Reservation` (shape de `LocalReservation` actual: `id: string, cabinId: string, checkIn: Date, checkOut: Date, guestName, guestEmail, guestPhone?, guests, pets, state, source, externalId?, reservationCode?, totalPrice?, currency?, specialRequests?, mpPaymentId?, paymentStatus?, paidAmount?, paymentDate?, createdAt, updatedAt`), `ReservationInput` (todo lo anterior sin `id/createdAt/updatedAt`, fechas como `string YYYY-MM-DD`), `AvailabilityRange = { checkIn: string, checkOut: string, state: 'confirmed'|'pending'|'blocked' }`, `CabinInput` (todos los campos editables de `Cabin`: name, subtitle, description, setting, capacity, bedrooms, bathrooms, imageUrl, thumbnailUrl, features, highlights, amenities, nearbyAttractions, ratingScore, ratingReviewCount, precio_base_noche, descuento_dia_semana_default, overrides_mensuales, isPublished, sortOrder), `SiteSettings`, `Faq`, `Review`, `GalleryItem`.
  - `lib/db/cabins.ts`: `getCabins(): Promise<Cabin[]>`, `getCabinBySlug(slug: string): Promise<Cabin | null>`, `updateCabin(id: string, patch: Partial<CabinInput>): Promise<void>` *(admin)*, `getAirbnbSyncConfigs(): Promise<{cabinId: string; cabinSlug: string; cabinName: string; icalUrl: string}[]>` *(admin)*, `setAirbnbIcalUrl(cabinId: string, url: string): Promise<void>` *(admin)*.
  - `lib/db/reservations.ts`: `getReservations(filters?: {cabinSlug?: string; state?: string}): Promise<Reservation[]>` *(admin)*, `getPublicAvailability(cabinSlug: string): Promise<AvailabilityRange[]>`, `checkDateAvailability(cabinSlug: string, checkIn: string, checkOut: string): Promise<{isAvailable: boolean; conflictingReservations: AvailabilityRange[]}>`, `createReservation(input: ReservationInput): Promise<Reservation>`, `updateReservation(id: string, patch: Partial<ReservationInput>): Promise<void>`, `confirmReservation(id: string)`, `cancelReservation(id: string)`, `generateReservationCode(): string`.
  - `lib/db/content.ts`: `getSiteSettings(): Promise<SiteSettings>`, `updateSiteSettings(patch)`, `getSiteContent<T>(key: string): Promise<T | null>`, `setSiteContent(key, value)`, `getFaqs(all?: boolean)`, `getReviews(all?)`, `getGalleryItems(all?)`, más `upsertFaq/deleteFaq`, `upsertReview/deleteReview`, `upsertGalleryItem/deleteGalleryItem`.

Notas de implementación obligatorias:
- Las funciones de lectura pública usan `createAdminClient()` igualmente (corren solo en server) pero **filtran `is_published`** ellas mismas; la RLS es defensa en profundidad, no la lógica primaria.
- `Cabin` (de `types/cabin.ts`) se conserva como tipo de la app: el mapper convierte fila de DB → `Cabin` armando `image`/`thumbnail` como objetos `{ url }` mínimos compatibles (ajustar `types/cabin.ts`: cambiar `image: StrapiMedia` por `image: { url: string; alternativeText?: string | null }`, ídem `thumbnail`; eliminar la interface `StrapiMedia`). El helper `getPrecioParaMes` no cambia.
- `checkDateAvailability`: solapamiento = `check_in < :checkOut AND check_out > :checkIn AND state IN ('confirmed','blocked','pending') AND cabin_slug = :slug`. (Se incluye `pending` para no ofrecer fechas con pago en curso; la constraint `no_overlap` de DB solo cubre `confirmed|blocked`.)
- `generateReservationCode()`: `'CAL-' + 8 chars alfanuméricos mayúsculas` (misma semántica que hoy en `app/api/reservations/route.ts` — leerlo y copiar la implementación).
- `createReservation` debe capturar el error de la constraint `no_overlap` (código Postgres `23P01`) y lanzarlo como `new Error('DATE_CONFLICT')` para que las rutas respondan 409.

- [ ] **Step 1: Escribir tests de mappers puros** (`tests/db-mappers.test.ts`): testear `rowToReservation` y `reservationToRow` (exportarlos desde `lib/db/reservations.ts`) — round-trip de un objeto completo y de uno con opcionales en null; testear que `rowToCabin` produce `overrides_mensuales` como array y `getPrecioParaMes` sigue funcionando sobre el resultado. Run: `pnpm vitest run` → FAIL (módulos no existen).
- [ ] **Step 2: Implementar `types/db.ts` y los tres módulos de `lib/db/`** según las firmas de arriba.
- [ ] **Step 3: `pnpm vitest run`** → Expected: PASS. `pnpm build` → OK.
- [ ] **Step 4: Commit** (`feat: supabase data-access layer replacing StrapiAPI`).

---

### Task 4: Migrar la web pública a la capa de datos nueva

**Files:**
- Modify: `app/cabanas/page.tsx`, `app/cabanas/[slug]/page.tsx` (usar `getCabins`/`getCabinBySlug` de `lib/db/cabins`)
- Modify: `components/CabinsShowcase.tsx`, `components/SchemaMarkup.tsx` (quitar `NEXT_PUBLIC_STRAPI_URL`; helper `imageUrl(path)` que devuelve el path tal cual si empieza con `/` o `http`)
- Create: `app/api/availability/route.ts` (GET público sin PII)
- Modify: `hooks/useCalendarData.ts`, `utils/calendar.ts`
- Modify: `next.config.ts` (remotePatterns: reemplazar dominio S3 de Strapi por `**.supabase.co`)
- Delete: `app/api/parse-ical/route.ts` (vestigial, ya no se usa)

**Interfaces:**
- Consumes: `lib/db/cabins.ts`, `lib/db/reservations.getPublicAvailability`.
- Produces: `GET /api/availability?cabin=<slug>` → `{ ranges: AvailabilityRange[] }`. **Este es el único endpoint de reservas accesible sin auth, y no expone datos personales.**

- [ ] **Step 1:** `app/api/availability/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPublicAvailability } from '@/lib/db/reservations'

export async function GET(request: NextRequest) {
    const cabin = request.nextUrl.searchParams.get('cabin')
    if (!cabin) return NextResponse.json({ error: 'cabin requerido' }, { status: 400 })
    const ranges = await getPublicAvailability(cabin)
    return NextResponse.json({ ranges }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } })
}
```

- [ ] **Step 2:** Reescribir `useCalendarData.ts`: eliminar la llamada al cron (`NEXT_PUBLIC_CRON_SECRET` desaparece) y el fetch a `/api/reservations`; ahora un solo fetch a `/api/availability?cabin=...`. Adaptar `utils/calendar.ts`: `convertStrapiReservationsToCalendarEvents` → nueva función `availabilityToCalendarEvents(ranges: AvailabilityRange[]): CalendarEvent[]` (sin nombres de huésped; título del evento: `"Ocupado"`). Mantener los colores por estado existentes.
- [ ] **Step 3:** Migrar páginas y componentes listados a `lib/db`. En `app/cabanas/[slug]/page.tsx` conservar `generateStaticParams`, `generateMetadata` y `revalidate = 3600`.
- [ ] **Step 4:** `pnpm build` → OK. Levantar `pnpm dev` con las env vars del proyecto Supabase y verificar manualmente: `/cabanas` lista 3 cabañas del seed, `/cabanas/retiro-exclusivo` renderiza, el calendario carga (vacío).
- [ ] **Step 5: Commit** (`feat: public site reads from supabase; PII-free availability endpoint`).

---

### Task 5: Flujo de reservas y pagos sobre Supabase

**Files:**
- Modify: `app/api/reservations/route.ts` (POST valida con zod + `checkDateAvailability` + `createReservation`; GET pasa a exigir admin — ver Task 7 — o se elimina si el backoffice usa server actions: **eliminarlo**, el backoffice del Task 8 usa server actions)
- Modify: `app/api/reservations/confirm/route.ts`, `app/api/reservations/cancel/route.ts` → **eliminar** (reemplazados por server actions admin del Task 8)
- Modify: `lib/actions/payment-actions.ts` (revalidar disponibilidad con `lib/db`, agregar `pets` al metadata de MP, dejar solo `processReservationPaymentDirect`; borrar la variante muerta `processReservationPayment`)
- Modify: `app/api/payments/webhook/route.ts` (crear reserva confirmada vía `createReservation` con campos de pago; leer metadata en snake_case incluyendo `pets`; ante `DATE_CONFLICT` crear la reserva con `state='pending'` y `special_requests` anotado con `"CONFLICTO DE FECHAS - revisar"` en vez de perder el pago)
- Modify: `emails/templates/ReservationConfirmation.tsx` (dejar de usar `calculatePriceWithWeekdayDiscount` deprecada: mostrar `totalPrice` recibido y noches, sin recalcular)
- Modify: `lib/email-service.ts` (sin cambios de firma; verificar que compila con el template)
- Delete: `lib/strapi.ts`, `types/strapi.ts` (y limpiar re-exports en `types/index.ts`; si `types/reservation.ts` referencia tipos Strapi, migrarlo a `types/db.ts`)
- Test: `tests/reservation-flow.test.ts`

**Interfaces:**
- Consumes: todo `lib/db/reservations.ts`, `lib/mercadopago.ts` (sin cambios salvo metadata), `EmailService`.
- Produces: `POST /api/reservations` → `201 { reservation }` | `409 { error: 'Las fechas seleccionadas ya no están disponibles' }` | `400` con detalle zod. El webhook mantiene su URL y validación de firma HMAC actual (no tocar `validateWebhookSignature`).

- [ ] **Step 1:** Test primero (`tests/reservation-flow.test.ts`): extraer de `payment-actions.ts` una función pura `buildPreferenceMetadata(data: ReservationPaymentData)` y testear que incluye `pets`, `cabinId`, `checkIn`, `checkOut`, `totalAmount`; extraer del webhook `metadataToReservationInput(md: Record<string, unknown>)` (snake_case → `ReservationInput` con `state:'confirmed'`, `source:'direct'`) y testear con un metadata realista de MP (claves snake_case). Run → FAIL.
- [ ] **Step 2:** Implementar los cambios listados en Files. El gating de `bookings_enabled` se agrega en el Task 11 (el POST público ya puede leer `getSiteSettings().bookings_enabled` y responder `403 { error: 'Las reservas online están temporalmente deshabilitadas' }` — implementarlo acá directamente).
- [ ] **Step 3:** `pnpm vitest run` → PASS. `pnpm build` → OK (la eliminación de `lib/strapi.ts` debe dejar cero imports rotos: `grep -r "strapi" --include="*.ts*" app components lib hooks utils types` devuelve vacío).
- [ ] **Step 4: Commit** (`feat: reservations and MP webhook on supabase; retire strapi client`).

---

### Task 6: Sync Airbnb (iCal) sobre Supabase

**Files:**
- Create: `lib/airbnb-sync.ts` (lógica extraída del route actual, reutilizable por cron y por el botón del backoffice)
- Modify: `app/api/cron/sync-airbnb/route.ts` (queda: validar `Authorization: Bearer ${CRON_SECRET}` → `runAirbnbSync()` → JSON de resultados)
- Modify: `app/api/cabins/[id]/ical/route.ts` (export .ics desde `lib/db/reservations`; sin PII extra: mantener el formato actual de `generateICalForCabin`)
- Delete: `app/api/admin/cabins/sync-config/route.ts` (ya no hace falta: `getAirbnbSyncConfigs` es una función interna)
- Test: `tests/airbnb-sync.test.ts`

**Interfaces:**
- Consumes: `getAirbnbSyncConfigs`, `getReservations`, `createReservation`, `updateReservation`, `cancelReservation` de `lib/db`; `parseAirbnbICalEvents`, `airbnbEventToReservation` de `utils/ical-generator.ts` (sin cambios).
- Produces: `runAirbnbSync(): Promise<{cabin: string; created: number; updated: number; cancelled: number; error?: string}[]>`. Idempotencia por `external_id` (respaldada por el índice único parcial del Task 2).

- [ ] **Step 1:** Test primero: extraer la función pura `diffAirbnbEvents(existing: Reservation[], incoming: ReservationInput[])` → `{toCreate, toUpdate, toCancel}` y testearla: evento nuevo → create; mismo `externalId` con fechas cambiadas → update; reserva airbnb existente ausente del iCal → cancel; reservas `source!=='airbnb'` jamás aparecen en `toCancel`. Run → FAIL.
- [ ] **Step 2:** Implementar `lib/airbnb-sync.ts` (fetch iCal con timeout 10s como hoy + `diffAirbnbEvents` + aplicar cambios) y recablear el cron route. `vercel.json` no cambia (cron diario 06:00 UTC ya configurado).
- [ ] **Step 3:** `pnpm vitest run` → PASS; `pnpm build` → OK.
- [ ] **Step 4: Commit** (`feat: airbnb ical sync on supabase with pure diff logic`).

---

### Task 7: Autenticación del backoffice (Supabase Auth) + ruteo por host

**Files:**
- Modify: `middleware.ts` (reemplazo completo)
- Create: `lib/auth.ts` (`requireAdmin()`)
- Modify: `app/admin/login/page.tsx` (login contra Supabase Auth con `createBrowserSupabase`)
- Delete: `app/api/admin/auth/route.ts` (auth casera HMAC reemplazada)

**Interfaces:**
- Produces: `requireAdmin(): Promise<{ email: string }>` — lanza `redirect('/admin/login')` si no hay sesión o el email no está en `ADMIN_EMAILS`. **Todas** las server actions y route handlers del backoffice (Tasks 8–11) empiezan con `await requireAdmin()`.

- [ ] **Step 1:** `lib/auth.ts`:

```typescript
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export function isAdminEmail(email: string | undefined): boolean {
    if (!email) return false
    const allowed = (process.env.ADMIN_EMAILS || '')
        .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    return allowed.includes(email.toLowerCase())
}

export async function requireAdmin(): Promise<{ email: string }> {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) redirect('/admin/login')
    return { email: user.email! }
}
```

- [ ] **Step 2:** `middleware.ts` — reemplazar por: (a) rewrite por host, (b) refresh de sesión Supabase, (c) gate de `/admin/*`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_HOST_PREFIX = 'admin.'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const host = request.headers.get('host') ?? ''

    // admin.calandrias.com.ar/* → /admin/* (transparente para el usuario)
    if (host.startsWith(ADMIN_HOST_PREFIX) && !url.pathname.startsWith('/admin')) {
        url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`
        return NextResponse.rewrite(url)
    }

    const isAdminRoute = url.pathname.startsWith('/admin') || host.startsWith(ADMIN_HOST_PREFIX)
    if (!isAdminRoute) return NextResponse.next()

    let response = NextResponse.next({ request })
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()

    const effectivePath = host.startsWith(ADMIN_HOST_PREFIX) && !url.pathname.startsWith('/admin')
        ? `/admin${url.pathname}` : url.pathname
    const isLogin = effectivePath.startsWith('/admin/login')
    if (!user && !isLogin) {
        const loginUrl = url.clone(); loginUrl.pathname = '/admin/login'
        return NextResponse.redirect(loginUrl)
    }
    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)'],
}
```

Nota: el chequeo de allowlist `ADMIN_EMAILS` vive en `requireAdmin()` (server), el middleware solo exige sesión — defensa en dos capas sin duplicar lógica de negocio en edge.

- [ ] **Step 3:** Reescribir `app/admin/login/page.tsx`: form email+password en español ("Ingresar al panel"), `supabase.auth.signInWithPassword`, link "¿Olvidaste tu contraseña?" → `supabase.auth.resetPasswordForEmail(email, { redirectTo: NEXT_PUBLIC_ADMIN_URL + '/reset' })`, y crear `app/admin/reset/page.tsx` (form de nueva contraseña con `supabase.auth.updateUser({ password })`). Mensajes de error en español, sin revelar si el email existe.
- [ ] **Step 4:** Verificación manual con `pnpm dev`: sin sesión, `/admin/reservas` redirige a login; con el usuario admin creado en el prerrequisito 3, entra. `pnpm build` → OK.
- [ ] **Step 5: Commit** (`feat: supabase auth for backoffice + host-based admin routing`).

---

### Task 8: Backoffice — layout + módulo Reservas

**Files:**
- Create: `app/admin/layout.tsx` (shell: sidebar responsive con `components/ui/sheet` en mobile; secciones: **Reservas, Cabañas, Contenido, Configuración**; header con email del usuario y botón "Salir"; excluir el shell en `/admin/login` y `/admin/reset` usando un route group: mover las páginas autenticadas a `app/admin/(panel)/` con `layout.tsx` propio que llama `requireAdmin()`)
- Create: `app/admin/(panel)/page.tsx` (redirect a `/admin/reservas`)
- Create: `app/admin/(panel)/reservas/page.tsx` (server component: lista + stats)
- Create: `app/admin/(panel)/reservas/actions.ts` (server actions)
- Create: `components/admin/ReservationsTable.tsx`, `components/admin/ReservationFormDialog.tsx`
- Delete: `app/admin/reservas/page.tsx` viejo (client-side contra Strapi)

**Interfaces:**
- Consumes: `requireAdmin`, `lib/db/reservations`, `lib/db/cabins`, `runAirbnbSync`.
- Produces (server actions en `actions.ts`, todas comienzan con `await requireAdmin()` y terminan con `revalidatePath('/admin/reservas')`):
  - `confirmReservationAction(id: string)`
  - `cancelReservationAction(id: string)`
  - `createManualReservationAction(input: FormData)` — crea con `source:'manual'`; sirve tanto para reserva manual (con datos de huésped) como para **bloquear fechas** (`state:'blocked'`, sin huésped)
  - `syncAirbnbNowAction(): Promise<{ok: boolean; summary: string}>`

Especificación UX (público objetivo: cliente no técnico, probablemente desde el celular):
- Stats arriba: Confirmadas / Pendientes / Este mes (cards simples).
- Filtros: por cabaña (select) y estado (chips). Orden: `checkIn` ascendente, próximas primero.
- Cada fila: rango de fechas formateado es-AR ("12 mar → 15 mar"), cabaña, huésped, origen con badge (Airbnb gris / Web verde / Manual azul), estado con badge de color, total. Acciones: Confirmar (solo `pending`), Cancelar (con `AlertDialog` de confirmación: "¿Cancelar la reserva de {guestName}? Esta acción libera las fechas.").
- Botón primario "Nueva reserva / Bloquear fechas" → dialog con tabs "Reserva manual" | "Bloquear fechas"; validación zod (fechas, `checkOut > checkIn`); si `createReservation` lanza `DATE_CONFLICT`, mostrar "Esas fechas se superponen con otra reserva".
- Botón secundario "Sincronizar Airbnb" → llama `syncAirbnbNowAction`, muestra resumen ("2 nuevas, 1 actualizada").

- [ ] **Step 1:** Implementar layout + página + actions + componentes según la especificación.
- [ ] **Step 2:** Verificación manual (`pnpm dev`): login → crear bloqueo de fechas → aparece en la tabla y en el calendario público de esa cabaña (via `/api/availability`); crear segunda reserva solapada → error de conflicto; confirmar/cancelar funcionan.
- [ ] **Step 3:** `pnpm build` → OK. Commit (`feat: admin panel shell and reservations module`).

---

### Task 9: Backoffice — módulo Cabañas (contenido, fotos, precios, Airbnb)

**Files:**
- Create: `app/admin/(panel)/cabanas/page.tsx` (cards de cabañas → link a edición)
- Create: `app/admin/(panel)/cabanas/[slug]/page.tsx` (form de edición con tabs)
- Create: `app/admin/(panel)/cabanas/actions.ts`
- Create: `components/admin/CabinForm.tsx`, `components/admin/PricingGrid.tsx`, `components/admin/ImageUploadField.tsx`

**Interfaces:**
- Consumes: `lib/db/cabins`, `requireAdmin`, Supabase Storage (`createAdminClient().storage.from('images')`).
- Produces:
  - `updateCabinAction(id: string, form: FormData)` — valida con zod y llama `updateCabin`; luego `revalidatePath('/cabanas')`, `revalidatePath('/cabanas/[slug]', 'page')`, `revalidatePath('/')`.
  - `uploadImageAction(form: FormData): Promise<{url: string}>` — sube a Storage `images/cabins/{slug}/{timestamp}-{nombre-sanitizado}`, valida mime (`image/jpeg|png|webp`) y tamaño ≤ 5MB, devuelve URL pública.
  - `updateAirbnbUrlAction(cabinId: string, url: string)` — valida que la URL sea `https://` y host que contenga `airbnb`, llama `setAirbnbIcalUrl`.

Especificación UX — tabs del form de edición:
1. **Información**: name, subtitle, description (textarea), setting (textarea), capacity/bedrooms/bathrooms (inputs de texto — hoy son strings tipo "4 huéspedes"), highlights (lista editable de strings: agregar/quitar), features (lista de pares icono+label; icono con select de los 8 permitidos mostrando el ícono lucide real), nearby_attractions (lista de strings), amenities (kitchen bool, pool_shared bool, air_conditioning texto), rating (score + review_count), toggle `is_published` ("Visible en la web").
2. **Fotos**: imagen principal y thumbnail con preview + `ImageUploadField` (input file → `uploadImageAction` → guarda URL).
3. **Precios**: `precio_base_noche` (input numérico grande con formato ARS), `descuento_dia_semana_default` (% con hint "Se aplica de lunes a jueves"), y `PricingGrid`: tabla de 12 filas (enero–diciembre) con columnas "Precio por noche" y "Descuento entre semana (%)", celdas vacías = usa el valor base (placeholder gris con el valor heredado). Guarda como `overrides_mensuales` solo los meses con algún valor.
4. **Airbnb**: input `airbnb_ical_url` (con texto de ayuda: "Pegá acá el link 'Exportar calendario' de Airbnb") + solo-lectura la URL de exportación propia: `{NEXT_PUBLIC_SITE_URL}/api/cabins/{slug}/ical` con botón copiar.

Un único botón "Guardar cambios" sticky abajo, con estado de éxito/error en español.

- [ ] **Step 1:** Implementar páginas, actions y componentes.
- [ ] **Step 2:** Verificación manual: editar el precio base de una cabaña → tras revalidación se refleja en `getPrecioParaMes` (probar seleccionando fechas en el calendario público); subir una imagen → visible en `/cabanas` (dominio `**.supabase.co` ya permitido en Task 4).
- [ ] **Step 3:** `pnpm build` → OK. Commit (`feat: admin cabins module with pricing grid and image upload`).

---

### Task 10: Backoffice — módulo Contenido (textos, FAQs, reseñas, galería)

**Files:**
- Create: `app/admin/(panel)/contenido/page.tsx` (tabs: Textos | FAQs | Reseñas | Galería)
- Create: `app/admin/(panel)/contenido/actions.ts`
- Create: `components/admin/SortableCrudList.tsx` (lista genérica: agregar / editar inline en dialog / eliminar con confirmación / reordenar con flechas ↑↓ que intercambian `sort_order` / toggle publicado)

**Interfaces:**
- Consumes: `lib/db/content.ts`, `requireAdmin`, `uploadImageAction` (Task 9, mover a `lib/actions/upload.ts` compartido si hace falta).
- Produces server actions: `updateSiteContentAction(key: string, value: unknown)`, `upsertFaqAction/deleteFaqAction`, `upsertReviewAction/deleteReviewAction`, `upsertGalleryItemAction/deleteGalleryItemAction` — todas con `revalidatePath('/')`.
- Define (y el seed del Task 2 debe respetar) los shapes de `site_content`:
  - `hero`: `{ title: string, subtitle: string, ctaLabel: string }`
  - `services`: `{ title: string, items: { icon: string, title: string, description: string }[] }` (3 items)
  - `cta`: `{ title: string, subtitle: string, buttonLabel: string }`
  - `cabins_teaser`: `{ title: string, subtitle: string, stats: { value: string, label: string }[], features: { title: string, description: string }[], ctaLabel: string }`
  - `seo`: `{ title: string, description: string, keywords: string }`

Especificación UX: tab "Textos" = un card por sección (Hero, Servicios, CTA, Sección cabañas, SEO) con forms simples (inputs y textareas con label en español y texto de ayuda de dónde aparece: "Título principal de la portada"). FAQs/Reseñas/Galería usan `SortableCrudList` con sus campos respectivos (galería incluye upload de imagen y select de `span`: Normal/Ancho/Alto).

- [ ] **Step 1:** Implementar todo lo anterior.
- [ ] **Step 2:** Verificación manual: editar el título del hero → guardar → home actualizada (la home consumirá esto en el Task 11; si el Task 11 aún no corrió, verificar contra la tabla con `supabase db query`).
- [ ] **Step 3:** `pnpm build` → OK. Commit (`feat: admin content module (texts, faqs, reviews, gallery)`).

---

### Task 11: La web pública consume el contenido editable + módulo Configuración + reactivar reservas

**Files:**
- Modify: `app/page.tsx` (hero, servicios, CTA, FAQs desde `lib/db/content`; `export const revalidate = 3600`)
- Modify: `components/CabinsTeaser.tsx`, `components/LocationMap.tsx`, `components/ReviewsCarousel.tsx`, `components/BentoGridGallery.tsx`, `components/SchemaMarkup.tsx`, `emails/templates/ReservationConfirmation.tsx` (contacto/dirección/checkin desde `site_settings`; reseñas/galería desde DB; pasar los datos como props desde server components — los componentes client no importan `lib/db`)
- Modify: `app/layout.tsx` (metadata desde `site_content.seo` vía `generateMetadata`)
- Modify: `components/CabinCalendarSection.tsx` (eliminar el `|| true` de la línea ~294, restaurar el bloque "Estimado de precios" comentado y el texto original del botón; recibir prop `bookingsEnabled: boolean` — si es `false`, mostrar el botón "Contactar por WhatsApp para reservar" con el número de `site_settings`; quitar los `console.log` de debug acá y en `CabinsShowcase.tsx`)
- Modify: `components/CabinsShowcase.tsx` (restaurar precio "desde" usando `getMinimumPrice`, visible solo si `bookingsEnabled`)
- Create: `app/admin/(panel)/configuracion/page.tsx` + `actions.ts`
- Delete: `data/reviews.ts`, `data/bentoGalleryItems.ts`, `data/cabins.ts` (tras migrar sus consumidores; si el test del Task 2 importaba `data/cabins.ts`, congelar esos datos como fixture en `tests/fixtures/seed-cabins.ts`)

**Interfaces:**
- Consumes: `getSiteContent`, `getSiteSettings`, `getFaqs`, `getReviews`, `getGalleryItems`, `updateSiteSettingsAction`.
- Produces: página Configuración con: **switch "Aceptar reservas online"** (control central que reemplaza para siempre el hack de código), datos de contacto (whatsapp, teléfono, email, dirección, horarios de check-in/out), y nota de ayuda explicando que el WhatsApp se usa en toda la web.

- [ ] **Step 1:** Implementar Configuración (server action `updateSiteSettingsAction` con zod + `revalidatePath('/', 'layout')`).
- [ ] **Step 2:** Migrar todos los consumidores listados. Regla: los server components hacen las lecturas y pasan props; textos con fallback al valor actual hardcodeado si la clave no existe (`getSiteContent` devuelve null → usar el default actual, así la web nunca queda vacía).
- [ ] **Step 3:** Verificación manual end-to-end: (1) con `bookings_enabled=false` la web muestra el botón de WhatsApp; (2) activarlo desde Configuración → seleccionar fechas → aparece estimado de precio y botón de reserva; (3) editar una FAQ → home actualizada tras revalidación; (4) `grep -rn "5492494027920\|Lascalandrias123\|Ronca-Hue" app components emails --include="*.tsx"` solo matchea defaults/fallbacks, no valores primarios.
- [ ] **Step 4:** `pnpm vitest run` y `pnpm build` → PASS/OK. Commit (`feat: cms-driven public site, settings module, bookings toggle`).

---

### Task 12: Limpieza final, README de operación y checklist de deploy

**Files:**
- Modify: `README.md` (o crear `docs/OPERACIONES.md`): cómo corre el proyecto, env vars, cómo aplicar migraciones (`supabase db push`), cómo dar de alta un admin, manual breve del backoffice para el cliente (en español, 1 pantalla por sección).
- Modify: `app/sitemap.ts`, `app/robots.ts` (dominio `calandrias.com.ar`; verificar que `metadataBase` en `app/layout.tsx` use `NEXT_PUBLIC_SITE_URL`)
- Verify/Delete: que no queden referencias: `grep -rn "strapi\|STRAPI" --include="*.ts*" app components lib hooks utils types data emails middleware.ts next.config.ts` → vacío; eliminar `lib/adapters/reservation-payment-adapter.ts` solo si quedó sin uso (verificar imports).

- [ ] **Step 1:** Limpieza + docs según Files.
- [ ] **Step 2:** Suite completa: `pnpm vitest run` → PASS; `pnpm build` → OK; `pnpm lint` → sin errores nuevos.
- [ ] **Step 3:** Commit (`chore: cleanup strapi remnants, ops docs`) y push.
- [ ] **Step 4:** Checklist de deploy (humano + agente verifican juntos):
  - Env vars cargadas en Vercel (lista del Task 1), **sin** `STRAPI_*` ni `NEXT_PUBLIC_CRON_SECRET`, `ADMIN_USERNAME/PASSWORD/SECRET_KEY` eliminadas. (Secretos MP/Resend/CRON: se reutilizan los existentes por decisión del usuario.)
  - Dominios activos: web en `calandrias.com.ar`, panel en `admin.calandrias.com.ar` (DNS ya configurado y funcionando desde 2026-07-15).
  - Webhook de MercadoPago apuntando a `https://calandrias.com.ar/api/payments/webhook`.
  - Cron de Vercel ejecutando (`vercel.json` intacto) con el `CRON_SECRET` existente cargado.
  - En Supabase: Auth → URL Configuration → Site URL = `https://admin.calandrias.com.ar` (para el mail de reset de contraseña).
  - Prueba real: reserva de prueba con MercadoPago en modo test → webhook crea reserva confirmada → email de confirmación llega → la reserva aparece en el backoffice.

---

## Decisiones de diseño (racional)

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Un solo proyecto Next.js con ruteo por host | App separada para el admin | Comparte tipos, capa de datos y deploy; un dominio extra en Vercel + un rewrite en middleware es todo el costo. |
| Escrituras solo vía service_role + `requireAdmin()`; RLS deny-by-default | Policies RLS de escritura por rol | Menos superficie de error: una sola puerta de entrada auditada, validación zod centralizada, y la RLS queda como segunda línea de defensa. |
| `ADMIN_EMAILS` como allowlist | Tabla `admin_users` / custom claims | Un solo admin (el cliente). YAGNI; cambiar a tabla es trivial si algún día hay más usuarios. |
| Exclusion constraint `no_overlap` en Postgres | Solo chequeo en aplicación | Elimina por diseño la doble reserva ante carreras (webhook de MP vs. sync de Airbnb vs. admin). |
| `jsonb` para features/overrides/amenities | Tablas normalizadas | El admin edita la cabaña como unidad; mapea 1:1 a los tipos TS existentes; cero joins. Validación con zod en las actions. |
| Endpoint público `/api/availability` sin PII | Reusar `/api/reservations` público | Hoy la API pública filtra nombres/emails/teléfonos de huéspedes: eso es una fuga de datos personales y se cierra. |
| Toggle `bookings_enabled` en DB | Editar código para pausar reservas | El patrón real del cliente (commits "temporaly suspended bookings") pasa a ser un switch en el panel. |
| Precios por mes + descuento entre semana (modelo actual) | Motor de temporadas por rango de fechas | Es el modelo que ya usa `utils/pricing.ts` y que el cliente conoce. No inventar complejidad. |
