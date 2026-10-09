import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import * as authSchema from "./auth-schema"; // generated: pnpm auth:schema
import { db } from "./db";
import { isAdminEmail } from "./auth-utils";
import { sendPasswordResetEmail } from "./auth-emails";

const vercelHosts = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter((h): h is string => Boolean(h));

// El login vive en el host admin (BETTER_AUTH_URL), pero /admin/login también
// responde en el dominio principal y en localhost: los tres son orígenes válidos
// para callbacks y redirectTo.
const trustedOrigins = [
  process.env.NEXT_PUBLIC_ADMIN_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  // Explicit baseURL prevents request-derived baseURL poisoning. Production: BETTER_AUTH_URL=https://admin.calandrias.com.ar.
  // Previews: exact Vercel hosts only; never "*.vercel.app".
  baseURL: process.env.BETTER_AUTH_URL
    ? process.env.BETTER_AUTH_URL
    : vercelHosts.length
      ? { allowedHosts: vercelHosts, protocol: "https" }
      : "http://localhost:3000", // local development; dbm env leaves BETTER_AUTH_URL empty
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Reemplaza el flujo de invitación de Supabase: solo los emails de la
        // allowlist ADMIN_EMAILS pueden crear su cuenta desde /admin/login.
        before: async (user) => {
          if (!isAdminEmail(user.email)) {
            throw new APIError("FORBIDDEN", { message: "Este email no está habilitado como administrador." });
          }
          return { data: user };
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "database", // memory storage is per-instance on Vercel
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: true,
    database: { generateId: "uuid" },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
  plugins: [nextCookies()], // must be last
});
