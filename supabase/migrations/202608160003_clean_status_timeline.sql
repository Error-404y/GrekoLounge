begin;

-- Remove the redundant audit path added during the first hardening pass.
drop trigger if exists order_status_audit on public.orders;
drop function if exists public.audit_order_status();

-- Keep the original single status trigger, but make its origin and message clear.
create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_message text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  v_message := case new.status
    when 'pending' then 'Updated from admin dashboard: Order returned to pending review.'
    when 'approved' then 'Updated from admin dashboard: Order approved.'
    when 'processing' then 'Updated from admin dashboard: Your order is currently being processed.'
    when 'completed' then 'Updated from admin dashboard: Order completed.'
    when 'rejected' then 'Updated from admin dashboard: Order rejected.'
    when 'cancelled' then 'Updated from admin dashboard: Order archived or cancelled.'
    else 'Updated from admin dashboard: Order status changed.'
  end;

  insert into public.order_status_history(order_id,status,message)
  values(new.id,new.status,v_message);

  return new;
end;
$$;

commit;
