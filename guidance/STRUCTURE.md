# Project Structure
<!-- Last updated: 2026-10-09 -->

Mapa de carpetas y archivos del proyecto **Calandrias** (Next.js 15 App Router + Supabase + MercadoPago + Resend; `pnpm`; tests con `vitest`). Sitio público de cabañas en Tandil + backoffice en `admin.calandrias.com.ar` (rutas `/admin/*`).

Excluidos del árbol: `node_modules/`, `.next/`, `.git/`, `supabase/.temp/`, archivos `.DS_Store`.

```
calandrias/
├── .claude/                                  # Carpeta de configuración local de Claude Code (vacía en el repo)
├── .cursor/
│   └── rules/
│       └── calandrias-rules.mdc              # Reglas de proyecto para Cursor (contexto, convenciones, flujo de trabajo; ignorada por git)
├── .superpowers/
│   └── sdd/                                  # Ledger del desarrollo guiado por subagentes (progress.md, task-N-brief/report.md, diffs review-*.diff); ignorado por git
├── .env                                      # Variables de entorno reales (ignorado por git)
├── .env.example                              # Plantilla de variables: Supabase, ADMIN_EMAILS, MercadoPago, Resend, CRON_SECRET, URLs del sitio/admin, GA/GTM
├── .gitignore                                # Ignora node_modules, .next, .env*, .cursor/, supabase/.temp/, *.tsbuildinfo
├── .nvmrc                                    # Node 22 (requerido por vitest/pnpm)
├── app/                                      # App Router: páginas públicas, backoffice y rutas API
│   ├── layout.tsx                            # Layout raíz: metadata SEO editable (site_content 'seo'), fuentes, Header, GA/GTM
│   ├── page.tsx                              # Home (ISR 1h): hero, servicios, CTA, teaser de cabañas, galería bento, reseñas, FAQs, ubicación (contenido desde Supabase con fallbacks)
│   ├── not-found.tsx                         # Página 404 con estilo del sitio
│   ├── globals.css                           # Estilos globales: tokens Tailwind v4, paleta de marca (beige-arena, brown-earth, green-moss...), variables shadcn
│   ├── favicon.ico                           # Favicon del sitio
│   ├── robots.ts                             # robots.txt: permite público, bloquea /api, /admin; apunta al sitemap
│   ├── sitemap.ts                            # sitemap.xml dinámico: páginas estáticas + cabañas desde la DB
│   ├── cabanas/
│   │   ├── page.tsx                          # Listado de cabañas (ISR 1h) con CabinsShowcase + estado de reservas online
│   │   └── [slug]/
│   │       └── page.tsx                      # Detalle de cabaña: metadata dinámica, generateStaticParams, features, calendario y reserva (CabinCalendarSection)
│   ├── reserva-confirmada/
│   │   ├── page.tsx                          # Pantalla de éxito tras el pago (back_url success de MercadoPago)
│   │   └── PaymentInfo.tsx                   # Client Component: lee payment_id de la URL y consulta /api/payments/status
│   ├── reserva-fallida/
│   │   └── page.tsx                          # Pantalla de pago rechazado / errores (bookings_disabled, cabin_not_found, availability_check_failed)
│   ├── reserva-pendiente/
│   │   └── page.tsx                          # Pantalla de pago pendiente (back_url pending de MercadoPago)
│   ├── admin/                                # Backoffice (protegido por middleware + requireAdmin)
│   │   ├── login/
│   │   │   └── page.tsx                      # Login con Supabase Auth (client); reenvía a /admin/reset links de email que llegan con tokens en el hash
│   │   ├── reset/
│   │   │   └── page.tsx                      # Crear/restablecer contraseña desde link de invite/recovery (setSession explícito con tokens del hash)
│   │   └── (panel)/                          # Route group autenticado (layout llama requireAdmin y envuelve con AdminShell)
│   │       ├── layout.tsx                    # Layout del panel: requireAdmin() + AdminShell (sidebar/nav)
│   │       ├── page.tsx                      # Índice del admin: redirect a /admin/reservas
│   │       ├── reservas/
│   │       │   ├── page.tsx                  # Server Component: lista reservas + cabañas y stats, renderiza ReservationsTable
│   │       │   └── actions.ts                # Server Actions: confirmar, cancelar, crear reserva manual/bloqueo, sincronizar Airbnb ahora
│   │       ├── cabanas/
│   │       │   ├── page.tsx                  # Lista TODAS las cabañas (incl. ocultas) como cards + NewCabinDialog
│   │       │   ├── actions.ts                # Server Actions: crear cabaña borrador, actualizar cabaña, subir imagen, setear URL iCal de Airbnb
│   │       │   └── [slug]/
│   │       │       └── page.tsx              # Editor de cabaña (CabinForm) con su URL de Airbnb
│   │       ├── contenido/
│   │       │   ├── page.tsx                  # Carga textos (site_content), FAQs, reseñas y galería; renderiza ContenidoTabs
│   │       │   └── actions.ts                # Server Actions: textos por sección, CRUD de FAQs/reseñas/galería, reorden atómico, subida de imagen de galería
│   │       └── configuracion/
│   │           ├── page.tsx                  # Formulario de site_settings (contacto, horarios, switch de reservas)
│   │           └── actions.ts                # Server Action: updateSiteSettingsAction (valida con siteSettingsSchema)
│   └── api/                                  # Route Handlers
│       ├── admin/
│       │   └── logout/
│       │       └── route.ts                  # POST: cierra sesión Supabase y redirige (303) al login según host
│       ├── availability/
│       │   └── route.ts                      # GET ?cabin=slug: rangos ocupados públicos (sin PII), cache 60s
│       ├── cabins/
│       │   └── [id]/
│       │       └── ical/
│       │           └── route.ts              # GET: exporta feed .ics de una cabaña (id = slug) para que Airbnb bloquee fechas
│       ├── cron/
│       │   └── sync-airbnb/
│       │       └── route.ts                  # GET (Bearer CRON_SECRET): corre runAirbnbSync; programado en vercel.json a las 06:00 UTC
│       ├── emails/
│       │   └── send-confirmation/
│       │       └── route.ts                  # POST: envía email de confirmación de reserva vía EmailService
│       └── payments/
│           ├── status/
│           │   └── route.ts                  # GET ?payment_id: consulta estado de pago en MercadoPago
│           └── webhook/
│               └── route.ts                  # POST: webhook MP (valida firma HMAC, idempotencia, crea reserva confirmada o pending, envía email); GET: healthcheck
├── components/                               # Componentes React
│   ├── BentoGridGallery.tsx                  # Galería bento (client) con "ver más"; safelist de spans de Tailwind
│   ├── CabinCalendarSection.tsx              # Sección de reserva en detalle de cabaña: calendario + rango + formulario + checkout MP (o CTA WhatsApp si reservas apagadas)
│   ├── CabinsShowcase.tsx                    # Grid de cards de cabañas con precio "desde" y CTA de reserva/WhatsApp
│   ├── CabinsTeaser.tsx                      # Bloque teaser de cabañas en la home (stats + features editables desde site_content)
│   ├── GoogleAnalytics.tsx                   # Scripts GA4/GTM + helpers trackEvent / trackCabinEvent
│   ├── Header.tsx                            # Header sticky con nav desktop y Sheet móvil
│   ├── LocationMap.tsx                       # Sección ubicación/contacto con mapa embebido y datos de site_settings
│   ├── ReservationForm.tsx                   # Formulario de datos del huésped (client) con alertas de conflicto de fechas
│   ├── ReserveButton.tsx                     # Botón "Reservar Ahora" que scrollea a #calendar-section
│   ├── ReviewsCarousel.tsx                   # Carrusel infinito de reseñas (client)
│   ├── SchemaMarkup.tsx                      # JSON-LD: LocalBusinessSchema, HotelSchema, ReviewsSchema
│   ├── admin/                                # Componentes del backoffice (todos client)
│   │   ├── AdminShell.tsx                    # Shell del panel: sidebar fijo, nav móvil (Sheet), email del admin y botón Salir
│   │   ├── CabinForm.tsx                     # Editor de cabaña con tabs: Información, Fotos, Precios (PricingGrid), Airbnb
│   │   ├── ConfiguracionForm.tsx             # Formulario de site_settings (switch de reservas, contacto, horarios)
│   │   ├── ContenidoTabs.tsx                 # Tabs Textos / FAQs / Reseñas / Galería que combinan SiteTextsEditor y SortableCrudList
│   │   ├── ImageUploadField.tsx              # Campo de imagen con preview + subida a Storage (uploadImageAction)
│   │   ├── NewCabinDialog.tsx                # Diálogo "Nueva cabaña": nombre + slug autogenerado, crea borrador y redirige al editor
│   │   ├── PricingGrid.tsx                   # Grilla de 12 meses de precio/descuento (celda vacía = hereda base)
│   │   ├── ReservationFormDialog.tsx         # Diálogo "Nueva reserva / Bloquear fechas" (modo manual o blocked)
│   │   ├── ReservationsTable.tsx             # Tabla de reservas con filtros, stats, confirmar/cancelar y sync Airbnb
│   │   ├── SiteTextsEditor.tsx               # Cards editables de hero, servicios, CTA, teaser y SEO (site_content)
│   │   └── SortableCrudList.tsx              # Lista CRUD genérica con drag & drop, campos configurables y toggle de publicación
│   ├── calendar/
│   │   ├── CabinAvailabilityCalendar.tsx     # Calendario mensual de disponibilidad con selección de rango (exporta DateRange)
│   │   └── SelectedDateRange.tsx             # Muestra el rango elegido y la cantidad de noches
│   └── ui/                                   # Primitivas shadcn/ui (new-york, base stone): accordion, alert, badge, button, card, dialog, form, input, label, select, sheet, textarea
├── docs/
│   ├── OPERACIONES.md                        # Guía de operaciones: arquitectura, env vars, migraciones, alta de admins, manual del backoffice, checklist de deploy
│   ├── supabase/
│   │   └── email-templates/
│   │       ├── invite.html                   # Template brandeado del mail "Invite user" de Supabase Auth
│   │       └── recovery.html                 # Template brandeado del mail "Reset password" de Supabase Auth
│   └── superpowers/
│       ├── plans/
│       │   ├── 2026-07-15-backoffice-supabase.md   # Plan de implementación: migración Strapi → Supabase + backoffice propio
│       │   └── 2026-07-16-admin-invite-flow.md     # Plan de implementación del flujo de invitación de admins
│       └── specs/
│           └── 2026-07-16-admin-invite-flow-design.md  # Diseño aprobado del flujo de invitación de admins
├── emails/                                   # Emails transaccionales con React Email
│   ├── index.ts                              # Barrel: ReservationConfirmation, EmailLayout, helpers
│   ├── components/
│   │   └── EmailLayout.tsx                   # Layout base del email (header con logo, footer con contacto, paleta de marca)
│   ├── templates/
│   │   └── ReservationConfirmation.tsx       # Template de confirmación de reserva (datos de contacto editables con fallback)
│   └── utils/
│       └── emailHelpers.ts                   # Helpers de formato de fecha/precio, noches, código de reserva, validación de email
├── guidance/                                 # Mapa vivo del proyecto para agentes
│   ├── STRUCTURE.md                          # Este archivo: árbol de carpetas con descripciones
│   └── UTILS.md                              # Registro de funciones, rutas API, server actions, hooks, tipos y componentes
├── hooks/
│   └── useCalendarData.ts                    # Hook client: carga disponibilidad pública de una cabaña desde /api/availability
├── lib/                                      # Lógica de negocio y acceso a servicios
│   ├── airbnb-sync.ts                        # Sync con iCal de Airbnb: diff puro (diffAirbnbEvents) + orquestación con DB (runAirbnbSync)
│   ├── auth.ts                               # isAdminEmail (ADMIN_EMAILS) y requireAdmin (server; redirige a /admin/login)
│   ├── auth-utils.ts                         # Utilidades puras de auth: sanitizeRedirect, parseAuthHashType, parseAuthHashTokens
│   ├── cabin-form.ts                         # Lógica pura del form de cabañas: grilla<->overrides, parseCabinForm (zod), slugifyCabinName, airbnbUrlSchema
│   ├── content-fallback.ts                   # withFallback: valor del CMS o default hardcodeado
│   ├── content-schemas.ts                    # Schemas zod por bloque de site_content (hero, services, cta, cabins_teaser, seo)
│   ├── email-service.ts                      # EmailService: renderiza y envía la confirmación de reserva por Resend
│   ├── mercadopago.ts                        # paymentApi: crear preferencia, obtener pago, validar firma de webhook; formatCurrency, calculateNights
│   ├── resend.ts                             # Cliente Resend + DEFAULT_FROM_EMAIL
│   ├── reservations-view.ts                  # Helpers puros de presentación del módulo Reservas (ReservationView, stats, formato de fechas, resumen de sync)
│   ├── settings-schema.ts                    # siteSettingsSchema (zod) para la configuración editable
│   ├── sort-order.ts                         # moveItem: reordena arrays sin mutar
│   ├── utils.ts                              # cn() (clsx + tailwind-merge)
│   ├── actions/
│   │   ├── payment-actions.ts                # Server Action processReservationPaymentDirect: gate bookingsEnabled, precio server-side, disponibilidad, redirect a MP
│   │   └── upload.ts                         # uploadImageToBucket / sanitizeFileName: subida validada al bucket `images` (server-only)
│   ├── adapters/
│   │   └── reservation-payment-adapter.ts    # ReservationPaymentAdapter: form de reserva → ReservationPaymentData + validación
│   ├── db/                                   # Capa de datos (server-only, cliente service_role)
│   │   ├── cabins.ts                         # Cabañas: mapper rowToCabin, lecturas públicas/admin, create/update, config de sync Airbnb
│   │   ├── content.ts                        # site_settings, site_content, FAQs, reseñas, galería y reorderContent (RPC admin_reorder)
│   │   └── reservations.ts                   # Reservas: mappers, disponibilidad, CRUD, traducción de errores DATE_CONFLICT / DUPLICATE_MP_PAYMENT
│   ├── payments/
│   │   └── metadata.ts                       # buildPreferenceMetadata / metadataToReservationInput (camelCase → snake_case de MP)
│   ├── reservations/
│   │   └── server-price.ts                   # createLocalDate + computeServerReservationPrice (precio autoritativo del servidor)
│   └── supabase/
│       ├── admin.ts                          # createAdminClient: service_role, bypasea RLS (server-only)
│       ├── client.ts                         # createBrowserSupabase: cliente browser con publishable key
│       └── server.ts                         # createServerSupabase: cliente SSR con cookies de next/headers
├── public/                                   # Assets estáticos
│   ├── cabin1.jpg, cabin4.jpg, cabin5.jpg    # Imágenes principales de las cabañas (seed)
│   ├── cabins/
│   │   ├── cab1/thumbnail.jpg                # Miniatura cabaña 1
│   │   ├── cab4/thumbnail.jpg                # Miniatura cabaña 4
│   │   └── cab5/thumbnail.jpg                # Miniatura cabaña 5
│   ├── gallery/                              # 12 fotos de la galería bento (seed)
│   ├── lasCalandrias.png                     # Logo / imagen de marca
│   ├── logo.png                              # Logo del header
│   └── logo.svg                              # Logo vectorial
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql           # Esquema: enums, cabins, cabin_sync_config, reservations (constraint no_overlap), faqs, reviews, gallery_items, site_content, site_settings, trigger set_updated_at
│   │   ├── 0002_rls.sql                      # RLS deny-by-default, policies de lectura pública de contenido publicado, bucket `images` público de solo lectura
│   │   ├── 0003_mp_payment_unique.sql        # Índice único parcial sobre reservations.mp_payment_id (idempotencia del webhook)
│   │   └── 0004_admin_reorder.sql            # Función RPC admin_reorder(p_table, p_ids) para reorden atómico (solo service_role)
│   └── seed.sql                              # Seed: 3 cabañas, FAQs, reseñas, galería, site_content y site_settings portados del código viejo
├── tests/                                    # Tests vitest (tests/**/*.test.ts)
│   ├── airbnb-sync.test.ts                   # diffAirbnbEvents y consistencia de zona horaria
│   ├── auth-utils.test.ts                    # sanitizeRedirect, parseAuthHashType, parseAuthHashTokens
│   ├── auth.test.ts                          # isAdminEmail
│   ├── cabin-form.test.ts                    # grilla<->overrides, parseCabinForm, slugifyCabinName
│   ├── content-fallback.test.ts              # withFallback
│   ├── content-schemas.test.ts               # schemas de site_content y moveItem
│   ├── db-mappers.test.ts                    # rowToReservation, reservationToRow, rowToCabin, getPrecioParaMes
│   ├── ical-generator.test.ts                # generateICalForCabin (feed público sin PII)
│   ├── payment-actions.test.ts               # processReservationPaymentDirect (gate, precio server-side, redirects)
│   ├── reservation-flow.test.ts              # buildPreferenceMetadata / metadataToReservationInput
│   ├── reservations-view.test.ts             # helpers de presentación de reservas
│   ├── schema-seed.test.ts                   # seed.sql contiene las cabañas del fixture
│   ├── server-price.test.ts                  # createLocalDate, computeServerReservationPrice
│   ├── settings-schema.test.ts               # siteSettingsSchema
│   └── fixtures/
│       └── seed-cabins.ts                    # Fixture congelado de slug/name de las cabañas sembradas
├── types/                                    # Tipado de dominio
│   ├── api.ts                                # Shapes de respuestas/requests de API (legacy Strapi en parte)
│   ├── cabin.ts                              # Cabin, features, amenities, overrides mensuales, Month, getPrecioParaMes
│   ├── calendar.ts                           # CalendarEvent, CalendarDay, CalendarMonth, CabinInfo, ReservationDetails
│   ├── db.ts                                 # Reservation/ReservationInput, AvailabilityRange, CabinInput, SiteSettings, Faq, Review, GalleryItem (+Inputs)
│   ├── ical.ts                               # ICalRawEvent, ProcessedEvent
│   ├── index.ts                              # Barrel de tipos
│   ├── payment.ts                            # Tipos de MercadoPago: preferencia, pago, notificación, PaymentStatus, ReservationPaymentData
│   ├── pricing.ts                            # PricingBreakdown, PricingDisplayProps
│   └── reservation.ts                        # LocalReservation, ICalEvent, ReservationFormData, ReservationSummary, ReservationStep
├── utils/                                    # Utilidades puras compartidas cliente/servidor
│   ├── calendar.ts                           # Mes de calendario, disponibilidad por fecha, availabilityToCalendarEvents, AVAILABILITY_COLORS
│   ├── ical-generator.ts                     # Generador .ics (generateICalForCabin) y parser de iCal de Airbnb
│   ├── icons.tsx                             # Mapa CabinFeatureIcon → lucide (CABIN_FEATURE_ICONS, CabinIcon, Icon)
│   ├── image.ts                              # imageUrl: resuelve rutas locales o URLs absolutas de Storage
│   └── pricing.ts                            # Cálculo de precios con descuento de semana y overrides mensuales; formatPrice; getMinimumPrice
├── components.json                           # Config de shadcn/ui (style new-york, baseColor stone, aliases @/components, @/lib/utils)
├── eslint.config.mjs                         # ESLint flat config: next/core-web-vitals + next/typescript
├── middleware.ts                             # Rewrite admin.<dominio>/x → /admin/x, refresco de sesión Supabase y gate de /admin/* (login/reset públicos)
├── next.config.ts                            # Next config: remotePatterns para imágenes de **.supabase.co
├── next-env.d.ts                             # Tipos generados por Next (ignorado por git)
├── package.json                              # Scripts: dev, build, start, lint, email:dev, test (vitest run); dependencias
├── pnpm-lock.yaml                            # Lockfile de pnpm
├── postcss.config.mjs                        # PostCSS con @tailwindcss/postcss
├── tsconfig.json                             # TS strict, alias @/* → raíz, plugin next
├── tsconfig.tsbuildinfo                      # Cache incremental de TS (ignorado por git)
├── vercel.json                               # Cron de Vercel: /api/cron/sync-airbnb todos los días a las 06:00 UTC
└── vitest.config.ts                          # Vitest: alias @/ y stub de `server-only`; include tests/**/*.test.ts
```

