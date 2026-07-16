# Flujo de invitación de admins — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un admin invitado desde el dashboard de Supabase reciba un mail brandeado cuyo link lo lleve a una página de "crear contraseña" funcional, en vez de aterrizar en la landing con un token en el hash.

**Architecture:** Sin flujo nuevo: se reusa `/admin/reset` (ya captura la sesión del hash vía `detectSessionInUrl` y setea contraseña con `updateUser`). Se agrega un helper puro que lee el `type` del hash para adaptar la copy (invite vs recovery), se brandean los templates de mail de Supabase Auth (invite + recovery) y se aplica la config del proyecto (Site URL, Redirect URLs, templates) vía Management API.

**Tech Stack:** Next.js 15 (App Router), Supabase Auth (`@supabase/ssr`), Vitest, Supabase Management API.

**Spec:** `docs/superpowers/specs/2026-07-16-admin-invite-flow-design.md`

## Global Constraints

- Proyecto Supabase: ref `vmtmgsnlmhihbycpqolo` (producción — la config de Auth que se aplica es real).
- Site URL: `https://admin.calandrias.com.ar`.
- Redirect URLs a permitir: `https://admin.calandrias.com.ar/reset` y `http://localhost:3000/admin/reset`. **Preservar** cualquier entrada existente en `uri_allow_list`.
- Link del template de invite (hardcodeado, el dashboard no permite elegir redirect):
  `https://vmtmgsnlmhihbycpqolo.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=invite&redirect_to={{ .SiteURL }}/reset`
- Link del template de recovery: `{{ .ConfirmationURL }}` (respeta el `redirectTo` que pasa la app; en dev apunta a localhost).
- El token de Management API está en `.env` como `SUPABASE_ACCESS_TOKEN`. **Nunca imprimirlo** en output.
- Mensajes de auth siempre genéricos: no revelar si un email existe.
- Paleta de marca para mails (de `emails/components/EmailLayout.tsx`): soft-cream `#E6D8B8`, light-sand `#F5E8D3`, brown-earth `#8D4925`, dark-wood `#5A3825`, beige-arena `#C2B280`, slate-gray `#44525F`.
- Comandos de test: `npx vitest run tests/auth-utils.test.ts` (suite completa: `npm run test`).
- Commits chicos por task, mensajes en el estilo del repo (`feat:`, `fix:`, `docs:`), terminando en `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Helper `parseAuthHashType` en `lib/auth-utils.ts`

**Files:**
- Modify: `lib/auth-utils.ts` (agregar función al final)
- Test: `tests/auth-utils.test.ts` (agregar `describe` al final)

**Interfaces:**
- Consumes: nada.
- Produces: `parseAuthHashType(hash: string): string | null` — recibe `window.location.hash` crudo (con `#` inicial) y devuelve el valor del parámetro `type` (`'invite'`, `'recovery'`, …) o `null` si no hay hash, no empieza con `#`, o no trae `type`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `tests/auth-utils.test.ts`:

```ts
// El import de la línea 2 pasa a ser:
// import { parseAuthHashType, sanitizeRedirect } from '@/lib/auth-utils'

describe('parseAuthHashType', () => {
    it('extrae type=invite de un hash de callback de Supabase', () => {
        expect(parseAuthHashType('#access_token=abc&expires_in=3600&type=invite')).toBe('invite')
    })

    it('extrae type=recovery', () => {
        expect(parseAuthHashType('#access_token=abc&type=recovery&token_type=bearer')).toBe('recovery')
    })

    it('devuelve null si el hash no trae type', () => {
        expect(parseAuthHashType('#access_token=abc&expires_in=3600')).toBeNull()
    })

    it('devuelve null para hash vacío', () => {
        expect(parseAuthHashType('')).toBeNull()
    })

    it('devuelve null si el string no empieza con #', () => {
        expect(parseAuthHashType('type=invite')).toBeNull()
    })

    it('devuelve null si type está vacío', () => {
        expect(parseAuthHashType('#type=&access_token=abc')).toBeNull()
    })
})
```

