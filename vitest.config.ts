import { defineConfig } from 'vitest/config'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
            // Next aliasa `server-only` a un módulo vacío en contexto server;
            // replicamos eso para poder testear los mappers puros de lib/db/*.
            'server-only': path.join(path.dirname(require.resolve('server-only')), 'empty.js'),
        },
    },
    test: { include: ['tests/**/*.test.ts'] },
})
