# Operaciones — Las Calandrias

Este documento tiene dos partes:

1. **Para el desarrollador** — cómo correr, configurar y desplegar el proyecto.
2. **Manual del backoffice (para el cliente)** — cómo usar el panel de administración.

Al final hay un **checklist de deploy** para verificar entre el desarrollador y el cliente.

---

## Parte 1 — Para el desarrollador

### Arquitectura en breve

- Es **una sola aplicación Next.js 15** (App Router). No hay dos proyectos separados: el sitio público y el backoffice viven en el mismo código y el mismo deploy.
- El **ruteo por host** lo hace `middleware.ts`: los requests a `admin.calandrias.com.ar` se reescriben de forma transparente a `/admin/*`, mientras que `calandrias.com.ar` sirve el sitio público.
- Los datos viven en **Postgres en dbm** (plataforma propia; proyecto `calandrias`), accedidos con **drizzle** desde `lib/db/*`. No hay acceso anónimo a la DB ni RLS: todo pasa por código de servidor, y los filtros de publicación (`is_published`) viven en `lib/db/*`.
- La autenticación del panel es **better-auth** (`lib/better-auth.ts`, tablas `user/session/account/verification/rate_limit`). Todas las **escrituras del backoffice pasan por `requireAdmin()`** (ver `lib/auth.ts`): una única puerta de entrada, con validación `zod` en las server actions.
- Las **imágenes subidas** van al bucket S3 del proyecto (Garage, en dbm) bajo el prefijo `images/` y se sirven públicas desde `S3_PUBLIC_BASE_URL`.
- El acceso de administrador se controla con la allowlist **`ADMIN_EMAILS`**: solo esos emails pueden crear su cuenta desde la pantalla de ingreso y entrar al panel.

### Requisitos y cómo correr

El proyecto usa **pnpm** y **Node 22**.

```bash
nvm use            # toma la versión de .nvmrc (Node 22)
pnpm install
pnpm dev           # levanta el sitio en desarrollo
```

Otros comandos útiles:

```bash
pnpm build         # build de producción
pnpm lint          # ESLint
pnpm vitest run    # suite de tests
```

### Variables de entorno

Los nombres (sin valores) están en `.env.example`. Esta es la lista completa que el código lee — **ni una más, ni una menos**:

| Variable | Ámbito | Para qué |
|---|---|---|
| `DATABASE_URL` | servidor | Postgres de dbm (pooler transaccional, puerto 6432) |
| `DATABASE_URL_SESSION` | servidor | Pooler en modo sesión; solo para `drizzle-kit` (migraciones) |
| `BETTER_AUTH_SECRET` | servidor | Secreto de firmado de better-auth |
| `BETTER_AUTH_URL` | servidor | Solo producción: `https://admin.calandrias.com.ar` (en preview/local va vacío) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | servidor | Bucket S3 (Garage) del proyecto en dbm |
| `S3_PUBLIC_BASE_URL` | servidor (build) | URL pública del bucket (`https://calandrias.web.bautygarcia.com`); también habilita el host en `next.config.ts` |
| `ADMIN_EMAILS` | servidor | Emails (separados por coma) con acceso al backoffice |
| `MP_ACCESS_TOKEN` | servidor | Token de MercadoPago (crear preferencias) |
| `MP_WEBHOOK_SECRET` | servidor | Secreto para validar el webhook de MercadoPago |
| `RESEND_API_KEY` | servidor | API key de Resend (emails) |
| `RESEND_FROM_EMAIL` | servidor | Remitente de los emails (`reservas@calandrias.com.ar`) |
| `CRON_SECRET` | servidor | Protege el endpoint de cron (sync de Airbnb) |
| `NEXT_PUBLIC_SITE_URL` | público | URL del sitio público (`https://calandrias.com.ar`) |
| `NEXT_PUBLIC_ADMIN_URL` | público | URL del panel (`https://admin.calandrias.com.ar`) |
| `NEXT_PUBLIC_GA_TRACKING_ID` | público | Google Analytics (opcional) |
| `NEXT_PUBLIC_GTM_ID` | público | Google Tag Manager (opcional) |

> Las variables `NEXT_PUBLIC_*` se exponen al navegador; el resto es solo de servidor.

### Base de datos (dbm)

El proyecto vive en la plataforma **dbm** con el slug **`calandrias`** (`dbm env calandrias` imprime las variables; `dbm psql calandrias` abre una consola; `dbm backup calandrias` hace un backup off-site a demanda, además del nocturno).

- El schema de la app está en `lib/schema.ts` (drizzle) y las tablas de better-auth en `lib/auth-schema.ts` (generado con `pnpm auth:schema`).
- Lo que drizzle no modela vive en SQL y ya está aplicado en dbm: la exclusion constraint `no_overlap` (requiere `btree_gist`), los triggers `set_updated_at` y la RPC `admin_reorder`. El SQL original quedó como historial en `supabase/migrations/`.
- Para cambios de schema: editar `lib/schema.ts` y correr `pnpm db:push` (usa `DATABASE_URL_SESSION`). Revisar lo que propone antes de confirmar: drizzle-kit no conoce la constraint `no_overlap` ni los triggers.
- Migración desde Supabase (2026-10-09): datos y bucket `images` copiados con `dbm import`; el checklist cerrado está en `MIGRATION.md`.

