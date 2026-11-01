import { OpenAPIHono } from '@hono/zod-openapi'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── Load environment-specific CSP origins ────────────────────────────

type CspOrigins = Record<string, string[]>

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const commons: CspOrigins = JSON.parse(readFileSync(resolve(process.cwd(), 'config/csp-commons.json'), 'utf-8'))
const envOverrides: CspOrigins = JSON.parse(readFileSync(resolve(process.cwd(), `config/csp-${env}.json`), 'utf-8'))

// Layer: commons first, env-specific arrays appended per key
const origins: CspOrigins = { ...commons }
for (const [key, values] of Object.entries(envOverrides)) {
    origins[key] = [...(origins[key] || []), ...values]
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Build frame-ancestors from CORS_ORIGINS so the frontend
 * (dev localhost or production domain) can always iframe server pages.
 */
function buildFrameAncestors(): string[] {
    const ancestors = new Set<string>(["'self'"])
    const raw = process.env.CORS_ORIGINS || ''
    for (const origin of raw.split(',').map(o => o.trim()).filter(Boolean)) {
        if (origin !== '*') ancestors.add(origin)
    }
    for (const dev of origins.devOrigins || []) ancestors.add(dev)
    return [...ancestors]
}

/** Strips frame-ancestors for iframeable routes (embeds) */
const relaxFrameAncestors = async (c: any, next: any) => {
    await next()
    c.res.headers.delete('X-Frame-Options')
    const csp = c.res.headers.get('Content-Security-Policy')
    if (csp) {
        c.res.headers.set('Content-Security-Policy', csp.replace(/frame-ancestors [^;]+/, "frame-ancestors *"))
    }
}

/** Email previews: relax frame-ancestors AND img-src (templates load arbitrary external images) */
const relaxEmailPreviewCsp = async (c: any, next: any) => {
    await next()
    c.res.headers.delete('X-Frame-Options')
    const csp = c.res.headers.get('Content-Security-Policy')
    if (csp) {
        c.res.headers.set('Content-Security-Policy',
            csp
                .replace(/frame-ancestors [^;]+/, "frame-ancestors *")
                .replace(/img-src [^;]+/, "img-src 'self' data: blob: https:")
        )
    }
}

// ─── Register ─────────────────────────────────────────────────────────

/**
 * Register all CSP / secure-header middleware on the app.
 * Call once during bootstrap, after compression and before route registration.
 */
export function setup(app: OpenAPIHono) {
    // ─── CORS ─────────────────────────────────────────────────────────────
    const CORS_ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '*').split(',').map(o => o.trim());
    for (const devOrigin of ['http://localhost:8080', 'http://localhost:5173']) {
        if (!CORS_ALLOWED_ORIGINS.includes(devOrigin)) CORS_ALLOWED_ORIGINS.push(devOrigin);
    }
    const corsIsWildcard = CORS_ALLOWED_ORIGINS.length === 1 && CORS_ALLOWED_ORIGINS[0] === '*';

    app.use('/*', cors({
        origin: corsIsWildcard
            ? '*'
            : (origin) => CORS_ALLOWED_ORIGINS.includes(origin) ? origin : null,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-stainless-os', 'x-stainless-lang', 'x-stainless-arch', 'x-stainless-package-version', 'x-stainless-runtime', 'x-stainless-runtime-version', 'x-stainless-helper-method', 'x-stainless-retry-count', 'HTTP-Referer', 'X-Title'],
        exposeHeaders: ['Content-Length', 'X-Cache'],
        maxAge: 600,
        credentials: !corsIsWildcard,
    }))

    const frameAncestors = buildFrameAncestors()

    // Safe accessor — keys not present in either file resolve to []
    const o = (key: string) => origins[key] || []

    app.use(secureHeaders({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
        strictTransportSecurity: 'max-age=31536000; includeSubDomains',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
            camera: [],
            microphone: [],
            geolocation: [],
            payment: ['self'],
        },
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", ...o('scripts'), ...o('cdn'), ...o('analytics'), ...o('googleapis')],
            styleSrc: ["'self'", "'unsafe-inline'", "*", ...o('fonts'), ...o('cdn'), ...o('googleapis')],
            fontSrc: ["'self'", ...o('fonts'), ...o('cdn'), ...o('googleapis')],
            imgSrc: ["'self'", "data:", "blob:", "https:", ...o('supabase'), ...o('polymech'), ...o('googleapis'), ...o('openstreetmap'), ...o('carto')],
            connectSrc: ["'self'", "data:", "blob:", ...o('supabase'), ...o('polymech'), ...o('cdn'), ...o('ai'), ...o('analytics'), ...o('apiDocs'), ...o('googleapis'), ...o('maptiler'), ...o('geo'), ...o('openstreetmap'), ...o('carto')],
            workerSrc: ["'self'", "blob:"],
            mediaSrc: ["'self'", "blob:", ...o('supabase'), ...o('polymech'), ...o('video')],
            frameSrc: ["'self'", "*"],
            frameAncestors,
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
        }
    }))

    // Embed routes must be iframeable from anywhere
    app.use('/embed/*', relaxFrameAncestors)

    // Email preview routes — loaded in an iframe, also need relaxed img-src
    app.use('/user/*/pages/*/email-preview', relaxEmailPreviewCsp)
    app.use('/org/*/user/*/pages/*/email-preview', relaxEmailPreviewCsp)
}
