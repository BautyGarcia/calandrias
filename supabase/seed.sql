-- Seed: datos existentes portados fielmente desde el código hardcodeado.
-- Fuentes: data/cabins.ts, app/page.tsx (FAQs), data/reviews.ts,
-- data/bentoGalleryItems.ts, components/CabinsTeaser.tsx, app/layout.tsx.
-- Textos largos y jsonb con dólar-quoting para evitar escaping.

-- ============ CABINS ============
insert into cabins (
    slug, name, subtitle, description, setting,
    capacity, bedrooms, bathrooms, image_url, thumbnail_url,
    features, highlights, amenities, nearby_attractions,
    rating_score, rating_review_count,
    precio_base_noche, descuento_dia_semana_default, sort_order
) values
(
    $txt$retiro-exclusivo$txt$,
    $txt$Las Calandrias de Tandil 1$txt$,
    $txt$Retiro Exclusivo$txt$,
    $txt$Cabaña entera rodeada de naturaleza en entorno tranquilo con parque compartido, fogón y zona de relax perfecta para parejas o familias pequeñas.$txt$,
    $txt$Cálida y funcional, la Cabaña 1 ofrece un espacio ideal para descansar en pareja o en familia. Cuenta con cocina equipada, ropa blanca, estufa a leña y aire acondicionado frío/calor. Rodeada de naturaleza y con acceso a un parque compartido con fogón y zona de relax. A pocos minutos del centro de Tandil, combina comodidad y tranquilidad en un entorno natural.$txt$,
    $txt$4 huéspedes$txt$,
    $txt$1 dormitorio$txt$,
    $txt$1 baño$txt$,
    $txt$/cabin4.jpg$txt$,
    $txt$/cabins/cab4/thumbnail.jpg$txt$,
    $j$[{"icon":"Mountain","label":"Vista a las sierras"},{"icon":"Waves","label":"Pileta compartida"},{"icon":"Flame","label":"Fogón"},{"icon":"Car","label":"Estacionamiento"},{"icon":"Wifi","label":"WiFi gratuito"},{"icon":"ChefHat","label":"Cocina equipada"},{"icon":"TreePine","label":"Parque y jardín"},{"icon":"Utensils","label":"Parrilla"}]$j$::jsonb,
    $j$["Fogón","Pileta compartida","Zona de juegos","Admite mascotas","Aire frío/calor","Parque compartido"]$j$::jsonb,
    $j${"kitchen":true,"linens":true,"wood_stove":true,"air_conditioning":"frío/calor","pool_shared":true,"garden":true,"barbecue":true,"game_zone":true,"pets_allowed":true}$j$::jsonb,
    $j$["Piedra Movediza","Parque Independencia"]$j$::jsonb,
    5.0, 3,
    100, 15, 1
),
(
    $txt$confort-familiar$txt$,
    $txt$Las Calandrias de Tandil 4$txt$,
    $txt$Confort Familiar$txt$,
    $txt$Espaciosa y confortable, la Cabaña 4 se destaca por sus dos habitaciones y dos baños completos, ideal para familias o grupos que buscan comodidad.$txt$,
    $txt$Espaciosa y confortable, la Cabaña 4 se destaca por sus dos habitaciones y dos baños completos, ideal para familias o grupos que buscan comodidad. Su estufa salamandra aporta calidez y un ambiente acogedor. Cuenta con cocina equipada, ropa blanca, aire frío/calor y acceso a parque compartido con fogón y sector de descanso. Todo pensado para disfrutar de la tranquilidad de Tandil.$txt$,
    $txt$6 huéspedes$txt$,
    $txt$2 dormitorios$txt$,
    $txt$2 baños$txt$,
    $txt$/cabin1.jpg$txt$,
    $txt$/cabins/cab1/thumbnail.jpg$txt$,
    $j$[{"icon":"Mountain","label":"Vista a las montañas"},{"icon":"ChefHat","label":"Cocina equipada"},{"icon":"Wifi","label":"WiFi gratuito"},{"icon":"Car","label":"Estacionamiento gratis"},{"icon":"Waves","label":"Pileta compartida"},{"icon":"Flame","label":"Chimenea interior"},{"icon":"Utensils","label":"Parrilla"},{"icon":"TreePine","label":"Zona para comer al aire libre"}]$j$::jsonb,
    $j$["2 dormitorios","2 baños completos","Chimenea salamandra","Pileta compartida","Aire frío/calor","Parque compartido"]$j$::jsonb,
    $j${"kitchen":true,"linens":true,"wood_stove":true,"air_conditioning":"frío/calor","pool_shared":true,"garden":true,"barbecue":true,"game_zone":false,"pets_allowed":true}$j$::jsonb,
    $j$["Piedra Movediza","Parque Independencia"]$j$::jsonb,
    5.0, 1,
    150, 15, 2
),
(
    $txt$experiencia-premium$txt$,
    $txt$Las Calandrias de Tandil 5$txt$,
    $txt$Experiencia Premium$txt$,
    $txt$Amplia y acogedora, la Cabaña 5 ofrece tres dormitorios y dos baños completos, perfecta para familias numerosas o grupos de amigos que buscan compartir momentos especiales.$txt$,
    $txt$Amplia y acogedora, la Cabaña 5 ofrece tres dormitorios y dos baños completos, perfecta para familias numerosas o grupos de amigos que buscan compartir momentos especiales. Su estufa salamandra brinda calidez y crea un ambiente hogareño ideal para reunirse. Dispone de cocina completamente equipada, ropa de cama y toallas incluidas, aire acondicionado frío/calor y acceso al parque compartido con fogón y área de descanso. Un espacio pensado para disfrutar en familia de la serenidad que ofrece Tandil.$txt$,
    $txt$8 huéspedes$txt$,
    $txt$3 dormitorios$txt$,
    $txt$2 baños$txt$,
    $txt$/cabin5.jpg$txt$,
    $txt$/cabins/cab5/thumbnail.jpg$txt$,
    $j$[{"icon":"Mountain","label":"Vista a las montañas"},{"icon":"ChefHat","label":"Cocina equipada"},{"icon":"Wifi","label":"WiFi gratuito"},{"icon":"Car","label":"Estacionamiento gratis"},{"icon":"Waves","label":"Pileta compartida"},{"icon":"Flame","label":"Chimenea interior"},{"icon":"Utensils","label":"Parrilla"},{"icon":"TreePine","label":"Zona para comer al aire libre"}]$j$::jsonb,
    $j$["3 dormitorios","2 baños completos","Chimenea salamandra","Pileta compartida","Aire frío/calor","Parque compartido"]$j$::jsonb,
    $j${"kitchen":true,"linens":true,"wood_stove":true,"air_conditioning":"frío/calor","pool_shared":true,"garden":true,"barbecue":true,"game_zone":false,"pets_allowed":true}$j$::jsonb,
    $j$["Piedra Movediza","Parque Independencia"]$j$::jsonb,
    4.8, 2,
    150, 15, 3
);