### Cómo dar de alta un administrador

1. Agregar su email a la variable **`ADMIN_EMAILS`** (lista separada por comas) en Vercel y **redesplegar**.
2. La persona entra a **https://admin.calandrias.com.ar/login**, toca **"¿Primera vez? Creá tu cuenta"**, pone su email y una contraseña (mínimo 8 caracteres) y ya queda dentro del panel. Si el email no está en la allowlist, el alta se rechaza.

Si se olvida la contraseña: **"¿Olvidaste tu contraseña?"** en la pantalla de ingreso le manda un mail (por Resend, remitente `noreply@calandrias.com.ar`, template en `lib/auth-emails.ts`) con un enlace que vence en 1 hora y lo lleva a `admin.calandrias.com.ar/reset`.

---

## Parte 2 — Manual del backoffice (para el cliente)

El panel de administración está en **https://admin.calandrias.com.ar**. La primera vez tocá **"¿Primera vez? Creá tu cuenta"**, poné tu email (el que te habilitamos) y elegí una contraseña. Después entrás con ese email y esa contraseña. Si te olvidás la contraseña, usá "¿Olvidaste tu contraseña?" en la pantalla de ingreso y te llega un mail para elegir una nueva.

El panel tiene cuatro secciones: **Reservas**, **Cabañas**, **Contenido** y **Configuración**.

### Reservas

Es el centro de operaciones del día a día.

- **Confirmar o cancelar una reserva:** cada reserva tiene botones para confirmarla o cancelarla. Al confirmar, esas fechas quedan ocupadas y no se pueden vender de nuevo.
- **Nueva reserva manual:** cargás una reserva que entró por fuera de la web (por teléfono, WhatsApp, etc.) con los datos del huésped y las fechas. Queda registrada igual que las de la web.
- **Bloquear fechas:** si una cabaña no está disponible (mantenimiento, uso propio, etc.) marcás esas fechas como bloqueadas para que nadie pueda reservarlas.
- **Sincronizar Airbnb:** trae las reservas de Airbnb para que esas fechas también aparezcan ocupadas y evitar dobles reservas. La sincronización también corre sola una vez por día, pero podés forzarla con este botón cuando quieras.

### Cabañas

Acá administrás cada cabaña:

- **Información:** nombre, descripción, capacidad y demás datos.
- **Fotos:** subís y ordenás las imágenes de la cabaña.
- **Precios por mes:** definís el precio de cada mes (más el descuento entre semana). Es el mismo modelo de precios de siempre.
- **Link de Airbnb:** el enlace al anuncio de esa cabaña en Airbnb.

### Contenido

Los textos e imágenes del sitio público:

- **Textos:** los textos de las distintas páginas.
- **FAQs:** preguntas frecuentes (agregar, editar, borrar).
- **Reseñas:** opiniones de huéspedes que se muestran en el sitio.
- **Galería:** las fotos generales del complejo.

### Configuración

- **Aceptar reservas online (el "switch"):** este es tu control principal. Cuando está **encendido**, la web permite que los visitantes reserven y paguen online. Cuando está **apagado**, el sitio sigue mostrando las cabañas y los precios, pero **no deja reservar online** (la gente te contacta por otro medio). Usalo para pausar o reabrir las reservas sin tocar nada más. Es un interruptor: se aplica al instante.
- **Datos de contacto:** teléfono, WhatsApp, email y demás datos que aparecen en el sitio. Editalos acá y se actualizan en la web.

---

## Checklist de deploy

Para verificar entre el desarrollador y el cliente antes/después de publicar.

> **Nota sobre secretos:** por decisión del usuario, **no se rotan** los secretos de MercadoPago ni el `CRON_SECRET`; se reutilizan los existentes. La key de **Resend** es la rotada el 2026-07-16 (solo envío).

- [ ] **Variables de entorno en Vercel** cargadas exactamente con la lista de la Parte 1 (las de dbm salen de `dbm env calandrias`; `BETTER_AUTH_URL` solo en producción).
- [ ] **Sin variables muertas:** que NO estén `STRAPI_*`, `NEXT_PUBLIC_CRON_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY` ni ninguna `*SUPABASE*`.
- [ ] **Dominios activos** (DNS ya configurado): sitio en `calandrias.com.ar` y panel en `admin.calandrias.com.ar`, ambos respondiendo.
- [ ] **Webhook de MercadoPago** apuntando a `https://calandrias.com.ar/api/payments/webhook`.
- [ ] **Cron de Vercel** activo: `vercel.json` intacto (sync de Airbnb, diario a las 06:00 UTC) con `CRON_SECRET` cargado.
- [ ] **Región de Vercel** `iad1` en `vercel.json` (la más cercana al VPS de dbm).
- [ ] **Prueba real (smoke test):** hacer una reserva de prueba en **modo test** de MercadoPago →
      el webhook crea la reserva confirmada →
      llega el email de confirmación →
      la reserva aparece en el backoffice (sección Reservas).
