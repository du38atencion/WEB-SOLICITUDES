# Sistema Web de Solicitudes Internas

Plataforma web responsive con Next.js, React, TypeScript y Supabase. Incluye registro con folio automático, tablero con filtros y resumen, detalles, comentarios, historial de estados y actualizaciones en tiempo real. No requiere login.

## 1. Instalar dependencias

Requisitos: Node.js 24 LTS y npm. Desde la carpeta del proyecto:

```bash
npm ci
```

El archivo `package-lock.json` fija las versiones instaladas.

## 2. Configurar Supabase y variables

Crea un proyecto en Supabase. Copia `.env.example` a `.env.local` y completa:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

Usa la URL y la clave **publishable** o **anon** del proyecto, disponibles en sus ajustes de API. Son claves públicas para el navegador. Nunca uses `service_role` ni una clave secreta en variables `NEXT_PUBLIC_`. No subas `.env.local` al repositorio. Reinicia el servidor después de cambiar variables.

Sin estas variables se muestra una indicación de configuración; no se simulan guardados ni solicitudes.

## 3. Crear las tablas

En el **SQL Editor** de Supabase, ejecuta todo `supabase/schema.sql` **una vez**, en un proyecto nuevo. El script se ejecuta en una transacción y crea:

- `solicitudes`, `comentarios_solicitud`, `historial_estado`.
- Un contador interno por año para folios únicos, incluso con registros simultáneos.
- Triggers de fecha y auditoría; función transaccional `registrar_seguimiento`.
- Políticas RLS y permisos públicos limitados al flujo solicitado, sin eliminación ni edición directa del historial.
- Publicación Realtime para las tres tablas funcionales.

El folio usa el año actual de Ciudad de México y al menos cinco dígitos: `SOL-2026-00001`. No depende del reloj del navegador. El estado inicial siempre es Pendiente. Los comentarios y cambios de estado se guardan juntos; si otra persona cambió el estado mientras se editaba, se solicita actualizar en vez de sobrescribirlo.

**Acceso sin login:** cualquier visitante con acceso al sitio y a su API pública puede leer solicitudes, crearlas y registrar seguimiento. El nombre del autor es declarado, no verificado. Antes de usar datos sensibles, añade autenticación y políticas por departamento o restringe el acceso al sitio. La clave pública no es un mecanismo de acceso privado.

## Retirar un login anterior

La versión actual abre directamente y no utiliza login. Si ejecutaste la migración `20261011_admin_login.sql`, ejecuta ahora `supabase/migrations/20261011_remove_login.sql` en SQL Editor. Restaura lectura, creación y seguimiento sin sesión y conserva los datos. También puede ejecutarse sobre el esquema original. No vuelvas a ejecutar `schema.sql` sobre una base existente. La migración ADMIN se conserva solo como referencia histórica; no la ejecutes para esta versión.

No se requiere un token de administración Supabase para ejecutar la aplicación; los requisitos de acceso que se añadieron al borrador de Codex para crear ADMIN ya no son necesarios y pueden retirarse desde los ajustes del entorno.

## 4. Ejecutar localmente

```bash
npm run dev
```

Abre el puerto 3000 en tu equipo. Para comprobar producción:

```bash
npm run typecheck
npm run build
npm start
```

No necesitas un servidor de base de datos local: el navegador se conecta a Supabase por HTTPS. Realtime usa WebSocket y el tablero también consulta cada 30 segundos como respaldo.

### Validación funcional con Supabase configurado

1. Registra una solicitud con descripción, ubicación, solicitante, áreas, fecha, tipo y prioridad. Confirma el folio y el estado Pendiente.
2. Abre Ver solicitudes en otra ventana: debe aparecer sin recargar. Comprueba el resumen y cada filtro.
3. Abre el detalle, cambia a En proceso y agrega un comentario con autor. Verifica los datos, el comentario con fecha y el historial del cambio.
4. Comprueba que la segunda ventana recibe el cambio. Recarga ambas ventanas para verificar persistencia.
5. Abre la misma solicitud en dos ventanas; cambia el estado en una y trata de guardar desde la otra antes de que se actualice. Un estado obsoleto debe producir un aviso, no una sobrescritura.
6. Comprueba que un formulario incompleto no se envía y que la vista funciona en pantalla estrecha.

## 5. Desplegar en Vercel

1. Sube este proyecto al repositorio GitHub `du38atencion/APP-KEVIN` en la rama que deseas desplegar.
2. Importa el repositorio en Vercel y selecciona el preset Next.js. La raíz es la carpeta que contiene `package.json`.
3. Agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en las variables de Vercel para Production y, si corresponde, Preview.
4. Despliega. Vercel instalará las dependencias y ejecutará `npm run build`.
5. Usa el enlace HTTPS generado y repite la validación funcional. Si modificas variables públicas, vuelve a desplegar: se incluyen durante la compilación.

No se ha publicado automáticamente en Vercel ni se ha creado un proyecto Supabase desde este repositorio.

## Estructura y personalización

```text
app/
  layout.tsx          Metadatos y layout en español
  page.tsx            Entrada del sitio
  globals.css         Estilos responsive y variables de color
components/
  Platform.tsx        Inicio, navegación y marca
  RequestForm.tsx     Registro y confirmación
  RequestBoard.tsx    Tabla, resumen, filtros y Realtime
  RequestDetail.tsx   Datos, comentarios y seguimiento
  Badge.tsx           Colores de estados y prioridades
lib/
  config.ts           Nombre, departamentos, áreas, tipos y modelos
  supabase.ts         Cliente público y mensajes de error
supabase/
  schema.sql          Tablas, permisos, folios e historial
.env.example          Plantilla de configuración
```

- **Nombre, departamentos, áreas y tipos:** edita `lib/config.ts`. Las listas son valores iniciales sugeridos; cambiar sus opciones no renombra registros históricos.
- **Colores corporativos:** variables CSS al comienzo de `app/globals.css`.
- **Logo:** el encabezado usa `public/stellantis-logo.png`, una versión con fondo transparente preparada a partir de la imagen proporcionada. Reemplaza ese archivo para cambiar la marca; el tamaño responsive se configura en `.brand-logo` en `app/globals.css`.
- **Estados y prioridades:** se definen en `lib/config.ts`, `Badge.tsx` y las restricciones SQL. Cambiarlos requiere una migración coordinada.
- **Más campos:** agrega una migración SQL, actualiza los tipos y el formulario/detalle.
- **Login y roles futuros:** incorpora Supabase Auth y reemplaza las políticas públicas por políticas por usuario/departamento.
- **Notificaciones futuras:** agrega una integración de servidor o Edge Function, manteniendo sus claves secretas fuera del navegador.

El tablero carga todos los registros en páginas de 500 para no omitir solicitudes por el límite habitual de la API. Para volúmenes grandes, conviene pasar filtros, métricas y paginación al servidor.
