-- ============================================================================
-- 0004: Tablas orders y order_items + función create_order
-- ============================================================================
-- Esta migración fue reintentada tras un fallo previo de db push en la
-- creación de create_order() (SQLSTATE 42P13: un parámetro con DEFAULT no
-- puede preceder a uno obligatorio). Se corrige reordenando los parámetros:
-- p_items (obligatorio) pasa antes de los parámetros opcionales.
--
-- Para ser compatible con el estado real remoto, se usan guardas
-- idempotentes (if not exists / drop trigger if exists / create or replace):
-- re-aplicar esta migración no falla aunque exista un estado parcial,
-- y NO borra datos ni requiere reiniciar el proyecto.
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  city text,
  address text,
  reference text,
  note text,
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'paid', 'preparing', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Índices (order_number ya tiene índice único por la constraint UNIQUE)
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at);
create index if not exists orders_customer_phone_idx on public.orders (customer_phone);

-- ---------------------------------------------------------------------------
-- order_items: conserva product_name y unit_price como historial del pedido
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- create_order: vía segura (RPC) para que un visitante cree un pedido.
-- SECURITY DEFINER: valida productos activos y stock, calcula totales en
-- servidor y crea order + order_items en una transacción. Los visitantes
-- NO tienen permisos INSERT/UPDATE/DELETE directos sobre orders/order_items.
--
-- FIRMA: los parámetros obligatorios van primero; los opcionales (con
-- DEFAULT) al final, como exige PostgreSQL (SQLSTATE 42P13).
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_city text,
  p_address text,
  p_items jsonb,
  p_reference text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_order_number text;
begin
  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'El nombre del cliente es obligatorio';
  end if;

  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'El teléfono del cliente es obligatorio';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe incluir al menos un producto';
  end if;

  -- Validar productos y calcular subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select *
    into v_product
    from public.products p
    where p.id = (v_item ->> 'product_id')::uuid
      and p.active = true;

    if not found then
      raise exception 'Producto no disponible: %', coalesce(v_item ->> 'product_id', '?');
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Cantidad inválida para el producto %', v_product.name;
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Stock insuficiente para el producto %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  v_total := v_subtotal;
  v_order_number := 'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.orders (
    id, order_number, customer_name, customer_phone, city, address,
    reference, note, subtotal, total, status
  )
  values (
    v_order_id, v_order_number, p_customer_name, p_customer_phone,
    p_city, p_address, p_reference, p_note, v_subtotal, v_total, 'pending'
  );

  -- Insertar items y descontar stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select *
    into v_product
    from public.products p
    where p.id = (v_item ->> 'product_id')::uuid
      and p.active = true;

    v_quantity := (v_item ->> 'quantity')::integer;

    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, subtotal
    )
    values (
      v_order_id, v_product.id, v_product.name, v_quantity, v_product.price,
      v_product.price * v_quantity
    );

    update public.products
    set stock = stock - v_quantity
    where id = v_product.id
      and stock >= v_quantity;

    if not found then
      raise exception 'Stock insuficiente para el producto %', v_product.name;
    end if;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb, text, text) from public;
grant execute on function public.create_order(text, text, text, text, jsonb, text, text) to anon, authenticated;