## Convenciones clave

- **Server vs client**: `lib/db/*`, `lib/supabase/admin.ts`, `lib/actions/upload.ts` y `lib/airbnb-sync.ts` importan `server-only`. Helpers puros (`lib/cabin-form.ts`, `lib/reservations-view.ts`, `lib/auth-utils.ts`, `utils/*`) son importables desde Client Components.
- **Identificadores**: `cabinId` en reservas y metadata de MP es el **slug** de la cabaña; el uuid vive en `Cabin.documentId`; `Cabin.id` numérico es `sort_order` (legacy).
- **Fechas**: Postgres `date` → `new Date('YYYY-MM-DD')` (medianoche UTC). Formatear con getters UTC (`toISODate`, `toDateString`) o parsear con `createLocalDate` para evitar corrimiento en UTC-3.
- **Escrituras**: toda escritura pasa por Server Actions con `requireAdmin()` + cliente service_role; RLS es deny-by-default (solo lectura pública de contenido publicado).
- **Admin host**: `admin.calandrias.com.ar/x` se reescribe a `/admin/x` en `middleware.ts`; `/api/*` no se reescribe.

## Capa dbm (migración Supabase → dbm, cutover 2026-10-09)

La app corre 100% sobre dbm: `lib/supabase/` fue eliminado y los paquetes `@supabase/*` desinstalados.

