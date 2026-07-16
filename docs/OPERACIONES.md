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
- Los datos viven en **Supabase (Postgres)**. La RLS es **deny-by-default**: nadie lee ni escribe salvo lo explícitamente permitido.
- Todas las **escrituras del backoffice pasan por el `service_role`** detrás de `requireAdmin()` (ver `lib/auth.ts`): una única puerta de entrada auditada, con validación `zod` en las server actions. La RLS queda como segunda línea de defensa.
- El acceso de administrador se controla con la allowlist **`ADMIN_EMAILS`** más el usuario correspondiente en Supabase Auth.

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
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | público | Clave publicable de Supabase (cliente/SSR) |
| `SUPABASE_SECRET_KEY` | servidor | Clave `service_role` para escrituras del backoffice |
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

### Migraciones de base de datos

Las migraciones viven en `supabase/migrations/` (`0001_initial_schema.sql`, `0002_rls.sql`, ...).

El proyecto Supabase tiene el ref **`vmtmgsnlmhihbycpqolo`**. Para aplicarlas hay dos caminos:

**A) Supabase CLI (recomendado):**

```bash
supabase link --project-ref vmtmgsnlmhihbycpqolo
supabase db push
```

**B) Management API** (la vía usada durante la construcción del proyecto):

```
POST /v1/projects/vmtmgsnlmhihbycpqolo/database/query
```

enviando el SQL de la migración en el cuerpo. Útil cuando no hay CLI a mano.

### Cómo dar de alta un administrador

Hacen falta **los dos pasos, en este orden** (si falta uno, la persona no entra):

1. Agregar su email a la variable **`ADMIN_EMAILS`** (lista separada por comas) en Vercel y **redesplegar**. Hacerlo primero, así la persona puede entrar apenas crea su contraseña.
2. Invitarlo desde **Supabase Dashboard → Authentication → Users → Invite user**. Le llega un mail brandeado con un botón "Crear mi contraseña" que lo lleva a `admin.calandrias.com.ar/reset`; ahí define su contraseña y ya puede ingresar al panel.

El enlace de invitación vence a las 24 horas. Si venció, se puede reenviar la invitación desde el mismo lugar del dashboard, o la persona puede usar "¿Olvidaste tu contraseña?" en la pantalla de ingreso (el usuario ya existe en Auth desde la primera invitación).

**Dónde vive esta configuración:** los templates de los mails de invitación y de recuperación están versionados en `docs/supabase/email-templates/` y aplicados a Supabase vía Management API (`PATCH /v1/projects/vmtmgsnlmhihbycpqolo/config/auth`, campos `mailer_templates_invite_content` y `mailer_templates_recovery_content`). En la misma config viven el **Site URL** (`https://admin.calandrias.com.ar`), las **Redirect URLs** permitidas (`…/reset` de prod y `http://localhost:3000/admin/reset` para desarrollo) y el **SMTP custom**: los mails de Auth salen por **Resend** (`smtp.resend.com`, remitente `noreply@calandrias.com.ar`, misma API key que los mails de reservas) — necesario porque el tier free de Supabase no permite templates custom con su mailer default. Si se editan los HTML, hay que volver a aplicar el PATCH.

---

## Parte 2 — Manual del backoffice (para el cliente)

El panel de administración está en **https://admin.calandrias.com.ar**. Se ingresa con el email y la contraseña que te dimos. Si te olvidás la contraseña, usá el enlace de recuperación en la pantalla de ingreso y te llega un mail para elegir una nueva.

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

> **Nota sobre secretos:** por decisión del usuario, **no se rotan** los secretos de MercadoPago, Resend ni el `CRON_SECRET`. Se **reutilizan los existentes**.

- [ ] **Variables de entorno en Vercel** cargadas exactamente con la lista de la Parte 1:
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
      `ADMIN_EMAILS`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
      `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`,
      `NEXT_PUBLIC_GA_TRACKING_ID`, `NEXT_PUBLIC_GTM_ID`.
- [ ] **Sin variables muertas:** que NO estén `STRAPI_*`, `NEXT_PUBLIC_CRON_SECRET`, `NEXT_PUBLIC_STRAPI_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` ni `ADMIN_SECRET_KEY`.
- [ ] **Dominios activos** (DNS ya configurado): sitio en `calandrias.com.ar` y panel en `admin.calandrias.com.ar`, ambos respondiendo.
- [ ] **Webhook de MercadoPago** apuntando a `https://calandrias.com.ar/api/payments/webhook`.
- [ ] **Cron de Vercel** activo: `vercel.json` intacto (sync de Airbnb, diario a las 06:00 UTC) con `CRON_SECRET` cargado.
- [ ] **Supabase → Authentication → URL Configuration → Site URL** = `https://admin.calandrias.com.ar` (para que los mails de recuperación de contraseña apunten al panel).
- [ ] **Prueba real (smoke test):** hacer una reserva de prueba en **modo test** de MercadoPago →
      el webhook crea la reserva confirmada →
      llega el email de confirmación →
      la reserva aparece en el backoffice (sección Reservas).
