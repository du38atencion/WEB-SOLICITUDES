# Sistema Web de Solicitudes Internas

Plataforma web responsive con Next.js, React, TypeScript y Supabase. Incluye registro con folio automático, tablero con filtros y resumen, detalles, comentarios, historial de estados y actualizaciones en tiempo real. Requiere iniciar sesión como ADMIN con Supabase Auth.

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

**Activar el acceso ADMIN (también en instalaciones nuevas):** Después de `schema.sql`, ejecuta una vez `supabase/migrations/20261011_admin_login.sql`. Esta migración conserva las solicitudes y bloquea lecturas, creación y seguimiento anónimos. No vuelvas a ejecutar `schema.sql` sobre la base existente.

En Supabase → Authentication → Users → Add user → Create new user, crea `admin@solicitudes.internal` con la contraseña elegida por el propietario y activa Auto Confirm User. Este correo es un identificador interno: no envía correos ni permite recuperación por email. El formulario de acceso pide el usuario **ADMIN**. No guardes la contraseña en GitHub ni en variables públicas. En Authentication → Sign In / Providers, desactiva Allow new users to sign up (la ubicación puede variar en el dashboard). Solo la cuenta cuyo correo coincide con el identificador ADMIN tiene permisos, incluso si existe otra cuenta.

Verifica el ingreso con datos correctos, rechazo con una contraseña incorrecta, cierre de sesión y que otra ventana sin sesión no pueda acceder. No compartas la sesión del navegador; cada persona debe entrar. Las acciones siguen usando un autor declarado; una cuenta compartida no identifica individualmente a cada operador. La contraseña compartida por chat debe cambiarse para un uso real.

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

1. Inicia sesión como ADMIN. Registra una solicitud con descripción, ubicación, solicitante, áreas, fecha, tipo y prioridad. Confirma el folio y el estado Pendiente.
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
  Platform.tsx        Sesión, inicio, navegación y marca
  Login.tsx           Acceso ADMIN con Supabase Auth
  RequestForm.tsx     Registro y confirmación
  RequestBoard.tsx    Tabla, resumen, filtros y Realtime
  RequestDetail.tsx   Datos, comentarios y seguimiento
  Badge.tsx           Colores de estados y prioridades
lib/
  auth.ts             Identificador interno de la cuenta ADMIN
  config.ts           Nombre, departamentos, áreas, tipos y modelos
  supabase.ts         Cliente público y mensajes de error
supabase/
  schema.sql          Tablas, permisos, folios e historial
  migrations/         Migración de permisos para acceso ADMIN
.env.example          Plantilla de configuración
```

- **Nombre, departamentos, áreas y tipos:** edita `lib/config.ts`. Las listas son valores iniciales sugeridos; cambiar sus opciones no renombra registros históricos.
- **Colores corporativos:** variables CSS al comienzo de `app/globals.css`.
- **Logo:** reemplaza la marca SI en `components/Platform.tsx`; puedes guardar imágenes en una futura carpeta `public/`.
- **Estados y prioridades:** se definen en `lib/config.ts`, `Badge.tsx` y las restricciones SQL. Cambiarlos requiere una migración coordinada.
- **Más campos:** agrega una migración SQL, actualiza los tipos y el formulario/detalle.
- **Roles futuros:** el login usa Supabase Auth; amplía las políticas ADMIN y agrega cuentas individuales para permisos por usuario/departamento.
- **Notificaciones futuras:** agrega una integración de servidor o Edge Function, manteniendo sus claves secretas fuera del navegador.

El tablero carga todos los registros en páginas de 500 para no omitir solicitudes por el límite habitual de la API. Para volúmenes grandes, conviene pasar filtros, métricas y paginación al servidor.
