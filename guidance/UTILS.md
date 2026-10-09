# Utils & Code Registry
<!-- Last updated: 2026-10-09 -->

Registro de código reutilizable del proyecto **Calandrias**: hooks, rutas API, server actions, acceso a datos, utilidades, clientes de Supabase, constantes, tipos, componentes y funciones de base de datos. Consultar antes de escribir código nuevo; actualizar después de cada cambio.

Convenciones de la columna **File**: rutas relativas a la raíz del repo. Los nombres con `.` (p. ej. `paymentApi.getPayment`) son métodos de un objeto/clase exportado.

---

## Hooks

| Name | File | Description |
|------|------|-------------|
| `useCalendarData({ cabinId })` | `hooks/useCalendarData.ts` | Hook client que carga la disponibilidad pública de una cabaña desde `/api/availability` y la convierte a `CalendarEvent[]`; expone `events`, `loading`, `error`, `lastUpdated`, `refreshEvents`, `refreshAvailabilityOnly`, `clearData` (`syncing` siempre `false`, compat). |

---

## API Routes

| Route | Method | File | Description |
|-------|--------|------|-------------|
| `/api/admin/logout` | POST | `app/api/admin/logout/route.ts` | Exige `requireAdmin()`, hace `signOut()` de Supabase y redirige 303 a `/login` (host admin) o `/admin/login`. |
| `/api/availability?cabin=<slug>` | GET | `app/api/availability/route.ts` | Devuelve `{ ranges: AvailabilityRange[] }` (confirmadas, pendientes, bloqueadas; sin PII). Cache `s-maxage=60, stale-while-revalidate=300`. 400 si falta `cabin`. |
| `/api/cabins/[id]/ical` | GET | `app/api/cabins/[id]/ical/route.ts` | Exporta el feed `.ics` de la cabaña (`id` = slug) con reservas no canceladas, sin datos del huésped. 404 si la cabaña no existe/no está publicada. |
| `/api/cron/sync-airbnb` | GET | `app/api/cron/sync-airbnb/route.ts` | Cron de Vercel (06:00 UTC). Requiere header `Authorization: Bearer CRON_SECRET`; ejecuta `runAirbnbSync()` y devuelve resultados por cabaña. |
| `/api/emails/send-confirmation` | POST | `app/api/emails/send-confirmation/route.ts` | Valida body (guestName, guestEmail, cabinName, checkIn, checkOut, totalPrice, reservationCode, paymentId) y envía el email de confirmación con `EmailService`. |
| `/api/payments/status?payment_id=<id>` | GET | `app/api/payments/status/route.ts` | Consulta el pago en MercadoPago vía `paymentApi.getPayment` y devuelve id, status, monto, método, payer. |
| `/api/payments/webhook` | POST | `app/api/payments/webhook/route.ts` | Webhook de MercadoPago: valida firma HMAC (`x-signature`, `x-request-id`, `data.id`), ignora tipos ≠ `payment`, y en `approved` crea la reserva confirmada (idempotente por `mp_payment_id`); ante `DATE_CONFLICT` guarda `pending` para revisión; envía email solo si quedó confirmada. Siempre 200 en pagos procesados para evitar reintentos infinitos. |
| `/api/payments/webhook` | GET | `app/api/payments/webhook/route.ts` | Healthcheck: estado del endpoint y si la validación de firma está habilitada. |

---

## Server Actions

Todas las actions del panel llaman `requireAdmin()` primero, validan con zod y devuelven `ActionResult = { ok: true } | { ok: false; error: string }` (o variantes), y revalidan las rutas afectadas con `revalidatePath`.