Nota: el archivo ya importa `describe`/`it`/`expect` de vitest y `sanitizeRedirect` de `@/lib/auth-utils`; sumar `parseAuthHashType` al import existente en vez de duplicarlo.

- [ ] **Step 2: Verificar que fallan**

Run: `npx vitest run tests/auth-utils.test.ts`
Expected: FAIL — `parseAuthHashType is not a function` (o export inexistente).

- [ ] **Step 3: Implementar el helper**

Agregar al final de `lib/auth-utils.ts`:

```ts
/**
 * Extrae el parámetro `type` del hash de un callback de Supabase Auth
 * (`#access_token=…&type=invite`). Se usa para adaptar la copy de la página
 * de reset según el flujo (invite vs recovery). Debe leerse ANTES de crear
 * el cliente browser de Supabase, que consume y limpia el hash
 * (detectSessionInUrl). Devuelve null si no hay hash válido o no trae type.
 */
export function parseAuthHashType(hash: string): string | null {
    if (!hash.startsWith('#')) return null
    return new URLSearchParams(hash.slice(1)).get('type') || null
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npx vitest run tests/auth-utils.test.ts`
Expected: PASS (todos, incluidos los de `sanitizeRedirect` preexistentes).

- [ ] **Step 5: Commit**

```bash
git add lib/auth-utils.ts tests/auth-utils.test.ts
git commit -m "feat(auth): helper parseAuthHashType para distinguir invite de recovery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Copy adaptativa en `app/admin/reset/page.tsx`

**Files:**
- Modify: `app/admin/reset/page.tsx`

**Interfaces:**
- Consumes: `parseAuthHashType(hash: string): string | null` de `@/lib/auth-utils` (Task 1).
- Produces: nada que consuman otras tasks.

- [ ] **Step 1: Modificar la página**

En `app/admin/reset/page.tsx`:

a) Agregar el import:

```ts
import { parseAuthHashType } from '@/lib/auth-utils'
```

b) Agregar estado junto a los existentes (después de `hasSession`):

```ts
// El hash se consume al crear el cliente (detectSessionInUrl); leemos el
// type antes para saber si es una invitación o un reset.
const [isInvite, setIsInvite] = useState(false)
```

c) En el `useEffect` existente, leer el hash ANTES de crear el cliente:

```ts
useEffect(() => {
    setIsInvite(parseAuthHashType(window.location.hash) === 'invite')
    // El cliente del navegador procesa el token de recuperación del hash
    // automáticamente (detectSessionInUrl). Verificamos que exista sesión.
    const supabase = createBrowserSupabase()
    supabase.auth.getSession().then(({ data }) => {
        setHasSession(!!data.session)
    })
}, [])
```

d) Copy condicional — reemplazar los textos fijos:

- Subtítulo del header (`<p className="text-[var(--slate-gray)]">`):

```tsx
{isInvite ? 'Creá tu contraseña para acceder al panel' : 'Restablecer contraseña'}
```

- `CardTitle` (dejar el ícono `Lock` como está):

```tsx
{isInvite ? 'Bienvenido/a — creá tu contraseña' : 'Nueva contraseña'}
```

- Alert de link inválido/expirado (`hasSession === false`):

```tsx
{isInvite
    ? 'El enlace de invitación no es válido o ya expiró. Pedile al administrador que te envíe una nueva invitación, o usá "¿Olvidaste tu contraseña?" en la pantalla de ingreso.'
    : <>El enlace de recuperación no es válido o ya expiró. Volvé a{' '}<a href="/admin/login" className="underline underline-offset-4">iniciar sesión</a>{' '}y solicitá uno nuevo.</>}
```

- Alert de éxito (`done`):

```tsx
{isInvite ? 'Tu contraseña fue creada.' : 'Tu contraseña fue actualizada.'} Ya podés{' '}
<a href="/admin/login" className="underline underline-offset-4">ingresar al panel</a>.
```

El resto (validaciones, submit, estados de carga) no cambia.

- [ ] **Step 2: Verificar suite y build**

