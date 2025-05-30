e# Integración iCal con Airbnb

## Página de Pruebas: `/test-ical`

Hemos creado una página de pruebas para experimentar con la librería `node-ical` y parsear calendarios de Airbnb.

### Características

- **Parseo desde URL**: Conecta directamente con URLs de iCal de Airbnb
- **Parseo desde contenido**: Pega el contenido de un archivo .ics directamente
- **Visualización de eventos**: Muestra las reservas con detalles completos
- **Datos raw**: Accede a toda la información parseada en formato JSON
- **Ejemplo incluido**: Prueba con un calendario simulado de Airbnb

### Cómo usar

1. Ve a `http://localhost:3000/test-ical`
2. Elige entre:
   - **Desde URL**: Pega la URL del iCal de Airbnb
   - **Contenido directo**: Pega el contenido completo del archivo .ics
3. Haz clic en "Cargar ejemplo de Airbnb" para ver datos de prueba

### Obtener URL de iCal de Airbnb

1. Entra a tu cuenta de Airbnb como anfitrión
2. Ve a tu calendario de la propiedad
3. Busca la opción "Exportar calendario" o "Sincronizar calendario"
4. Copia la URL del iCal que proporciona Airbnb
5. Pégala en la página de pruebas

### Estructura de Eventos de Airbnb

Los eventos parseados incluyen:

```typescript
{
  type: "VEVENT",
  summary: "Las Calandrias (HM123456789)",
  description: "Reserved - Las Calandrias\n\nReservation Code: HM123456789\nGuest: María González...",
  start: "2025-02-15T18:00:00.000Z",
  end: "2025-02-18T14:00:00.000Z",
  location: "Las Calandrias, Tandil, Buenos Aires, Argentina",
  status: "CONFIRMED",
  uid: "airbnb-123456789@airbnb.com"
}
```

### Información Extraíble

- **Código de reserva**: En el summary (HM123456789)
- **Huésped**: En la description
- **Fechas**: start y end (convertidas a ISO strings)
- **Tipo**: Reserved/Blocked
- **Ubicación**: Propiedad específica
- **Estado**: CONFIRMED, TENTATIVE, etc.

### API Endpoint

La página utiliza `/api/parse-ical` que acepta:

```javascript
POST /api/parse-ical
{
  "type": "url" | "content",
  "data": "url_or_ical_content"
}
```

Respuesta:
```javascript
{
  "success": true,
  "events": { /* eventos parseados */ },
  "stats": {
    "total": 6,
    "vevents": 5,
    "vtimezones": 1,
    "vcalendars": 0
  },
  "message": "Calendario parseado exitosamente. 5 eventos encontrados."
}
```

### Próximos Pasos

Esta página de pruebas es el foundation para:

1. **Sistema de reservas automatizado**: Integrar con el sistema de disponibilidad
2. **Sincronización bidireccional**: Actualizar Airbnb desde la web
3. **Dashboard de anfitrión**: Ver todas las reservas en una interfaz unificada
4. **Notificaciones**: Alertas de nuevas reservas o cambios
5. **Reportes**: Análisis de ocupación y ingresos

### Librerías Utilizadas

- `node-ical@0.20.1`: Parser de iCalendar para Node.js
- Soporte para recurrencias, timezones y eventos complejos
- API asíncrona para mejor performance 