| Name | File | Description |
|------|------|-------------|
| `createCabinAction(input)` | `app/admin/(panel)/cabanas/actions.ts` | Crea una cabaña borrador (oculta) con `{ name, slug }`; devuelve `{ ok, slug }` o error "slug duplicado". |
| `updateCabinAction(id, form)` | `app/admin/(panel)/cabanas/actions.ts` | Actualiza contenido/precios de una cabaña (`id` = uuid) a partir de `FormData` parseado con `parseCabinForm`. Revalida `/`, `/cabanas`, `/cabanas/[slug]`, `/admin/cabanas`. |
| `uploadImageAction(form)` | `app/admin/(panel)/cabanas/actions.ts` | Sube `file` al bucket `images` bajo `cabins/{slug}/`; devuelve `UploadResult` con URL pública. |
| `updateAirbnbUrlAction(cabinId, url)` | `app/admin/(panel)/cabanas/actions.ts` | Setea/limpia la URL iCal de Airbnb de la cabaña (valida con `airbnbUrlSchema`). |
| `ActionResult`, `CreateCabinResult`, `UploadResult` (types) | `app/admin/(panel)/cabanas/actions.ts` | Tipos de resultado de las actions de cabañas. |
| `updateSiteSettingsAction(input)` | `app/admin/(panel)/configuracion/actions.ts` | Valida con `siteSettingsSchema` y actualiza `site_settings`; revalida todo el layout público. |
| `updateSiteContentAction(key, value)` | `app/admin/(panel)/contenido/actions.ts` | Guarda un bloque de `site_content` (`hero`, `services`, `cta`, `cabins_teaser`, `seo`) validado con `siteContentSchemaFor`. |
| `upsertFaqAction(input)` | `app/admin/(panel)/contenido/actions.ts` | Crea/actualiza una FAQ. |
| `deleteFaqAction(id)` | `app/admin/(panel)/contenido/actions.ts` | Elimina una FAQ por uuid. |
| `upsertReviewAction(input)` | `app/admin/(panel)/contenido/actions.ts` | Crea/actualiza una reseña (rating 1-5). |
| `deleteReviewAction(id)` | `app/admin/(panel)/contenido/actions.ts` | Elimina una reseña por uuid. |
| `upsertGalleryItemAction(input)` | `app/admin/(panel)/contenido/actions.ts` | Crea/actualiza un ítem de galería (`span` ∈ `col-span-1 row-span-2` \| `col-span-2 row-span-2`). |
| `deleteGalleryItemAction(id)` | `app/admin/(panel)/contenido/actions.ts` | Elimina un ítem de galería por uuid. |
| `uploadGalleryImageAction(form)` | `app/admin/(panel)/contenido/actions.ts` | Sube una imagen al bucket `images` bajo `gallery/`. |
| `reorderFaqsAction(ids)` | `app/admin/(panel)/contenido/actions.ts` | Reordena FAQs (1-500 uuids) vía RPC `admin_reorder`. |
| `reorderReviewsAction(ids)` | `app/admin/(panel)/contenido/actions.ts` | Reordena reseñas vía RPC `admin_reorder`. |
| `reorderGalleryAction(ids)` | `app/admin/(panel)/contenido/actions.ts` | Reordena la galería vía RPC `admin_reorder`. |
| `confirmReservationAction(id)` | `app/admin/(panel)/reservas/actions.ts` | Pasa una reserva a `confirmed`; traduce `DATE_CONFLICT` a mensaje legible. |
| `cancelReservationAction(id)` | `app/admin/(panel)/reservas/actions.ts` | Pasa una reserva a `cancelled`. |
| `createManualReservationAction(form)` | `app/admin/(panel)/reservas/actions.ts` | Crea reserva manual (`mode='manual'`, `confirmed`) o bloqueo de fechas (`mode='blocked'`) con código `CAL-…`; valida fechas y nombre del huésped. |
| `syncAirbnbNowAction()` | `app/admin/(panel)/reservas/actions.ts` | Ejecuta `runAirbnbSync()` a demanda y devuelve `{ ok, summary }` con `summarizeSync`. |
| `processReservationPaymentDirect(paymentData)` | `lib/actions/payment-actions.ts` | Único entrypoint de reserva desde la web: gatea `bookingsEnabled`, recalcula el precio en el servidor (ignora el monto del cliente), revalida disponibilidad y redirige al checkout de MP. Redirige a `/reserva-fallida?error=…` en fallos. |
| `uploadImageToBucket(file, dirPrefix)` | `lib/actions/upload.ts` | Helper server-only compartido: valida mime (jpeg/png/webp) y tamaño (≤5 MB), sube a Storage `images/{dirPrefix}/{ts}-{nombre}` y devuelve URL pública. El caller debe haber llamado `requireAdmin()`. |
| `sanitizeFileName(name)` | `lib/actions/upload.ts` | Normaliza un nombre de archivo a minúsculas/`[a-z0-9.]` con guiones. |
| `UploadResult` (type) | `lib/actions/upload.ts` | `{ ok: true; url } \| { ok: false; error }`. |

---

## DB access (`lib/db/*.ts`, server-only, cliente service_role)