Run: `npm run test && npm run build`
Expected: 114+ tests PASS, build verde sin warnings nuevos de tipos.

- [ ] **Step 3: Verificación manual de la copy**

Con el dev server corriendo (`npm run dev` si no está):

```bash
curl -s http://localhost:3000/admin/reset | grep -o "Restablecer contraseña" | head -1
```

Expected: `Restablecer contraseña` (estado inicial sin hash). La variante invite es client-side: abrir en el browser `http://localhost:3000/admin/reset#type=invite` y confirmar que el subtítulo cambia a "Creá tu contraseña para acceder al panel" y aparece el aviso de invitación inválida (no hay sesión real — es lo esperado).

- [ ] **Step 4: Commit**

```bash
git add app/admin/reset/page.tsx
git commit -m "feat(admin): copy de bienvenida en /admin/reset para flujo de invitación

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Templates de mail brandeados (invite + recovery)

**Files:**
- Create: `docs/supabase/email-templates/invite.html`
- Create: `docs/supabase/email-templates/recovery.html`

**Interfaces:**
- Consumes: nada.
- Produces: los dos archivos HTML que Task 4 sube a Supabase vía Management API. Son templates Go de Supabase Auth: usan `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .ConfirmationURL }}` — no tocar esos placeholders.

- [ ] **Step 1: Crear `docs/supabase/email-templates/invite.html`**

HTML de mail (tablas + estilos inline, sin CSS externo), paleta de marca:

```html
<!-- Template "Invite user" de Supabase Auth (Dashboard → Authentication → Emails).
     Se aplica vía Management API: ver docs/OPERACIONES.md. -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E6D8B8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #d9cdb0;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#F5E8D3;padding:24px;text-align:center;border-bottom:1px solid #d9cdb0;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#8D4925;">Las Calandrias</span>
            <div style="font-size:13px;color:#44525F;margin-top:4px;">Panel de Administración</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;color:#44525F;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;color:#5A3825;font-size:18px;font-weight:bold;">¡Bienvenido/a!</p>
            <p style="margin:0 0 24px;">Te invitaron a administrar el sitio de <strong>Las Calandrias</strong>. Para empezar, creá tu contraseña con el siguiente botón:</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background-color:#8D4925;border-radius:6px;">
                  <a href="https://vmtmgsnlmhihbycpqolo.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=invite&redirect_to={{ .SiteURL }}/reset"
                     style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                    Crear mi contraseña
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#44525F;">El enlace vence en 24 horas. Si no esperabas esta invitación, podés ignorar este mail.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F5E8D3;padding:16px 24px;text-align:center;border-top:1px solid #d9cdb0;font-size:12px;color:#44525F;">
            Las Calandrias · Cabañas en Tandil
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

- [ ] **Step 2: Crear `docs/supabase/email-templates/recovery.html`**

Misma estructura; solo cambian título, texto, botón y link (usa `{{ .ConfirmationURL }}`):

```html
<!-- Template "Reset password" de Supabase Auth (Dashboard → Authentication → Emails).
     Usa {{ .ConfirmationURL }} para respetar el redirectTo que pasa la app
     (en dev apunta a localhost). Se aplica vía Management API: ver docs/OPERACIONES.md. -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E6D8B8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #d9cdb0;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#F5E8D3;padding:24px;text-align:center;border-bottom:1px solid #d9cdb0;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#8D4925;">Las Calandrias</span>
            <div style="font-size:13px;color:#44525F;margin-top:4px;">Panel de Administración</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;color:#44525F;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;color:#5A3825;font-size:18px;font-weight:bold;">Restablecer contraseña</p>
            <p style="margin:0 0 24px;">Recibimos un pedido para restablecer la contraseña de tu cuenta. Si fuiste vos, elegí una nueva con el siguiente botón:</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background-color:#8D4925;border-radius:6px;">
                  <a href="{{ .ConfirmationURL }}"
                     style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                    Elegir nueva contraseña
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#44525F;">El enlace vence en 1 hora. Si no pediste este cambio, ignorá este mail: tu contraseña sigue siendo la misma.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F5E8D3;padding:16px 24px;text-align:center;border-top:1px solid #d9cdb0;font-size:12px;color:#44525F;">
            Las Calandrias · Cabañas en Tandil
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

- [ ] **Step 3: Verificar placeholders intactos**

```bash
grep -c '{{ .TokenHash }}' docs/supabase/email-templates/invite.html
grep -c '{{ .ConfirmationURL }}' docs/supabase/email-templates/recovery.html
grep -c 'type=invite&redirect_to={{ .SiteURL }}/reset' docs/supabase/email-templates/invite.html
```

Expected: `1` en los tres casos.

- [ ] **Step 4: Commit**

```bash
git add docs/supabase/email-templates/
git commit -m "feat(auth): templates brandeados para mails de invite y recovery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Aplicar configuración de Auth vía Management API

