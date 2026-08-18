-- ============================================================================
-- 0001: Tabla profiles + funciones y triggers
-- ============================================================================
-- ORDEN DE CREACIÓN PARA RESPETAR DEPENDENCIAS:
--   1. set_updated_at()            (sin dependencias)
--   2. tabla profiles              (sin dependencias)
--   3. trigger profiles_set_updated_at (usa set_updated_at + profiles)
--   4. is_admin()                  (SQL: valida el cuerpo al crearse,
--                                    por eso profiles DEBE existir antes)
--   5. handle_new_user()           (usa profiles)
--   6. trigger on_auth_user_created (usa handle_new_user + auth.users)
--   7. prevent_role_escalation()   (usa is_admin)
--   8. trigger profiles_prevent_role_escalation (usa prevent_role_escalation)
--   9. admin_set_user_role()       (usa is_admin + profiles)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Función genérica para mantener updated_at actualizado
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabla profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Función is_admin(): evita recursión de RLS al consultar profiles
-- desde una política sobre la propia tabla profiles u otras tablas.
-- SECURITY DEFINER para que la lectura de profiles no se filtre por RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trigger: crear profile automáticamente tras el registro de un usuario
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: impedir que un usuario ascienda su propio rol a admin
-- Un admin autenticado sí puede modificar roles.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
  then
    raise exception 'No tienes permiso para cambiar el rol de usuario';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- Función admin_set_user_role: única vía segura para asignar roles.
-- SECURITY DEFINER + validación de que el llamador es admin.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('admin', 'customer') then
    raise exception 'Rol inválido. Solo se permite admin o customer';
  end if;

  if not public.is_admin() then
    raise exception 'No autorizado. Se requiere rol de administrador';
  end if;

  update public.profiles
  set role = p_role
  where id = p_user_id;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;