| Name | File | Description |
|------|------|-------------|
| `CabinRow` (type) | `lib/db/cabins.ts` | Fila snake_case de la tabla `cabins`. |
| `rowToCabin(row)` | `lib/db/cabins.ts` | Mapper puro `CabinRow → Cabin` (`documentId` = uuid, `id` = `sort_order`, ids sintéticos en features/overrides). |
| `getCabins()` | `lib/db/cabins.ts` | Cabañas publicadas ordenadas por `sort_order`. |
| `getCabinBySlug(slug)` | `lib/db/cabins.ts` | Cabaña publicada por slug o `null`. |
| `getAllCabinsAdmin()` | `lib/db/cabins.ts` | (admin) Todas las cabañas, incluidas no publicadas. |
| `getCabinForAdmin(slug)` | `lib/db/cabins.ts` | (admin) Cabaña por slug sin filtrar `is_published`. |
| `getAirbnbIcalUrl(cabinId)` | `lib/db/cabins.ts` | (admin) URL iCal de Airbnb de la cabaña (uuid) o `''`. |
| `updateCabin(id, patch)` | `lib/db/cabins.ts` | (admin) Actualiza campos presentes de `Partial<CabinInput>` por uuid. |
| `createCabin(slug, name)` | `lib/db/cabins.ts` | (admin) Inserta cabaña oculta con `sort_order` = max+1; devuelve `'created' \| 'duplicate'`. |
| `getAirbnbSyncConfigs()` | `lib/db/cabins.ts` | (admin) Lista `{ cabinId, cabinSlug, cabinName, icalUrl }` de cabañas con URL iCal configurada. |
| `setAirbnbIcalUrl(cabinId, url)` | `lib/db/cabins.ts` | (admin) Upsert en `cabin_sync_config`. |
| `getSiteSettings()` | `lib/db/content.ts` | Fila única de `site_settings` como `SiteSettings`. |
| `updateSiteSettings(patch)` | `lib/db/content.ts` | Actualiza campos presentes de `Partial<SiteSettings>`. |
| `getSiteContent<T>(key)` | `lib/db/content.ts` | Valor jsonb de `site_content[key]` o `null`. |
| `setSiteContent<T>(key, value)` | `lib/db/content.ts` | Upsert de un bloque de `site_content`. |
| `getFaqs(all = false)` | `lib/db/content.ts` | FAQs ordenadas; `all=true` incluye no publicadas. |
| `upsertFaq(faq)` | `lib/db/content.ts` | Upsert de FAQ; devuelve la fila mapeada. |
| `deleteFaq(id)` | `lib/db/content.ts` | Elimina FAQ. |
| `getReviews(all = false)` | `lib/db/content.ts` | Reseñas ordenadas; `all=true` incluye no publicadas. |
| `upsertReview(review)` | `lib/db/content.ts` | Upsert de reseña. |
| `deleteReview(id)` | `lib/db/content.ts` | Elimina reseña. |
| `getGalleryItems(all = false)` | `lib/db/content.ts` | Ítems de galería ordenados; `all=true` incluye no publicados. |
| `upsertGalleryItem(item)` | `lib/db/content.ts` | Upsert de ítem de galería. |
| `deleteGalleryItem(id)` | `lib/db/content.ts` | Elimina ítem de galería. |
| `ReorderableTable` (type) | `lib/db/content.ts` | `'faqs' \| 'reviews' \| 'gallery_items'`. |
| `reorderContent(table, ids)` | `lib/db/content.ts` | Llama RPC `admin_reorder` para renumerar `sort_order` en un solo UPDATE. |
| `ReservationRow`, `ReservationWriteRow` (types) | `lib/db/reservations.ts` | Fila snake_case de `reservations` y su variante para INSERT/UPDATE. |
| `rowToReservation(row)` | `lib/db/reservations.ts` | Mapper puro `ReservationRow → Reservation` (fechas `new Date('YYYY-MM-DD')`, UTC). |
| `reservationToRow(input)` | `lib/db/reservations.ts` | Mapper puro `ReservationInput → ReservationWriteRow`. |
| `getReservations(filters?)` | `lib/db/reservations.ts` | (admin) Todas las reservas, filtrables por `cabinSlug` y/o `state`, orden por check-in. |
| `getPublicAvailability(cabinSlug)` | `lib/db/reservations.ts` | Rangos ocupados (`confirmed`, `blocked`, `pending`) sin PII. |
| `checkDateAvailability(cabinSlug, checkIn, checkOut)` | `lib/db/reservations.ts` | Chequeo de solapamiento; devuelve `{ isAvailable, conflictingReservations }`. |
| `getReservationByMpPaymentId(mpPaymentId)` | `lib/db/reservations.ts` | Guard de idempotencia del webhook: reserva por `mp_payment_id` o `null`. |
| `createReservation(input)` | `lib/db/reservations.ts` | Inserta reserva; traduce 23P01 → `Error('DATE_CONFLICT')` y 23505 → `Error('DUPLICATE_MP_PAYMENT')`. |
| `updateReservation(id, patch)` | `lib/db/reservations.ts` | Actualiza campos presentes; traduce 23P01 → `DATE_CONFLICT`. |
| `confirmReservation(id)` | `lib/db/reservations.ts` | `state = 'confirmed'` (puede lanzar `DATE_CONFLICT`). |
| `cancelReservation(id)` | `lib/db/reservations.ts` | `state = 'cancelled'`. |
| `generateReservationCode()` | `lib/db/reservations.ts` | `'CAL-' + 8` caracteres alfanuméricos en mayúsculas. |

---

## Utility Functions

### `lib/*.ts`