**Files:**
- Create: (backup temporal en scratchpad, no se commitea)
- Modify: nada en el repo — configura el proyecto Supabase `vmtmgsnlmhihbycpqolo` (producción).

**Interfaces:**
- Consumes: `docs/supabase/email-templates/invite.html` y `recovery.html` (Task 3).
- Produces: config de Auth en prod (Site URL, uri_allow_list, subjects y templates de invite/recovery).

- [ ] **Step 1: Backup de la config actual**

Desde la raíz del repo (el token NO se imprime):

```bash
TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env | cut -d= -f2-)
curl -sf -H "Authorization: Bearer $TOKEN" \
  https://api.supabase.com/v1/projects/vmtmgsnlmhihbycpqolo/config/auth \
  -o "$SCRATCHPAD/auth-config-backup.json" && echo BACKUP_OK
python3 -c "import json;c=json.load(open('$SCRATCHPAD/auth-config-backup.json'));print('site_url:',c.get('site_url'));print('uri_allow_list:',c.get('uri_allow_list'))"
```

(`$SCRATCHPAD` = el directorio scratchpad de la sesión.)
Expected: `BACKUP_OK` y los valores actuales impresos. Anotar `uri_allow_list` existente para preservarlo en el paso siguiente.

- [ ] **Step 2: Armar el payload y aplicar el PATCH**

```bash
python3 - "$SCRATCHPAD" <<'EOF'
import json, pathlib, sys
scratch = pathlib.Path(sys.argv[1])
backup = json.load(open(scratch / 'auth-config-backup.json'))
existing = [u.strip() for u in (backup.get('uri_allow_list') or '').split(',') if u.strip()]
wanted = ['https://admin.calandrias.com.ar/reset', 'http://localhost:3000/admin/reset']
allow = existing + [u for u in wanted if u not in existing]
payload = {
    'site_url': 'https://admin.calandrias.com.ar',
    'uri_allow_list': ','.join(allow),
    'mailer_subjects_invite': 'Te invitaron al panel de Las Calandrias',
    'mailer_templates_invite_content': pathlib.Path('docs/supabase/email-templates/invite.html').read_text(),
    'mailer_subjects_recovery': 'Restablecé tu contraseña - Las Calandrias',
    'mailer_templates_recovery_content': pathlib.Path('docs/supabase/email-templates/recovery.html').read_text(),
}
(scratch / 'auth-patch.json').write_text(json.dumps(payload))
print('PAYLOAD_OK, allow list:', allow)
EOF

TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env | cut -d= -f2-)
curl -sf -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$SCRATCHPAD/auth-patch.json" \
  https://api.supabase.com/v1/projects/vmtmgsnlmhihbycpqolo/config/auth \
  -o "$SCRATCHPAD/auth-patch-response.json" && echo PATCH_OK
```

Expected: `PAYLOAD_OK` con la allow list mergeada, luego `PATCH_OK`. Si el PATCH devuelve error, leer `auth-patch-response.json`, NO reintentar a ciegas, y reportar.

- [ ] **Step 3: Verificar la config aplicada**

