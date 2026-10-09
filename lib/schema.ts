// Schema drizzle de las tablas de la app (introspectado de la DB de dbm con
// `drizzle-kit pull` y curado a mano). Las claves de columna se mantienen en
// snake_case a propósito: los mappers de lib/db/* y sus tests trabajan con la
// fila tal como vive en Postgres.
//
// Lo que drizzle no modela y vive solo en SQL (supabase/migrations/*.sql,
// aplicado a dbm): la exclusion constraint `no_overlap` (btree_gist) de
// reservations, los triggers `set_updated_at` y la RPC `admin_reorder`.
// Las tablas de better-auth están en ./auth-schema.ts (generado).
import { sql } from 'drizzle-orm'
import {
    boolean,
    check,
    date,
    foreignKey,
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'

export const reservationState = pgEnum('reservation_state', ['pending', 'confirmed', 'cancelled', 'blocked'])
export const reservationSource = pgEnum('reservation_source', ['direct', 'airbnb', 'manual'])

// Shapes nativos de las columnas jsonb (sin los `id` sintéticos del tipo de la app).
export interface CabinFeatureJson {
    icon: string
    label: string
}
export interface CabinAmenitiesJson {
    kitchen: boolean
    air_conditioning: string
    pool_shared: boolean
}
export interface CabinOverrideJson {
    mes: string
    precio_override?: number
    descuento_dia_semana_override?: number
}

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' })
const emptyJsonArray = sql`'[]'::jsonb`

export const cabins = pgTable(
    'cabins',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        slug: text('slug').notNull(),
        name: text('name').notNull(),
        subtitle: text('subtitle').default('').notNull(),
        description: text('description').default('').notNull(),
        setting: text('setting').default('').notNull(),
        capacity: text('capacity').default('').notNull(),
        bedrooms: text('bedrooms').default('').notNull(),
        bathrooms: text('bathrooms').default('').notNull(),
        image_url: text('image_url'),
        thumbnail_url: text('thumbnail_url'),
        features: jsonb('features').$type<CabinFeatureJson[]>().default(emptyJsonArray).notNull(),
        highlights: jsonb('highlights').$type<string[]>().default(emptyJsonArray).notNull(),
        amenities: jsonb('amenities').$type<CabinAmenitiesJson>().default(sql`'{}'::jsonb`).notNull(),
        nearby_attractions: jsonb('nearby_attractions').$type<string[]>().default(emptyJsonArray).notNull(),
        rating_score: numeric('rating_score', { precision: 2, scale: 1, mode: 'number' }).default(sql`5.0`).notNull(),
        rating_review_count: integer('rating_review_count').default(0).notNull(),
        precio_base_noche: numeric('precio_base_noche', { mode: 'number' }).default(sql`0`).notNull(),
        descuento_dia_semana_default: integer('descuento_dia_semana_default').default(0).notNull(),
        overrides_mensuales: jsonb('overrides_mensuales').$type<CabinOverrideJson[]>().default(emptyJsonArray).notNull(),
        is_published: boolean('is_published').default(true).notNull(),
        sort_order: integer('sort_order').default(0).notNull(),
        created_at: timestamptz('created_at').defaultNow().notNull(),
        updated_at: timestamptz('updated_at').defaultNow().notNull(),
    },
    (t) => [unique('cabins_slug_key').on(t.slug)],
)

// URL iCal de Airbnb: tabla aparte (dato privado, nunca sale al sitio público).
export const cabinSyncConfig = pgTable(
    'cabin_sync_config',
    {
        cabin_id: uuid('cabin_id').primaryKey(),
        airbnb_ical_url: text('airbnb_ical_url').default('').notNull(),
        updated_at: timestamptz('updated_at').defaultNow().notNull(),
    },
    (t) => [
        foreignKey({ columns: [t.cabin_id], foreignColumns: [cabins.id], name: 'cabin_sync_config_cabin_id_fkey' }).onDelete('cascade'),
    ],
)