-- ============ CABIN SYNC CONFIG ============
-- Una fila por cabaña; las URLs iCal reales las carga el cliente en el backoffice.
insert into cabin_sync_config (cabin_id, airbnb_ical_url)
select id, '' from cabins;

-- ============ FAQS ============
insert into faqs (question, answer, sort_order) values
(
    $txt$¿Cómo realizo una reserva en Las Calandrias?$txt$,
    $txt$Puedes reservar directamente desde nuestra web utilizando el botón "Reservar ahora", llamando al número de contacto o enviando un correo electrónico. Se requiere un depósito del 30% para confirmar la reserva.$txt$,
    1
),
(
    $txt$¿Qué incluye la tarifa de las cabañas?$txt$,
    $txt$La tarifa incluye alojamiento, ropa de cama, toallas, amenities básicos, acceso a todas las instalaciones de la cabaña (chimenea, parrilla), estacionamiento y Wi-Fi. También ofrecemos un kit de bienvenida con productos locales de Tandil.$txt$,
    2
),
(
    $txt$¿Permiten mascotas en las cabañas?$txt$,
    $txt$¡Sí! Entendemos que las mascotas son parte de la familia. Aceptamos mascotas pequeñas y medianas con un cargo adicional de limpieza. Te pedimos que nos informes al momento de hacer la reserva. Algunas cabañas tienen áreas especiales para mascotas.$txt$,
    3
),
(
    $txt$¿Cuál es la política de cancelación?$txt$,
    $txt$Ofrecemos cancelación gratuita hasta 48 horas antes del check-in. Para cancelaciones realizadas con menos de 48 horas de anticipación, se aplicará un cargo del 50% del total. En casos de cancelaciones el mismo día, se cobrará la totalidad de la reserva.$txt$,
    4
),
(
    $txt$¿Qué actividades puedo hacer en Tandil?$txt$,
    $txt$Tandil ofrece múltiples actividades: trekking en Cerro La Movediza, visita al Lago del Fuerte, parapente, cabalgatas, turismo rural, visitas a fábricas de dulces y salamines artesanales. También puedes disfrutar del centro histórico y sus tradicionales confiterías.$txt$,
    5
),
(
    $txt$¿Hay servicios de alimentación disponibles?$txt$,
    $txt$Cada cabaña cuenta con cocina completamente equipada para que puedas preparar tus comidas. También podemos recomendarte los mejores restaurantes de Tandil o coordinar servicios de catering para ocasiones especiales. Incluimos un kit de bienvenida con productos locales.$txt$,
    6
);