- `lib/better-auth.ts` — config de better-auth (drizzle adapter, email+password, rate limit en DB). Va en este nombre y no en `lib/auth.ts` porque ahí vive `requireAdmin()` del backoffice actual.
- `lib/auth-schema.ts` — tablas de better-auth generadas (`pnpm auth:schema`); no editar a mano.
- `lib/auth-client.ts` — cliente better-auth para componentes client.
- `lib/db.ts` — cliente drizzle + postgres.js contra `DATABASE_URL` (pooler transaccional, TLS verify-full).
- `lib/schema.ts` — schema drizzle de las 8 tablas de la app (claves snake_case; enums reservation_state/source).
- `lib/db/errors.ts` — `pgErrorCode()` / `errorMessage()` para traducir SQLSTATE de postgres.js (envuelto por DrizzleQueryError).
- `lib/auth-emails.ts` — mail brandeado de reset de contraseña (Resend, import diferido).
- `lib/s3.ts` — helpers S3 presignados contra el bucket `calandrias` de dbm (Garage).
- `app/api/auth/[...all]/route.ts` — handler GET/POST de better-auth.
- `drizzle.config.ts` — drizzle-kit sobre `DATABASE_URL_SESSION`; carga `.env.local`.
- `pnpm-workspace.yaml` — habilita el build script de esbuild (requerido por drizzle-kit).
- `MIGRATION.md` — checklist generado del rewrite Supabase → dbm; gate del cutover.
- `.env.local` — secretos de dbm (gitignored).
