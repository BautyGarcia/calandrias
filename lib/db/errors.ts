// Extrae el SQLSTATE de un error de postgres.js, venga directo o envuelto en
// un DrizzleQueryError (drizzle guarda el error original en `cause`).
export function pgErrorCode(error: unknown): string | undefined {
    const err = error as { code?: unknown; cause?: { code?: unknown } } | null
    const code = err?.cause?.code ?? err?.code
    return typeof code === 'string' ? code : undefined
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
