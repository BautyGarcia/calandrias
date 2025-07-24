import Script from 'next/script'

interface GoogleAnalyticsProps {
    trackingId?: string
}

interface GoogleTagManagerProps {
    gtmId?: string
}

export function GoogleAnalytics({ trackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID }: GoogleAnalyticsProps) {
    if (!trackingId || process.env.NODE_ENV !== 'production') {
        return null
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${trackingId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
            custom_map: {
              'dimension1': 'cabin_type',
              'dimension2': 'reservation_step',
              'dimension3': 'user_type'
            }
          });
        `}
            </Script>
        </>
    )
}

export function GoogleTagManager({ gtmId = process.env.NEXT_PUBLIC_GTM_ID }: GoogleTagManagerProps) {
    if (!gtmId || process.env.NODE_ENV !== 'production') {
        return null
    }

    return (
        <>
            <Script
                id="google-tag-manager"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
                }}
            />
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                />
            </noscript>
        </>
    )
}

// Hook para tracking de eventos personalizados
export function trackEvent({
    action,
    category = 'general',
    label,
    value,
    customParams = {}
}: {
    action: string
    category?: string
    label?: string
    value?: number
    customParams?: Record<string, unknown>
}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
        console.log('Analytics not available, event not tracked:', { action, category, label, value })
        return
    }

    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customParams
    })
}

// Eventos específicos para cabañas
export const trackCabinEvent = {
    viewCabin: (cabinName: string) => trackEvent({
        action: 'view_cabin',
        category: 'cabin',
        label: cabinName,
        customParams: { cabin_type: cabinName }
    }),

    startReservation: (cabinName: string) => trackEvent({
        action: 'start_reservation',
        category: 'reservation',
        label: cabinName,
        customParams: {
            cabin_type: cabinName,
            reservation_step: 'start'
        }
    }),

    completeReservation: (cabinName: string, amount: number) => trackEvent({
        action: 'complete_reservation',
        category: 'reservation',
        label: cabinName,
        value: amount,
        customParams: {
            cabin_type: cabinName,
            reservation_step: 'complete',
            currency: 'ARS'
        }
    }),

    viewGallery: () => trackEvent({
        action: 'view_gallery',
        category: 'engagement',
        label: 'photo_gallery'
    }),

    contactClick: (method: string) => trackEvent({
        action: 'contact_click',
        category: 'contact',
        label: method
    })
}

// Declaración de tipos para gtag
declare global {
    interface Window {
        dataLayer: unknown[]
        gtag: (command: string, targetId: string | Date, config?: Record<string, unknown>) => void
    }
} 