```bash
TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env | cut -d= -f2-)
curl -sf -H "Authorization: Bearer $TOKEN" \
  https://api.supabase.com/v1/projects/vmtmgsnlmhihbycpqolo/config/auth | \
python3 -c "
import json,sys
c = json.load(sys.stdin)
assert c['site_url'] == 'https://admin.calandrias.com.ar', c['site_url']
assert 'https://admin.calandrias.com.ar/reset' in c['uri_allow_list']
assert 'http://localhost:3000/admin/reset' in c['uri_allow_list']
assert 'type=invite&redirect_to={{ .SiteURL }}/reset' in c['mailer_templates_invite_content']
assert '{{ .ConfirmationURL }}' in c['mailer_templates_recovery_content']
print('CONFIG_VERIFICADA')
"
```

Expected: `CONFIG_VERIFICADA`.

- [ ] **Step 4: Sin commit de código**

Esta task no toca el repo (el backup queda en el scratchpad). Reportar en el resumen: config aplicada + qué había antes (por si hay que revertir con el backup).

---

### Task 5: Actualizar `docs/OPERACIONES.md`

**Files:**
- Modify: `docs/OPERACIONES.md` (sección "Cómo dar de alta un administrador", ~línea 83)

**Interfaces:**
- Consumes: nada.
- Produces: nada que consuman otras tasks.

- [ ] **Step 1: Reescribir la sección de alta de admin**

Reemplazar la sección actual (desde `### Cómo dar de alta un administrador` hasta la línea `Recién con el email en la allowlist **y** el usuario existente en Supabase Auth podrá iniciar sesión en el panel.` inclusive) por:

```markdown
### Cómo dar de alta un administrador

Hacen falta **los dos pasos, en este orden** (si falta uno, la persona no entra):

1. Agregar su email a la variable **`ADMIN_EMAILS`** (lista separada por comas) en Vercel y **redesplegar**. Hacerlo primero, así la persona puede entrar apenas crea su contraseña.
2. Invitarlo desde **Supabase Dashboard → Authentication → Users → Invite user**. Le llega un mail brandeado con un botón "Crear mi contraseña" que lo lleva a `admin.calandrias.com.ar/reset`; ahí define su contraseña y ya puede ingresar al panel.

El enlace de invitación vence a las 24 horas. Si venció, se puede reenviar la invitación desde el mismo lugar del dashboard, o la persona puede usar "¿Olvidaste tu contraseña?" en la pantalla de ingreso (el usuario ya existe en Auth desde la primera invitación).

**Dónde vive esta configuración:** los templates de los mails de invitación y de recuperación están versionados en `docs/supabase/email-templates/` y aplicados a Supabase vía Management API (`PATCH /v1/projects/vmtmgsnlmhihbycpqolo/config/auth`, campos `mailer_templates_invite_content` y `mailer_templates_recovery_content`). En la misma config viven el **Site URL** (`https://admin.calandrias.com.ar`) y las **Redirect URLs** permitidas (`…/reset` de prod y `http://localhost:3000/admin/reset` para desarrollo). Si se editan los HTML, hay que volver a aplicar el PATCH.
```

- [ ] **Step 2: Verificar consistencia del documento**

```bash
grep -n "dar de alta un administrador" docs/OPERACIONES.md
grep -n "email-templates" docs/OPERACIONES.md
```

Expected: la sección nueva presente, una sola vez; sin restos de la redacción vieja (`o invitándolo`).

- [ ] **Step 3: Commit**

```bash
git add docs/OPERACIONES.md
git commit -m "docs: alta de admins con flujo de invitación brandeado

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Verificación final (post-plan)

- `npm run test && npm run build` verdes.
- Flujo recovery local end-to-end: en `http://localhost:3000/admin/login`, "¿Olvidaste tu contraseña?" con un email real de admin → el mail llega con el template nuevo → el link cae en `localhost:3000/admin/reset` y permite cambiar la contraseña.
- Flujo invite completo: se verifica en prod con una invitación real (queda para el usuario o para después del deploy — el redirect apunta a `admin.calandrias.com.ar`, que debe estar deployado con estos cambios para mostrar la copy nueva; con el deploy actual la página `/reset` vieja igual funciona, solo con copy de "restablecer").
