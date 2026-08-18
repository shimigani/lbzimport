# Supabase - Base de datos de Mi Tienda

Esquema completo de la tienda en línea gestionado mediante **migraciones SQL** reproducibles.

## Tablas

| Tabla | Propósito |
| --- | --- |
| `profiles` | Perfil de cada usuario de `auth.users` con rol (`admin` / `customer`) |
| `categories` | Categorías de productos |
| `products` | Productos (precio, stock, slug, categoría, activo, destacado) |
| `product_images` | Múltiples imágenes por producto |
| `orders` | Pedidos realizados en la tienda |
| `order_items` | Líneas de cada pedido (conserva nombre y precio histórico) |
| `store_settings` | Configuración de la tienda (fila única) |

## Relaciones (foreign keys)

- `profiles.id` → `auth.users.id` (`ON DELETE CASCADE`)
- `products.category_id` → `categories.id` (`ON DELETE SET NULL`)
- `product_images.product_id` → `products.id` (`ON DELETE CASCADE`)
- `order_items.order_id` → `orders.id` (`ON DELETE CASCADE`)
- `order_items.product_id` → `products.id` (`ON DELETE SET NULL`, se conserva el historial del pedido)

## Índices

- `categories`: único en `slug`, índice en `active`
- `products`: único en `slug` y `sku`, índices en `category_id`, `active`, `featured`, `created_at`
- `product_images`: índice en `product_id`
- `orders`: único en `order_number`, índices en `status`, `created_at`, `customer_phone`
- `order_items`: índice en `order_id`

## Políticas RLS

Todas las tablas tienen RLS habilitado. La comprobación de administrador se centraliza en la función `public.is_admin()` (SECURITY DEFINER, evita recursión de RLS).

### profiles
- `profiles_select_own`: un usuario lee su propio perfil.
- `profiles_select_admin`: un admin lee todos los perfiles.
- `profiles_update_own`: un usuario actualiza su perfil (un trigger impide que cambie su propio rol).
- `profiles_update_admin`: un admin actualiza cualquier perfil.

### categories
- `categories_select_public`: lectura pública solo de categorías activas.
- `categories_all_admin`: CRUD completo solo para admin.

### products
- `products_select_public`: lectura pública solo de productos activos.
- `products_all_admin`: CRUD completo solo para admin.

### product_images
- `product_images_select_public`: lectura pública de imágenes de productos activos.
- `product_images_all_admin`: CRUD completo solo para admin.

### orders
- Sin políticas públicas de escritura: la creación se hace **exclusivamente** vía RPC `create_order` (SECURITY DEFINER).
- `orders_select_admin`, `orders_update_admin`, `orders_delete_admin`: solo admin.

### order_items
- Sin políticas públicas: se crean dentro de `create_order`.
- `order_items_all_admin`: acceso total solo para admin.

### store_settings
- `store_settings_select_public`: lectura pública (es información pública que el navegador necesita: nombre, WhatsApp, colores, pixel IDs). Es la única política con `USING (true)` y **solo aplica a SELECT de datos públicos**, no a operaciones administrativas.
- `store_settings_all_admin`: escritura completa solo para admin.

### Migración 0008 (pago con QR)
Añade a `store_settings` campos opcionales (NULL, DEFAULT NULL, `add column if not exists`) para configurar el pago:
`payment_instructions`, `payment_account_name`, `payment_bank_name`, `payment_account_number`, `payment_account_type`.
La URL del QR ya existía como `qr_payment_url` (0005), por lo que **no** se duplicó. No modifica tablas previas, RLS ni `create_order`.

## Storage (buckets)

| Bucket | Uso | Lectura | Escritura |
| --- | --- | --- | --- |
| `products` | Imágenes de productos | Público | Solo admin |
| `store-assets` | Logo, QR de pago, imagen social | Público | Solo admin |

## Funciones y triggers

- `set_updated_at()`: actualiza `updated_at` automáticamente (trigger en profiles, categories, products, orders, store_settings).
- `handle_new_user()`: crea el `profile` automáticamente tras registrarse (rol `customer`).
- `prevent_role_escalation()`: bloquea que un usuario ascienda su propio rol.
- `is_admin()`: comprueba rol admin sin recursión de RLS.
- `admin_set_user_role(uid, role)`: única vía segura para asignar roles (solo admin).
- `create_order(...)`: RPC segura para que un visitante cree un pedido. Valida productos activos y stock, calcula subtotal/total en servidor, crea `orders` + `order_items` en una transacción y descuenta stock.

## Cómo ejecutar las migraciones

Requisitos: [Supabase CLI](https://supabase.com/docs/guides/cli) instalado y el proyecto enlazado.

```bash
# 1. Iniciar sesión (una vez)
supabase login

# 2. Enlazar este repositorio con tu proyecto de Supabase
supabase link --project-ref umfmmnsdkwyrcxqgmzxs

# 3. Aplicar las migraciones a la base de datos remota
supabase db push

# (Opcional) probar en local con Docker
supabase start
supabase db reset
```

Las migraciones se aplican en orden según el prefijo de fecha de sus nombres.

## Cómo crear el primer administrador

Las políticas exigen que el rol `admin` exista ya en `profiles`; nadie puede auto-asignarse admin (el RLS y los triggers lo impiden).

Con el rol `postgres` (SQL Editor del dashboard, usando el usuario `postgres` o con una conexión con privilegios de administrador), ejecuta:

```sql
update public.profiles
set role = 'admin'
where id = '<UUID del usuario en auth.users>';
```

> Reemplaza `<UUID del usuario en auth.users>` con el id del usuario que registrarás previamente desde la interfaz de Supabase Auth.

Para asignar el rol de forma programática y segura desde el panel administrativo (ya autenticado como admin), usa la función RPC:

```sql
select public.admin_set_user_role('<UUID del usuario>', 'admin');
```