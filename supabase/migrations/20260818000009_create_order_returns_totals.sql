-- ============================================================================
-- 0009: create_order devuelve los totales reales calculados en el servidor
-- ============================================================================
-- PostgreSQL no permite cambiar el tipo de retorno con CREATE OR REPLACE
-- (SQLSTATE 42P13), así que esta migración:
--   1. revoca permisos de la función antigua,
--   2. la elimina con su firma exacta,
--   3. la vuelve a crear con el MISMO conjunto de parámetros retornando jsonb,
--   4. vuelve a otorgar los grants a anon/authenticated.
--
-- No toca tablas, no borra pedidos ni modifica datos existentes.
--
-- La nueva función mantiene: SECURITY DEFINER, search_path = public,
-- transacción atómica (una sola función = una sola transacción),
-- validación de productos activos, validación de stock (update condicional
-- + raise => rollback, stock nunca negativo), precios siempre del servidor
-- y grants correctos. Nada de service_role.
--
-- Retorno:
--   {
--     "order_id": uuid,
--     "order_number": "ORD-XXXXXXXXXX",
--     "subtotal": número,
--     "total": número
--   }
-- ============================================================================

-- 1) Revocar permisos de la función antigua
revoke all on function public.create_order(text, text, text, text, jsonb, text, text) from public;

-- 2) Eliminar únicamente la función antigua con su firma exacta
drop function if exists public.create_order(text, text, text, text, jsonb, text, text);

-- 3) Crear la función con los mismos parámetros retornando jsonb
create function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_city text,
  p_address text,
  p_items jsonb,
  p_reference text default null,
  p_note text default null
)
returns jsonb
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

  -- Validar productos (activos) y calcular subtotal con el precio del servidor
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

  -- Insertar items y descontar stock (transacción atómica)
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

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'total', v_total
  );
end;
$$;

-- 4) Otorgar permisos de ejecución a anon y authenticated
grant execute on function public.create_order(text, text, text, text, jsonb, text, text) to anon, authenticated;