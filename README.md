# Mi Tienda

Aplicación web profesional de tienda en línea construida con:

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4**
- **React Router 7**
- **Supabase** (Auth, Postgres, Storage, RLS)

## Requisitos previos

- Node.js >= 20
- npm >= 10

## Instalación

```bash
npm install
```

## Variables de entorno

Copia el archivo `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

> **Importante:** nunca subas el archivo `.env` al repositorio. Está excluido en `.gitignore`.

## Ejecutar en desarrollo

```bash
npm run dev
```

## Compilar para producción

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Estructura del proyecto

```
src/
  components/  # Componentes reutilizables
  pages/       # Páginas de la aplicación
  layouts/     # Layouts (navegación, cabecera, pie)
  hooks/       # Hooks personalizados
  lib/         # Utilidades y clientes (ej. Supabase)
  services/    # Llamadas a la API / lógica de negocio
  types/       # Tipos y interfaces de TypeScript
  utils/       # Funciones auxiliares
```

## Estado actual

- Tienda pública con catálogo, búsqueda, filtros por categoría, detalle de producto y carrito.
- Checkout que crea pedidos de forma segura mediante la función RPC `create_order`.
- Panel administrativo completo (`/admin`).
- Supabase configurado: Auth, base de datos con RLS, Storage y migraciones.

## Tienda pública

- Inicio: `/` (hero, categorías, búsqueda, productos destacados y grilla).
- Detalle de producto: `/producto/:slug` (galería, precio, stock, cantidad, WhatsApp).
- Carrito: persistente en `localStorage`, accesible desde el botón del encabezado.
- Checkout: `/checkout` (datos del cliente + confirmación del pedido).
- Botón flotante de WhatsApp (si está habilitado en Configuración).
- Colores, moneda, nombre, logo y redes sociales se toman de `store_settings`.

## Panel administrativo

- Iniciar sesión: `/login` (correo + contraseña).
- Panel: `/admin` (Dashboard, Productos, Categorías, Pedidos, Configuración).
- Solo usuarios con `profiles.role = 'admin'` pueden acceder.

### Crear el primer administrador (forma segura)

Ningún usuario puede auto-asignarse el rol `admin`: el RLS y los triggers de la base de datos lo
impiden. Hay dos vías, ambas requieren privilegios de administrador:

1. **Desde el SQL Editor de Supabase** (con usuario `postgres`):

```sql
update public.profiles
set role = 'admin'
where id = '<UUID del usuario en auth.users>';
```

> El UUID se obtiene de la tabla `auth.users` en el dashboard. Registra primero el usuario
> desde Supabase Auth (o el panel), porque el perfil se crea automáticamente al registrarse.

2. **De forma programática y segura** (requiere estar autenticado como admin):

```sql
select public.admin_set_user_role('<UUID del usuario>', 'admin');
```

Esta función comprueba que el llamador sea admin y no expone el cambio de rol a la API pública.