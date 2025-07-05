export interface ICalRawEvent {
    type: string
    start?: Date
    end?: Date
    summary?: string
    description?: string
    location?: string
    organizer?: string
    uid?: string
    status?: string
    rrule?: {
        origOptions?: Record<string, unknown>
        [key: string]: unknown
    }
    exdate?: unknown
    recurrences?: unknown
    [key: string]: unknown
}

export interface ProcessedEvent {
    type: string
    start: string | null
    end: string | null
    summary?: string
    description?: string
    location?: string
    organizer?: string
    uid?: string
    status?: string
    rrule?: {
        origOptions?: Record<string, unknown>
        [key: string]: unknown
    } | null
    exdate?: unknown
    recurrences?: unknown
    [key: string]: unknown
} 