export const reservations = pgTable(
    'reservations',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        cabin_slug: text('cabin_slug').notNull(),
        check_in: date('check_in', { mode: 'string' }).notNull(),
        check_out: date('check_out', { mode: 'string' }).notNull(),
        guest_name: text('guest_name').default('').notNull(),
        guest_email: text('guest_email').default('').notNull(),
        guest_phone: text('guest_phone'),
        guests: integer('guests').default(1).notNull(),
        pets: integer('pets').default(0).notNull(),
        state: reservationState('state').default('pending').notNull(),
        source: reservationSource('source').default('direct').notNull(),
        external_id: text('external_id'),
        reservation_code: text('reservation_code'),
        total_price: numeric('total_price', { mode: 'number' }),
        currency: text('currency').default('ARS').notNull(),
        special_requests: text('special_requests'),
        mp_payment_id: text('mp_payment_id'),
        mp_preference_id: text('mp_preference_id'),
        payment_status: text('payment_status'),
        payment_method: text('payment_method'),
        paid_amount: numeric('paid_amount', { mode: 'number' }),
        payment_date: timestamptz('payment_date'),
        created_at: timestamptz('created_at').defaultNow().notNull(),
        updated_at: timestamptz('updated_at').defaultNow().notNull(),
    },
    (t) => [
        index('idx_reservations_cabin_dates')
            .on(t.cabin_slug, t.check_in, t.check_out)
            .where(sql`state <> 'cancelled'::reservation_state`),
        uniqueIndex('uq_reservations_airbnb')
            .on(t.cabin_slug, t.external_id)
            .where(sql`source = 'airbnb'::reservation_source and external_id is not null`),
        uniqueIndex('uq_reservations_mp_payment_id')
            .on(t.mp_payment_id)
            .where(sql`mp_payment_id is not null`),
        foreignKey({ columns: [t.cabin_slug], foreignColumns: [cabins.slug], name: 'reservations_cabin_slug_fkey' }).onUpdate('cascade'),
        unique('reservations_reservation_code_key').on(t.reservation_code),
        check('valid_dates', sql`check_out > check_in`),
    ],
)

export const faqs = pgTable('faqs', {
    id: uuid('id').defaultRandom().primaryKey(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    is_published: boolean('is_published').default(true).notNull(),
    updated_at: timestamptz('updated_at').defaultNow().notNull(),
})

export const reviews = pgTable(
    'reviews',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull(),
        location: text('location').default('').notNull(),
        text: text('text').notNull(),
        avatar_url: text('avatar_url'),
        rating: integer('rating').default(5).notNull(),
        sort_order: integer('sort_order').default(0).notNull(),
        is_published: boolean('is_published').default(true).notNull(),
        updated_at: timestamptz('updated_at').defaultNow().notNull(),
    },
    (t) => [check('reviews_rating_check', sql`${t.rating} >= 1 and ${t.rating} <= 5`)],
)

export const galleryItems = pgTable('gallery_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').default('').notNull(),
    description: text('description').default('').notNull(),
    image_url: text('image_url').notNull(),
    span: text('span').default('normal').notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    is_published: boolean('is_published').default(true).notNull(),
    updated_at: timestamptz('updated_at').defaultNow().notNull(),
})

// Bloques de texto de la web: un registro por sección, valor jsonb libre.
export const siteContent = pgTable('site_content', {
    key: text('key').primaryKey(),
    value: jsonb('value').$type<unknown>().default(sql`'{}'::jsonb`).notNull(),
    updated_at: timestamptz('updated_at').defaultNow().notNull(),
})

// Config global de una sola fila (id fijo = true).
export const siteSettings = pgTable(
    'site_settings',
    {
        id: boolean('id').default(true).primaryKey(),
        bookings_enabled: boolean('bookings_enabled').default(false).notNull(),
        whatsapp: text('whatsapp').default('5492494027920').notNull(),
        phone: text('phone').default('+5492494027920').notNull(),
        email: text('email').default('Lascalandrias123@gmail.com').notNull(),
        address: text('address').default('Ronca-Hue 50, B7000 Tandil, Buenos Aires').notNull(),
        checkin_time: text('checkin_time').default('15:00').notNull(),
        checkout_time: text('checkout_time').default('11:00').notNull(),
        updated_at: timestamptz('updated_at').defaultNow().notNull(),
    },
    (t) => [check('site_settings_id_check', sql`${t.id}`)],
)