-- ============ REVIEWS ============
insert into reviews (name, location, text, avatar_url, sort_order) values
(
    $txt$María Rodríguez$txt$,
    $txt$Buenos Aires$txt$,
    $txt$Una experiencia maravillosa. La cabaña estaba impecable, con todas las comodidades y una vista espectacular. Definitivamente volveremos.$txt$,
    $txt$/avatars/avatar1.png$txt$,
    1
),
(
    $txt$Carlos Méndez$txt$,
    $txt$Córdoba$txt$,
    $txt$El lugar perfecto para desconectar. La atención fue excelente, la cabaña muy cómoda y la zona es hermosa para hacer caminatas.$txt$,
    $txt$/avatars/avatar2.png$txt$,
    2
),
(
    $txt$Laura y Diego$txt$,
    $txt$Rosario$txt$,
    $txt$Celebramos nuestro aniversario en la cabaña El Roble y fue mágico. El jacuzzi con vista al bosque y la chimenea crearon el ambiente perfecto.$txt$,
    $txt$/avatars/avatar3.png$txt$,
    3
),
(
    $txt$Sofía Pérez$txt$,
    $txt$Mendoza$txt$,
    $txt$Hermoso lugar, rodeado de naturaleza. El personal muy atento y las instalaciones de primera. ¡Recomendado!$txt$,
    $txt$/avatars/avatar4.png$txt$,
    4
),
(
    $txt$Martín López$txt$,
    $txt$Bariloche$txt$,
    $txt$Las cabañas superaron nuestras expectativas. Volveremos en invierno para disfrutar de la chimenea y la nieve.$txt$,
    $txt$/avatars/avatar5.png$txt$,
    5
);

-- ============ GALLERY ITEMS ============
insert into gallery_items (title, description, image_url, span, sort_order) values
($txt$Luna sobre el campo$txt$, $txt$Una noche clara con la luna llena elevándose sobre las cabañas y el bosque.$txt$, $txt$/gallery/luna-sobre-el-campo.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 1),
($txt$Vista serrana$txt$, $txt$Paisaje panorámico de sierras verdes bajo un cielo despejado.$txt$, $txt$/gallery/vista-serrana.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 2),
($txt$Amanecer junto a la pileta$txt$, $txt$Un nuevo día comienza reflejándose en la quietud del agua.$txt$, $txt$/gallery/amanecer-junto-a-la-pileta.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 3),
($txt$Vista aérea del complejo$txt$, $txt$Disposición armoniosa de cabañas, caminos y naturaleza desde el cielo.$txt$, $txt$/gallery/vista-aerea-del-complejo.jpg$txt$, $txt$col-span-2 row-span-2$txt$, 4),
($txt$Todo el predio desde el aire$txt$, $txt$Un vistazo completo al predio, con la pileta, cabañas y entorno natural.$txt$, $txt$/gallery/todo-el-predio-desde-el-aire.jpg$txt$, $txt$col-span-2 row-span-2$txt$, 5),
($txt$Baño con estilo rústico$txt$, $txt$Lavabo artesanal en piedra y grifería moderna, elegancia natural.$txt$, $txt$/gallery/bano-con-estilo-rustico.jpg$txt$, $txt$col-span-2 row-span-2$txt$, 6),
($txt$Dormitorio cálido y luminoso$txt$, $txt$Habitación con techo de madera y luz natural perfecta para descansar.$txt$, $txt$/gallery/dormitorio-calido-y-luminoso.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 7),
($txt$Detalles del descanso$txt$, $txt$Cojines suaves y colores cálidos para una siesta reparadora.$txt$, $txt$/gallery/detalles-del-descanso.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 8),
($txt$Cabaña entre árboles$txt$, $txt$Construcción rústica con chimenea de piedra, ideal para el relax.$txt$, $txt$/gallery/cabana-entre-arboles.jpg$txt$, $txt$col-span-2 row-span-2$txt$, 9),
($txt$Cabaña El Refugio$txt$, $txt$Fachada de piedra y madera, rodeada de verde y montañas.$txt$, $txt$/gallery/cabana-el-refugio.jpg$txt$, $txt$col-span-2 row-span-2$txt$, 10),
($txt$Cipreses bajo el sol$txt$, $txt$Verdes y vibrantes bajo un cielo despejado.$txt$, $txt$/gallery/cipreses-bajo-el-sol.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 11),
($txt$Camino entre cipreses$txt$, $txt$Sendero natural flanqueado por cipreses amarillos.$txt$, $txt$/gallery/camino-entre-cipreses.jpg$txt$, $txt$col-span-1 row-span-2$txt$, 12);

