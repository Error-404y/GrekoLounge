begin;

-- Private customer tracking: both reference and matching email are required.
create or replace function public.track_order_secure(
  p_order_number text,
  p_customer_email text
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_history jsonb;
begin
  if length(trim(p_order_number))<8 or length(trim(p_customer_email))<5 then
    return jsonb_build_object('success',false,'error','INVALID_LOOKUP');
  end if;

  select * into v_order
  from public.orders
  where upper(order_number)=upper(trim(p_order_number))
    and lower(customer_email)=lower(trim(p_customer_email));

  if not found then
    return jsonb_build_object('success',false,'error','NO_MATCH');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_name',product_name,
    'product_value',product_value,
    'unit_price',unit_price,
    'quantity',quantity,
    'subtotal',subtotal
  ) order by id),'[]'::jsonb)
  into v_items
  from public.order_items
  where order_id=v_order.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'status',status,
    'message',message,
    'created_at',created_at
  ) order by created_at),'[]'::jsonb)
  into v_history
  from public.order_status_history
  where order_id=v_order.id;

  return jsonb_build_object(
    'success',true,
    'order_number',v_order.order_number,
    'total',v_order.total,
    'status',v_order.status,
    'created_at',v_order.created_at,
    'updated_at',v_order.updated_at,
    'items',v_items,
    'history',v_history
  );
end;
$$;

revoke all on function public.track_order_secure(text,text) from public;
grant execute on function public.track_order_secure(text,text) to anon,authenticated;

-- Controlled operational updates with transition validation and audit messages.
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED' using errcode='42501';
  end if;

  if p_status not in ('pending','approved','processing','completed','rejected','cancelled') then
    raise exception 'INVALID_STATUS' using errcode='22023';
  end if;

  select status into v_old from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND' using errcode='P0002'; end if;

  if v_old='completed' and p_status<>v_old then
    raise exception 'COMPLETED_ORDER_LOCKED' using errcode='22023';
  end if;

  update public.orders set status=p_status where id=p_order_id;

  return jsonb_build_object('success',true,'id',p_order_id,'old_status',v_old,'status',p_status);
end;
$$;

revoke all on function public.admin_update_order_status(uuid,text,text) from public;
grant execute on function public.admin_update_order_status(uuid,text,text) to authenticated;

commit;
