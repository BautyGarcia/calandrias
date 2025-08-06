import { Html, Head, Font, Preview, Tailwind, Body, Container, Section } from '@react-email/components'

interface EmailLayoutProps {
    preview: string
    children: React.ReactNode
}

export default function EmailLayout({ preview, children }: EmailLayoutProps) {
    return (
        <Html>
            <Head>
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="Arial"
                    webFont={{
                        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>{preview}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                'beige-arena': '#C2B280',
                                'brown-earth': '#8D4925',
                                'green-moss': '#3F6C29',
                                'slate-gray': '#44525F',
                                'soft-cream': '#E6D8B8',
                                'light-sand': '#F5E8D3',
                                'dark-wood': '#5A3825',
                                'forest-green': '#2D5C27',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-soft-cream font-sans text-brown-earth">
                    <Container className="mx-auto my-8 max-w-2xl bg-white border border-beige-arena/30 rounded-lg shadow-sm">
                        {/* Header */}
                        <Section className="bg-light-sand p-6 text-center border-b border-beige-arena/30">
                            {/* Logo SVG */}
                            <div className="mb-2">
                                <svg width="60" height="60" viewBox="0 0 700 700" className="mx-auto" fill="#8D4925">
                                    <g transform="translate(0.000000,700.000000) scale(0.100000,-0.100000)">
                                        <path d="M197 6230 c-100 -26 -133 -69 -123 -161 12 -123 128 -423 253 -659 498 -939 1332 -1994 1999 -2528 215 -172 494 -342 563 -342 40 0 80 37 87 80 8 49 -21 82 -109 127 -367 184 -853 628 -1346 1226 -328 399 -663 883 -911 1315 -148 258 -310 611 -335 731 l-7 34 163 -6 c484 -18 1209 -197 1854 -457 163 -66 492 -225 650 -314 163 -93 407 -256 540 -362 200 -160 544 -515 531 -549 -2 -7 -34 -53 -70 -102 -243 -332 -437 -754 -513 -1113 -23 -106 -27 -150 -27 -295 -1 -195 10 -251 73 -380 70 -141 186 -234 343 -274 360 -92 708 47 852 340 61 124 86 225 93 374 12 251 -44 509 -181 844 -62 152 -170 361 -255 496 l-69 110 60 67 c266 301 576 512 883 603 122 37 311 46 418 20 92 -22 221 -82 304 -141 82 -59 200 -177 259 -260 25 -36 53 -68 63 -73 9 -5 76 -19 149 -32 72 -12 132 -25 132 -28 -1 -3 -26 -22 -57 -41 -75 -47 -189 -160 -241 -240 -97 -148 -160 -311 -257 -675 -130 -484 -181 -633 -301 -875 -95 -190 -162 -300 -279 -455 -178 -235 -373 -429 -621 -616 -760 -572 -1707 -781 -2709 -599 -60 11 -186 38 -280 60 -103 24 -181 38 -197 34 -63 -13 -89 -99 -45 -149 18 -21 49 -32 187 -65 203 -48 391 -83 575 -107 175 -22 691 -25 855 -5 618 77 1106 256 1594 586 604 407 1033 965 1256 1634 27 81 82 273 124 427 150 557 218 706 393 849 69 58 190 122 283 151 82 25 98 35 115 72 22 46 13 95 -24 125 -24 20 -67 31 -282 68 l-254 44 -40 45 c-177 200 -289 293 -450 372 -154 76 -229 93 -415 93 -177 0 -268 -17 -436 -79 -256 -95 -550 -302 -783 -552 l-94 -100 -50 61 c-87 106 -347 359 -472 458 -591 469 -1359 824 -2265 1048 -194 48 -475 102 -650 125 -148 20 -449 28 -503 15z m3989 -2117 c70 -123 205 -409 248 -524 87 -235 117 -374 123 -574 6 -190 -7 -269 -63 -381 -66 -134 -178 -221 -334 -260 -77 -20 -235 -15 -315 10 -113 35 -195 116 -237 236 -20 58 -23 84 -23 230 0 174 10 240 61 417 75 261 245 605 421 856 30 42 58 77 62 77 4 0 30 -39 57 -87z"/>
                                    </g>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-brown-earth font-serif m-0">
                                Las Calandrias
                            </h1>
                            <p className="text-slate-gray text-sm m-1 font-medium">
                                Cabañas de montaña · Tandil, Argentina
                            </p>
                        </Section>

                        {/* Content */}
                        <Section className="p-8">
                            {children}
                        </Section>

                        {/* Footer */}
                        <Section className="bg-light-sand p-6 text-center border-t border-beige-arena/30 text-sm text-slate-gray">
                            <p className="m-2">
                                <strong>Las Calandrias</strong><br />
                                Ruta Provincial 30, Km 8, Tandil, Buenos Aires<br />
                                WhatsApp: +54 9 2494 027920 · Email: Lascalandrias123@gmail.com
                            </p>
                            <div className="mt-4 pt-4 border-t border-beige-arena/30">
                                <p className="text-xs text-slate-gray/70 m-0">
                                    © 2025 Las Calandrias. Todos los derechos reservados.
                                </p>
                            </div>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
} 