-- ============ SITE CONTENT ============
insert into site_content (key, value) values
(
    $txt$hero$txt$,
    $j${"title":"Tu refugio perfecto en las montañas de Tandil","subtitle":"Descubre nuestras acogedoras cabañas rodeadas de naturaleza en las sierras de Buenos Aires. Un lugar para desconectar, relajarse y crear recuerdos inolvidables en Tandil.","ctaLabel":"Reservar ahora"}$j$::jsonb
),
(
    $txt$services$txt$,
    $j${"title":"Diseñadas para una experiencia especial en Tandil","items":[{"icon":"Home","title":"Ubicación privilegiada en Tandil","description":"Nuestras cabañas están ubicadas en el corazón de la sierra de Tandil, a solo minutos de los principales atractivos naturales y turísticos."},{"icon":"Sparkles","title":"Comodidades pensadas para tu bienestar","description":"Cada cabaña cuenta con amenities cuidadosamente seleccionados: pileta, chimenea, cocina equipada, WiFi y todas las comodidades para tu estadía perfecta."},{"icon":"Heart","title":"Atención personalizada","description":"Nos esforzamos por brindarte una atención cálida y servicios pensados para hacer de tu estadía en Tandil una experiencia única e inolvidable."}]}$j$::jsonb
),
(
    $txt$cta$txt$,
    $j${"title":"¿Listo para tu próxima aventura en Tandil?","subtitle":"Descubre la tranquilidad de las sierras de Tandil y vive una experiencia especial en nuestras acogedoras cabañas.","buttonLabel":"Reservar ahora"}$j$::jsonb
),
(
    $txt$cabins_teaser$txt$,
    $j${"title":"Tu refugio perfecto te espera","subtitle":"Cada cabaña cuenta una historia diferente. Desde escapadas románticas hasta aventuras familiares, hemos creado espacios únicos que se adaptan a tu forma de vivir la montaña.","stats":[{"value":"4","label":"Cabañas"},{"value":"2-8","label":"Huéspedes"},{"value":"★★★★★","label":"Calidad"},{"value":"100%","label":"Naturaleza"}],"features":[{"title":"Vistas panorámicas","description":"Cada amanecer es un regalo"},{"title":"Conexión natural","description":"Rodeado de sierras y bosques"},{"title":"Comodidades premium","description":"Lujo y naturaleza en armonía"},{"title":"Experiencias únicas","description":"Momentos que perduran"}],"ctaLabel":"Descubrir nuestras cabañas"}$j$::jsonb
),
(
    $txt$seo$txt$,
    $j${"title":"Las Calandrias - Cabañas en Tandil | Alojamiento de Lujo en las Sierras","description":"Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas. Relax, naturaleza y confort en Las Calandrias. Reservá tu escapada.","keywords":"cabañas tandil, alojamiento tandil, vacaciones tandil, estadía tandil, sierra tandil, cabaña tandil, calandrias, cabañas buenos aires, turismo tandil, relax tandil, escapada fin de semana, cabañas con pileta, alojamiento sierra, vacaciones sierras, cabañas lujo tandil"}$j$::jsonb
);

-- ============ SITE SETTINGS ============
-- Una sola fila (id fijo). Las reservas arrancan DESHABILITADAS (hoy suspendidas).
-- Resto de columnas usan los defaults del schema.
insert into site_settings (bookings_enabled) values (false);