| Name | File | Description |
|------|------|-------------|
| `toDateString(date)` | `lib/airbnb-sync.ts` | `Date → 'YYYY-MM-DD'` con getters UTC. |
| `diffAirbnbEvents(existing, incoming)` | `lib/airbnb-sync.ts` | Diff puro por `externalId`: `{ toCreate, toUpdate, toCancel }`; ignora reservas no-airbnb. |
| `runAirbnbSync()` | `lib/airbnb-sync.ts` | Orquesta la sync por cabaña (fetch iCal con timeout 10 s, parse, diff, persistencia); `DATE_CONFLICT` se cuenta sin abortar. Devuelve `CabinSyncResult[]`. |
| `AirbnbDiff`, `CabinSyncResult` (types) | `lib/airbnb-sync.ts` | Resultado del diff y de la sync por cabaña. |
| `isAdminEmail(email)` | `lib/auth.ts` | `true` si el email (case-insensitive) está en `ADMIN_EMAILS`. |
| `requireAdmin()` | `lib/auth.ts` | Server: lee el usuario de Supabase; si no es admin, `redirect('/admin/login')`. Devuelve `{ email }`. |
| `sanitizeRedirect(raw, fallback)` | `lib/auth-utils.ts` | Acepta solo paths same-origin (`/x`, sin `//`, `\`, `://` ni chars de control); si no, `fallback`. |
| `parseAuthHashType(hash)` | `lib/auth-utils.ts` | Extrae `type` (`invite`/`recovery`) del hash de un callback de Supabase Auth. |
| `parseAuthHashTokens(hash)` | `lib/auth-utils.ts` | Extrae `{ access_token, refresh_token }` del hash (flujo implicit) para `setSession()`. |
| `emptyPricingGrid()` | `lib/cabin-form.ts` | Grilla de 12 filas vacías `PricingRow[]`. |
| `overridesToPricingGrid(overrides)` | `lib/cabin-form.ts` | `CabinPricingOverride[] → PricingRow[]` para inicializar el form. |
| `pricingGridToOverrides(rows)` | `lib/cabin-form.ts` | `PricingRow[] → CabinPricingOverride[]` (solo meses con algún valor numérico). |
| `parseCabinForm(raw)` | `lib/cabin-form.ts` | Valida con zod un objeto derivado de `FormData` y devuelve `{ ok, data: CabinInput } \| { ok: false, error }`. |
| `slugifyCabinName(name)` | `lib/cabin-form.ts` | Slug URL-safe sin tildes ni guiones repetidos (puede devolver `''`). |
| `airbnbUrlSchema` | `lib/cabin-form.ts` | Zod: `''` o URL `https://` con host que contenga `airbnb`. |
| `PricingRow`, `ParseResult` (types) | `lib/cabin-form.ts` | Fila de la grilla de precios y resultado de parseo. |
| `withFallback(value, fallback)` | `lib/content-fallback.ts` | Devuelve `fallback` si `value` es `null`/`undefined`/string vacío. |
| `heroSchema`, `servicesSchema`, `ctaSchema`, `cabinsTeaserSchema`, `seoSchema` | `lib/content-schemas.ts` | Schemas zod por bloque de `site_content`. |
| `siteContentSchemaFor(key)` | `lib/content-schemas.ts` | Schema zod para la key o `null` si no está permitida. |
| `HeroContent`, `ServicesContent`, `CtaContent`, `CabinsTeaserContent`, `SeoContent`, `SiteContentKey` (types) | `lib/content-schemas.ts` | Tipos inferidos de los schemas. |
| `EmailService.sendReservationConfirmation(data, options)` | `lib/email-service.ts` | Enriquece con `site_settings`, renderiza `ReservationConfirmation` y envía por Resend con tags sanitizados. |
| `EmailService.sendTestEmail(to)` | `lib/email-service.ts` | Envía un email de prueba con datos ficticios. |
| `paymentApi.createReservationPreference(data)` | `lib/mercadopago.ts` | Crea la preferencia de MP (back_urls, notification_url, metadata camelCase) y devuelve `init_point`. |
| `paymentApi.getPayment(paymentId)` | `lib/mercadopago.ts` | Obtiene y normaliza un pago como `PaymentData`. |
| `paymentApi.validateWebhookSignature(xSignature, xRequestId, dataId)` | `lib/mercadopago.ts` | Verifica HMAC-SHA256 del manifest `id:…;request-id:…;ts:…;` con `MP_WEBHOOK_SECRET`. |
| `formatCurrency(amount)` | `lib/mercadopago.ts` | Formato ARS con `Intl.NumberFormat('es-AR')`. |
| `calculateNights(checkIn, checkOut)` | `lib/mercadopago.ts` | Noches entre dos strings de fecha. |
| `resend`, `DEFAULT_FROM_EMAIL` | `lib/resend.ts` | Cliente Resend (lanza si falta `RESEND_API_KEY`) y remitente por defecto. |
| `toISODate(date)` | `lib/reservations-view.ts` | `Date → 'YYYY-MM-DD'` (UTC). |
| `toReservationView(r)` | `lib/reservations-view.ts` | `Reservation → ReservationView` serializable (fechas string). |
| `formatShortDate(iso)` | `lib/reservations-view.ts` | `'2026-03-12' → '12 mar'` sin `new Date`. |
| `formatDateRange(checkIn, checkOut)` | `lib/reservations-view.ts` | `'12 mar → 15 mar'`. |
| `reservationStats(views, monthKey)` | `lib/reservations-view.ts` | `{ confirmed, pending, thisMonth }`. |
| `sortByCheckIn(views)` | `lib/reservations-view.ts` | Copia ordenada ascendente por check-in. |
| `summarizeSync(results)` | `lib/reservations-view.ts` | Texto "N nuevas, N actualizadas, N canceladas · N cabañas con error". |
| `ReservationView`, `ReservationStats`, `SyncCount` (types) | `lib/reservations-view.ts` | Vista serializable de reserva, stats y conteo de sync. |
| `siteSettingsSchema`, `SiteSettingsPatch` | `lib/settings-schema.ts` | Zod de `site_settings` (whatsapp solo dígitos, email válido, horarios `HH:MM`). |
| `moveItem(items, from, to)` | `lib/sort-order.ts` | Mueve un elemento sin mutar; índices inválidos devuelven el original. |
| `cn(...inputs)` | `lib/utils.ts` | `twMerge(clsx(inputs))`. |
| `middleware(request)` | `middleware.ts` | Rewrite host admin → `/admin/*`, refresco de sesión Supabase, redirect a login si no hay usuario (excepto `/admin/login`, `/admin/reset`). |

### `lib/payments`, `lib/reservations`, `lib/adapters`

| Name | File | Description |
|------|------|-------------|
| `buildPreferenceMetadata(data)` | `lib/payments/metadata.ts` | `ReservationPaymentData → Record<string,string>` camelCase para la preferencia de MP. |
| `metadataToReservationInput(md, payment?)` | `lib/payments/metadata.ts` | Metadata snake_case de MP → `ReservationInput` (`confirmed`/`direct`); con `payment` completa campos de pago y `totalPrice` real. |
| `WebhookPaymentInfo` (type) | `lib/payments/metadata.ts` | `{ paymentId, transactionAmount, dateApproved?, paymentMethodId? }`. |
| `createLocalDate(dateString)` | `lib/reservations/server-price.ts` | `'YYYY-MM-DD' → Date` local (evita corrimiento UTC-3). |
| `computeServerReservationPrice(cabin, checkIn, checkOut)` | `lib/reservations/server-price.ts` | Precio autoritativo: `{ finalPrice, pricePerNight }` desde el precio base de la cabaña. |
| `ReservationPaymentAdapter.formDataToPaymentData(formData, ctx)` | `lib/adapters/reservation-payment-adapter.ts` | Form de reserva + contexto (cabaña, fechas, precio) → `ReservationPaymentData`. |
| `ReservationPaymentAdapter.validateFormDataForPayment(formData)` | `lib/adapters/reservation-payment-adapter.ts` | Devuelve lista de errores (nombre, email, huéspedes ≥ 1). |

### `utils/*.ts`

| Name | File | Description |
|------|------|-------------|
| `getCalendarMonth(year, month)` | `utils/calendar.ts` | Días del mes con relleno de semanas completas (`CalendarMonth`). |
| `convertICalToCalendarEvents(icalEvents, cabins)` | `utils/calendar.ts` | Legacy: eventos node-ical → `CalendarEvent[]` detectando cabaña/tipo. |
| `formatCalendarDate(date)` | `utils/calendar.ts` | Fecha larga en `es-AR`. |
| `isDateInRange(date, start, end)` | `utils/calendar.ts` | Inclusivo en ambos extremos (día de checkout bloqueado). |
| `getCabinAvailabilityForDate(date, cabinId, events)` | `utils/calendar.ts` | `'available' \| 'reserved' \| 'blocked' \| 'maintenance'` (prioridad maintenance > blocked > reserved). |
| `availabilityToCalendarEvents(ranges, cabinId)` | `utils/calendar.ts` | `AvailabilityRange[] → CalendarEvent[]` con título "Ocupado" y fechas locales. |
| `generateICalForCabin(reservations, cabinName)` | `utils/ical-generator.ts` | Genera `.ics` (VEVENT por reserva confirmed/blocked/pending) sin PII; fechas con getters UTC. |
| `parseAirbnbICalEvents(icalContent)` | `utils/ical-generator.ts` | Parser línea a línea de un iCal de Airbnb → `ICalEvent[]`. |
| `airbnbEventToReservation(event, cabinId)` | `utils/ical-generator.ts` | `ICalEvent → LocalReservation` (`source: 'airbnb'`, `externalId` = UID). |
| `imageUrl(path)` | `utils/image.ts` | Devuelve rutas `/x` o `http…` tal cual; prefija `/` al resto; `''` si vacío. |
| `calculatePriceWithWeekdayDiscount(pricePerNight, checkIn, checkOut, discount?)` | `utils/pricing.ts` | **Deprecated**: desglose con descuento fijo de lunes a jueves. |
| `calculatePriceForDateRange(cabin, checkIn, checkOut)` | `utils/pricing.ts` | Desglose noche a noche con overrides mensuales y descuento de semana; incluye `nightlyPrices` y `averagePricePerNight`. |
| `getMinimumPrice(cabin)` | `utils/pricing.ts` | Precio mínimo "desde" (menor override con el mayor descuento). |
| `formatPrice(price)` | `utils/pricing.ts` | ARS sin decimales. |
| `calculateDiscountPercentage(basePrice, finalPrice)` | `utils/pricing.ts` | Porcentaje redondeado de descuento. |
| `CabinIcon({ name, className, size })` | `utils/icons.tsx` | Renderiza el ícono lucide de un `CabinFeatureIcon`. |
| `getCabinFeatureIcon(name)` | `utils/icons.tsx` | Componente lucide por `CabinFeatureIcon` o `null`. |
| `Icon({ name, … })` / `getIcon(name)` | `utils/icons.tsx` | Variantes legacy por string (default export `Icon`). |
| `getPrecioParaMes(cabin, mes)` | `types/cabin.ts` | `{ precio, descuento_dia_semana }` del mes aplicando override o base. |

### `emails/`

| Name | File | Description |
|------|------|-------------|
| `formatDate(date)` | `emails/utils/emailHelpers.ts` | `"dd 'de' MMMM 'de' yyyy"` en español. |
| `formatDateShort(date)` | `emails/utils/emailHelpers.ts` | `'dd MMM yyyy'` en español. |
| `formatPrice(price)` | `emails/utils/emailHelpers.ts` | ARS sin decimales (`toLocaleString`). |
| `calculateNights(checkIn, checkOut)` | `emails/utils/emailHelpers.ts` | Noches entre dos `Date`. |
| `generateReservationCode(cabinId)` | `emails/utils/emailHelpers.ts` | `CAL-{año}-{3 letras}{timestamp36}` (no es el usado por la DB; ver `lib/db/reservations.ts`). |
| `validateEmailAddress(email)` | `emails/utils/emailHelpers.ts` | Regex simple de email. |
| `getCabinDisplayName(cabinSlug)` | `emails/utils/emailHelpers.ts` | Slug → Title Case. |
| `EmailLayout({ preview, children, contact? })` | `emails/components/EmailLayout.tsx` | Layout React Email con header/footer de marca y contacto con fallback. |
| `ReservationConfirmation({ data })` | `emails/templates/ReservationConfirmation.tsx` | Template de confirmación (cabaña, fechas, noches, total, horarios, CTA WhatsApp). |
| `ReservationConfirmationData` (type) | `emails/templates/ReservationConfirmation.tsx` | Datos del email; contacto/horarios opcionales con fallback. |
| barrel | `emails/index.ts` | Re-exporta `ReservationConfirmation`, `EmailLayout` y los helpers. |

---

## Supabase clients

| Name | File | Description |
|------|------|-------------|
| `createAdminClient()` | `lib/supabase/admin.ts` | Cliente `service_role` (`SUPABASE_SECRET_KEY`), bypasea RLS, sin persistencia de sesión. **server-only**. |
| `createBrowserSupabase()` | `lib/supabase/client.ts` | Cliente browser (`@supabase/ssr`) con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; usado en login/reset. |
| `createServerSupabase()` | `lib/supabase/server.ts` | Cliente SSR con cookies de `next/headers` (set tolerante en Server Components); usado por `requireAdmin` y logout. |
| `createServerClient` (inline) | `middleware.ts` | Cliente SSR por request para refrescar tokens y decidir el gate de `/admin/*`. |

---

## Constants

| Name | File | Description |
|------|------|-------------|
| `MONTHS` | `lib/cabin-form.ts` | Los 12 meses en español en orden (`Month[]`). |
| `FEATURE_ICONS` | `lib/cabin-form.ts` | Iconos permitidos para features de cabaña (`CabinFeatureIcon[]`). |
| `SITE_CONTENT_KEYS` | `lib/content-schemas.ts` | `['hero','services','cta','cabins_teaser','seo']`. |
| `DEFAULT_FROM_EMAIL` | `lib/resend.ts` | `RESEND_FROM_EMAIL` o `reservas@calandrias.com.ar`. |
| `AVAILABILITY_COLORS` | `utils/calendar.ts` | Colores hex por estado (available/reserved/blocked/maintenance). |
| `CABIN_FEATURE_ICONS` | `utils/icons.tsx` | Mapa `CabinFeatureIcon → LucideIcon`. |
| `ICAL_FETCH_TIMEOUT_MS` (privada) | `lib/airbnb-sync.ts` | 10 000 ms de timeout al descargar el iCal de Airbnb. |
| `MAX_IMAGE_BYTES`, `ALLOWED_MIME` (privadas) | `lib/actions/upload.ts` | 5 MB; `image/jpeg`, `image/png`, `image/webp`. |
| `GALLERY_SPANS` (privada) | `app/admin/(panel)/contenido/actions.ts` | Spans válidos de la galería bento. |
| `ADMIN_HOST_PREFIX`, `PUBLIC_ADMIN_PATHS` (privadas) | `middleware.ts` | `'admin.'`; `['/admin/login', '/admin/reset']`. |
| `NAV_ITEMS` (privada) | `components/admin/AdminShell.tsx` | Reservas, Cabañas, Contenido, Configuración. |
| `revalidate = 3600` | `app/page.tsx`, `app/cabanas/page.tsx`, `app/cabanas/[slug]/page.tsx` | ISR de 1 hora en páginas públicas. |
| cron `0 6 * * *` | `vercel.json` | Programación diaria de `/api/cron/sync-airbnb`. |

---

## Types (`types/*.ts`)

| Name | File | Description |
|------|------|-------------|
| `ApiResponse<T>`, `ReservationsApiResponse`, `CreateReservationApiResponse`, `SyncAirbnbApiResponse`, `CreateReservationRequest`, `ParseICalRequest`, `ParseICalResponse` | `types/api.ts` | Shapes de respuestas/requests de API (parcialmente legacy). |
| `Cabin` | `types/cabin.ts` | Cabaña de la app (`documentId` uuid, `id` = sort_order, image/thumbnail, features, amenities, rating, precios y overrides). |
| `CabinImage`, `CabinFeature`, `CabinAmenities`, `CabinRating`, `CabinPricingOverride` | `types/cabin.ts` | Sub-shapes de `Cabin`. |
| `CabinFeatureIcon`, `Month` | `types/cabin.ts` | Uniones literales de iconos y meses. |
| `CalendarDay`, `CabinAvailability`, `ReservationDetails`, `CalendarEvent`, `CalendarMonth`, `CalendarState`, `CabinInfo` | `types/calendar.ts` | Modelo del calendario de disponibilidad. |
| `ReservationState`, `ReservationSource` | `types/db.ts` | `'confirmed' \| 'pending' \| 'cancelled' \| 'blocked'`; `'airbnb' \| 'direct' \| 'manual'`. |
| `Reservation` | `types/db.ts` | Reserva de la app (camelCase, fechas `Date`, `cabinId` = slug, campos de pago MP). |
| `ReservationInput` | `types/db.ts` | Igual que `Reservation` sin id/timestamps y fechas `'YYYY-MM-DD'`. |
| `AvailabilityRange` | `types/db.ts` | `{ checkIn, checkOut, state }` público sin PII. |
| `CabinInput` | `types/db.ts` | Campos editables de una cabaña desde el backoffice. |
| `SiteSettings` | `types/db.ts` | Configuración global (bookingsEnabled, whatsapp, phone, email, address, checkinTime, checkoutTime). |
| `Faq`, `FaqInput`, `Review`, `ReviewInput`, `GalleryItem`, `GalleryItemInput` | `types/db.ts` | Contenido editable y sus inputs (id opcional). |
| `ICalRawEvent`, `ProcessedEvent` | `types/ical.ts` | Eventos iCal crudos/procesados (node-ical, legacy). |
| barrel | `types/index.ts` | Re-exporta api, cabin, calendar, ical, reservation, payment (no `db` ni `pricing`). |
| `PaymentPreference`, `PaymentItem`, `PaymentPayer`, `PaymentBackUrls`, `PaymentPreferenceBody` | `types/payment.ts` | Shapes de la preferencia de MercadoPago. |
| `ReservationPaymentData` | `types/payment.ts` | Datos de reserva que viajan al checkout (`cabinId` = slug, `totalAmount`, `pricePerNight?`). |
| `PaymentStatus`, `PaymentNotification`, `PaymentData` | `types/payment.ts` | Estado de pago, notificación de webhook y pago normalizado. |
| `PricingBreakdown`, `PricingDisplayProps` | `types/pricing.ts` | Desglose de precio (noches, descuentos, total). |
| `LocalReservation` | `types/reservation.ts` | Reserva legacy con `documentId` (usada por el generador iCal y el parser de Airbnb). |
| `ICalEvent` | `types/reservation.ts` | Evento parseado del iCal de Airbnb. |
| `ReservationFormData`, `ReservationSummary`, `ReservationStep` | `types/reservation.ts` | Formulario de reserva, resumen y pasos del flujo. |

---

## Components

### `components/*.tsx`

| Name | File | Description |
|------|------|-------------|
| `BentoGridGallery({ items })` | `components/BentoGridGallery.tsx` | Client. Grilla bento de `GalleryItem[]` con "ver más" (8 iniciales); safelist de spans. |
| `CabinCalendarSection({ cabin, bookingsEnabled, whatsapp })` | `components/CabinCalendarSection.tsx` | Client (default). Orquesta calendario → rango → formulario → `processReservationPaymentDirect`; muestra precio con `calculatePriceForDateRange`; CTA WhatsApp si reservas apagadas. |
| `CabinsShowcase({ cabins, bookingsEnabled, whatsapp })` | `components/CabinsShowcase.tsx` | Client. Cards de cabañas con rating, capacidad, precio "desde" y CTA. |
| `CabinsTeaser({ content })` | `components/CabinsTeaser.tsx` | Server. Teaser de la home con stats y features desde `CabinsTeaserContent`. |
| `GoogleAnalytics({ trackingId? })`, `GoogleTagManager({ gtmId? })` | `components/GoogleAnalytics.tsx` | Scripts de GA4 / GTM (env `NEXT_PUBLIC_GA_TRACKING_ID`, `NEXT_PUBLIC_GTM_ID`). |
| `trackEvent({ action, category?, label?, value?, customParams? })` | `components/GoogleAnalytics.tsx` | Envía evento a `gtag` si está disponible. |
| `trackCabinEvent` | `components/GoogleAnalytics.tsx` | Helpers: `viewCabin`, `startReservation`, `completeReservation`, `viewGallery`, `contactClick`. |
| `Header()` | `components/Header.tsx` | Server. Header sticky con nav desktop y Sheet móvil (Inicio, Cabañas, Servicios, Contacto, Reservar). |
| `LocationMap({ mapUrl?, whatsapp?, phone?, email? })` | `components/LocationMap.tsx` | Client. Sección ubicación con mapa embebido y botones de contacto. |
| `ReservationForm({ onSubmit, onCalendarRefresh?, isLoading?, maxGuests? })` | `components/ReservationForm.tsx` | Client (default). Formulario de huésped (`ReservationFormData`) con alertas de conflicto. |
| `ReserveButton()` | `components/ReserveButton.tsx` | Client. Scroll suave a `#calendar-section`. |
| `ReviewsCarousel({ reviews })` | `components/ReviewsCarousel.tsx` | Client. Carrusel infinito de `Review[]` que pausa al hover. |
| `LocalBusinessSchema(...)`, `HotelSchema(...)`, `ReviewsSchema({ reviews? })` | `components/SchemaMarkup.tsx` | JSON-LD de negocio local, hotel (por cabaña) y reseñas, con fallbacks hardcodeados. |
| `PaymentInfo()` | `app/reserva-confirmada/PaymentInfo.tsx` | Client (default). Muestra datos del pago desde query params y `/api/payments/status`. |

### `components/admin/*.tsx` (todos client)

| Name | File | Description |
|------|------|-------------|
| `AdminShell({ email, children })` | `components/admin/AdminShell.tsx` | Layout del panel: sidebar fijo desktop, Sheet móvil, nav activa por pathname, form de logout a `/api/admin/logout`. |
| `CabinForm({ cabin, airbnbUrl, siteUrl })` | `components/admin/CabinForm.tsx` | Editor de cabaña con tabs (Información, Fotos, Precios, Airbnb); usa `updateCabinAction`, `updateAirbnbUrlAction`, `ImageUploadField`, `PricingGrid`. |
| `ConfiguracionForm({ settings })` | `components/admin/ConfiguracionForm.tsx` | Form de `SiteSettings` → `updateSiteSettingsAction`. |
| `ContenidoTabs({ hero, services, cta, cabinsTeaser, seo, faqs, reviews, gallery })` | `components/admin/ContenidoTabs.tsx` | Tabs Textos/FAQs/Reseñas/Galería; define los `CrudField` de cada lista y conecta las actions de contenido. |
| `ImageUploadField({ label, slug, value, onChange })` | `components/admin/ImageUploadField.tsx` | Preview + subida a Storage vía `uploadImageAction`. |
| `NewCabinDialog()` | `components/admin/NewCabinDialog.tsx` | Diálogo de alta: nombre + slug (`slugifyCabinName`) → `createCabinAction` → redirige al editor. |
| `PricingGrid({ rows, basePrice, baseDiscount, onChange })` | `components/admin/PricingGrid.tsx` | Grilla de 12 meses de precio/descuento con placeholders del valor base. |
| `ReservationFormDialog({ cabins })` | `components/admin/ReservationFormDialog.tsx` | Diálogo "Nueva reserva / Bloquear fechas" → `createManualReservationAction`. |
| `ReservationsTable({ reservations, cabins, stats })` | `components/admin/ReservationsTable.tsx` | Tabla con filtros por cabaña/estado, StatCards, badges, confirmar/cancelar (con diálogo) y "Sincronizar Airbnb". |
| `SiteTextsEditor({ hero, services, cta, cabinsTeaser, seo })` | `components/admin/SiteTextsEditor.tsx` | Cards editables por sección → `updateSiteContentAction`. |
| `SortableCrudList(...)` | `components/admin/SortableCrudList.tsx` | Lista CRUD genérica: campos configurables (`text`, `textarea`, `number`, `select`, `image`), drag & drop con `moveItem`, toggle de publicación, reorden en una sola operación. |
| `CrudField`, `CrudItem`, `CrudFieldControl` (types) | `components/admin/SortableCrudList.tsx` | Configuración de campos e ítems de la lista CRUD. |

### `components/calendar/*.tsx` (client)

| Name | File | Description |
|------|------|-------------|
| `CabinAvailabilityCalendar({ cabinId, events, selectedRange, onRangeChange })` | `components/calendar/CabinAvailabilityCalendar.tsx` | Calendario mensual con navegación, estados por día (`getCabinAvailabilityForDate`) y selección de rango. |
| `DateRange` (type) | `components/calendar/CabinAvailabilityCalendar.tsx` | `{ from: Date \| null; to: Date \| null }`. |
| `SelectedDateRange({ selectedRange })` | `components/calendar/SelectedDateRange.tsx` | Muestra el rango elegido y la cantidad de noches. |

### `components/ui/`

| Name | File | Description |
|------|------|-------------|
| shadcn primitives | `components/ui/*.tsx` | Primitivas shadcn/ui (new-york, stone): `accordion`, `alert`, `badge`, `button` (incluye variant `wood`), `card`, `dialog`, `form`, `input`, `label`, `select`, `sheet`, `textarea`. |

---

## DB functions / migrations (`supabase/`)

| Name | File | Description |
|------|------|-------------|
| enums `reservation_state`, `reservation_source` | `supabase/migrations/0001_initial_schema.sql` | `pending\|confirmed\|cancelled\|blocked`; `direct\|airbnb\|manual`. |
| tabla `cabins` | `supabase/migrations/0001_initial_schema.sql` | Cabañas con jsonb (features, highlights, amenities, nearby_attractions, overrides_mensuales), precios, `is_published`, `sort_order`. |
| tabla `cabin_sync_config` | `supabase/migrations/0001_initial_schema.sql` | URL iCal de Airbnb por cabaña (tabla aparte, nunca legible por anon). |
| tabla `reservations` | `supabase/migrations/0001_initial_schema.sql` | Reservas con campos de pago MP; constraint `valid_dates` y **`no_overlap`** (EXCLUDE gist por `cabin_slug` + `daterange` para confirmed/blocked); índices `uq_reservations_airbnb` y `idx_reservations_cabin_dates`. |
| tablas `faqs`, `reviews`, `gallery_items` | `supabase/migrations/0001_initial_schema.sql` | Contenido editable con `sort_order` e `is_published`. |
| tabla `site_content` | `supabase/migrations/0001_initial_schema.sql` | Bloques key → jsonb (`hero`, `services`, `cta`, `cabins_teaser`, `seo`). |
| tabla `site_settings` | `supabase/migrations/0001_initial_schema.sql` | Fila única (`id = true`): bookings_enabled, contacto, horarios. |
| función `set_updated_at()` + triggers `trg_<tabla>_updated_at` | `supabase/migrations/0001_initial_schema.sql` | Actualiza `updated_at` en cada UPDATE de todas las tablas. |
| RLS + policies de lectura pública | `supabase/migrations/0002_rls.sql` | RLS habilitado en todo; SELECT para anon/authenticated solo de contenido publicado, `site_content` y `site_settings`; `reservations` y `cabin_sync_config` sin policies (solo service_role). |
| bucket `images` + policy `public read images` | `supabase/migrations/0002_rls.sql` | Bucket público de solo lectura; escritura solo por service_role. |
| índice `uq_reservations_mp_payment_id` | `supabase/migrations/0003_mp_payment_unique.sql` | Único parcial sobre `mp_payment_id` (no nulo): backstop de idempotencia del webhook (23505 → `DUPLICATE_MP_PAYMENT`). |
| RPC `admin_reorder(p_table text, p_ids uuid[])` | `supabase/migrations/0004_admin_reorder.sql` | `security definer`; renumera `sort_order` = posición 1-based en un único UPDATE para `faqs`/`reviews`/`gallery_items`; EXECUTE solo para `service_role`. Invocada por `reorderContent`. |
| seed | `supabase/seed.sql` | Datos iniciales: 3 cabañas (`retiro-exclusivo`, `confort-familiar`, `experiencia-premium`), FAQs, reseñas, galería, site_content y site_settings. |

---

## dbm (better-auth / drizzle / S3) — rehearsal, aún sin uso en la app

| Name | File | Description |
|------|------|-------------|
| `auth` | `lib/better-auth.ts` | Instancia de better-auth (drizzle adapter, email+password, sesiones 7 días, rate limit en DB, ids uuid). |
| `GET`/`POST` `/api/auth/*` | `app/api/auth/[...all]/route.ts` | Handler Next.js de better-auth (`toNextJsHandler(auth)`). |
| `authClient` | `lib/auth-client.ts` | Cliente better-auth para el browser. |
| `db`, `client` | `lib/db.ts` | Drizzle sobre postgres.js (`DATABASE_URL`, pool max 10, TLS verify-full). |
| `lib/schema.ts` | `lib/schema.ts` | Schema drizzle de la app (vacío; tablas importadas todavía sin modelar). |
| `lib/auth-schema.ts` | `lib/auth-schema.ts` | Tablas `user`, `session`, `account`, `verification`, `rate_limit` (generado). |
| helpers S3 | `lib/s3.ts` | Cliente S3 y URLs presignadas (`S3_*`); los objetos de Supabase quedaron bajo el prefijo `images/`. |
| scripts | `package.json` | `pnpm auth:schema`, `pnpm db:push`, `pnpm db:generate`, `pnpm db:migrate`. |
