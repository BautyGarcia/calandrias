# Flujo de invitación de admins — diseño

**Fecha:** 2026-07-16
**Estado:** aprobado por el usuario

## Problema

Al invitar un usuario desde el dashboard de Supabase (Authentication → Users → Invite):

1. El mail sale con el template default de Supabase, sin marca y en inglés.
2. El link del mail redirige al Site URL del proyecto, que hoy aterriza en la
   landing pública con `#access_token=…&type=invite` en el hash. Ninguna página
   captura esa sesión ni ofrece setear contraseña, así que el invitado queda
   varado.
3. Aunque el invite funcionara, el invitado no puede entrar al panel sin estar
   en la allowlist `ADMIN_EMAILS` (variable de entorno → requiere redeploy).

La página `/admin/reset` ya hace exactamente lo que necesita un invitado:
captura la sesión del hash (vía `detectSessionInUrl` del cliente browser) y
permite definir una contraseña con `updateUser({ password })`. Solo falta que
el link del invite apunte ahí y que la copy contemple el caso "primera vez".

## Decisiones de alcance (del usuario)

- Los usuarios se siguen gestionando desde el **dashboard de Supabase**; no se
  construye UI de usuarios en el backoffice.
- La allowlist sigue siendo la env var `ADMIN_EMAILS` (alta manual + redeploy).
- El mail sigue saliendo por el **SMTP built-in de Supabase** (límite ~3
  mails/hora, suficiente para invitar admins). Configurar Resend como SMTP
  custom queda fuera de alcance.
- Solución elegida: **solo configuración de Supabase + retoque de
  `/admin/reset`** (se descartó un script `inviteUserByEmail` propio).

## Diseño

### 1. Configuración en el dashboard de Supabase (sin código)

- **Site URL** → `https://admin.calandrias.com.ar`.
- **Redirect URLs** (allowlist) → agregar:
  - `https://admin.calandrias.com.ar/reset`
  - `http://localhost:3000/admin/reset` (pruebas locales)
- **Template "Invite user"**: HTML brandeado (paleta/tipografía de Calandrias,
  castellano). El botón apunta a:

  ```
  https://vmtmgsnlmhihbycpqolo.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=invite&redirect_to={{ .SiteURL }}/reset
  ```

  Así el link cae siempre en la página de crear contraseña, sin depender del
  redirect default. En el host admin, `/reset` se reescribe a `/admin/reset`
  por el middleware existente.
- **Template "Reset password"**: mismo branding (hoy también sale sin
  template). Su link usa `{{ .ConfirmationURL }}` (no el patrón hardcodeado):
  el flujo "olvidaste tu contraseña" de la app ya pasa `redirectTo`
  (`NEXT_PUBLIC_ADMIN_URL/reset`, que en dev apunta a localhost) y debe
  respetarse. El hardcodeo solo es necesario en el invite, donde el dashboard
  no permite elegir redirect.

### 2. Retoque de `app/admin/reset/page.tsx` (único cambio de código)

Al montar, leer el parámetro `type` del hash de la URL **antes** de crear el
cliente de Supabase (que consume y limpia el hash). Según el valor:

- `type=invite` → título/copy de bienvenida: "Bienvenido/a, creá tu contraseña
  para acceder al panel".
- `type=recovery` o ausente → copy actual de restablecer contraseña.

El resto de la página no cambia: verificación de sesión, validaciones
(mínimo 8 caracteres, confirmación), manejo de link expirado/inválido con
salida al login, y link a `/admin/login` al terminar.

Sin cambios de middleware: `/admin/reset` ya está en `PUBLIC_ADMIN_PATHS`.

### 3. Documentación

Actualizar la sección de alta de admin en `docs/OPERACIONES.md` con el orden
correcto:

1. Agregar el email a `ADMIN_EMAILS` en Vercel y redeployar.
2. Recién entonces invitar desde el dashboard (Authentication → Users →
   Invite user).

Así el invitado puede entrar apenas define su contraseña. Documentar también
dónde viven los templates de mail y las Redirect URLs.

## Testing y verificación

- **Test unitario** de la lógica de parseo del `type` del hash (extraída a un
  helper puro para poder testearla).
- **Verificación manual local**: usar el flujo "olvidaste tu contraseña"
  (que ya redirige a `localhost:3000/admin/reset` en dev vía
  `NEXT_PUBLIC_ADMIN_URL`) para comprobar la página end-to-end.
- **Verificación del invite completo en prod**: invite real a un email propio
  tras aplicar la config del dashboard.

## Manejo de errores

Cubierto por la página actual: si el link expiró o no hay sesión de
recuperación, se muestra un aviso con link al login para pedir uno nuevo. Los
mensajes de login/reset siguen siendo genéricos (no revelan si un email
existe).

## Fuera de alcance

- UI de gestión de usuarios en el backoffice.
- Mover `ADMIN_EMAILS` a la base de datos.
- SMTP custom (Resend) para los mails de Auth.
