begin;
create extension if not exists pgcrypto;

-- Extend the existing catalog without replacing any current rows.
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists badge text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists inventory integer check(inventory is null or inventory>=0);
alter table public.products add column if not exists sort_order integer not null default 0;
with ranked as(
  select id,row_number() over(partition by lower(brand),value order by id) rn,
         lower(trim(both '-' from regexp_replace(brand,'[^a-zA-Z0-9]+','-','g')))||'-'||round(value)::bigint::text base_slug
  from public.products
)
update public.products p
set slug=case when r.rn=1 then r.base_slug else r.base_slug||'-archived-'||p.id end,
    available=case when r.rn=1 then p.available else false end
from ranked r where p.id=r.id;
create unique index if not exists products_slug_uidx on public.products(slug);
create index if not exists products_available_sort_idx on public.products(available,sort_order);

-- Extend the current orders table while preserving normalized order_items.
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
create unique index if not exists orders_order_number_uidx on public.orders(order_number);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

create table if not exists public.admin_users(
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check(role in('admin','owner','support')),
  created_at timestamptz not null default now()
);
insert into public.admin_users(user_id,role) values('843c4466-789d-464d-97e9-4bad92ad7abf','owner') on conflict(user_id) do update set role='owner';

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public
as $$select exists(select 1 from public.admin_users where user_id=auth.uid())$$;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists order_status_audit on public.orders;

-- Upsert the storefront catalog. Existing rows with the same brand/value are upgraded.
insert into public.products(brand,title,value,price,available,slug,badge,description,sort_order) values
('Amazon','Amazon €350',350,70,true,'amazon-350','Popular','Digital Amazon gift card',10),
('Amazon','Amazon €800',800,180,true,'amazon-800','Premium','Digital Amazon gift card',20),
('Amazon','Amazon €1,800',1800,380,true,'amazon-1800','Best value','Digital Amazon gift card',30),
('Amazon','Amazon €300',300,70,true,'amazon-300','Starter','Digital Amazon gift card',40),
('Amazon','Amazon €400',400,90,true,'amazon-400','Starter','Digital Amazon gift card',50),
('Google Play','Google Play €350',350,80,true,'google-play-350','Popular','Digital Google Play gift card',60),
('Google Play','Google Play €800',800,200,true,'google-play-800','Premium','Digital Google Play gift card',70),
('Google Play','Google Play €900',900,220,true,'google-play-900','Popular','Digital Google Play gift card',80),
('Google Play','Google Play €1,000',1000,250,true,'google-play-1000','Premium','Digital Google Play gift card',90),
('Google Play','Google Play €2,000',2000,450,true,'google-play-2000','Best value','Digital Google Play gift card',100),
('Apple','Apple €350',350,80,true,'apple-350','Popular','Digital Apple gift card',110),
('Apple','Apple €800',800,200,true,'apple-800','Premium','Digital Apple gift card',120),
('Apple','Apple €1,000',1000,220,true,'apple-1000','Popular','Digital Apple gift card',130),
('Apple','Apple €1,800',1800,430,true,'apple-1800','Best value','Digital Apple gift card',140),
('Apple','Apple €2,000',2000,450,true,'apple-2000','Best value','Digital Apple gift card',150)
on conflict(slug) do update set brand=excluded.brand,title=excluded.title,value=excluded.value,price=excluded.price,available=excluded.available,badge=excluded.badge,description=excluded.description,sort_order=excluded.sort_order;

-- The browser supplies only product ids and quantities. All money is recalculated here.
create or replace function public.create_order_secure(p_customer_name text,p_customer_email text,p_cart jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_name text:=trim(p_customer_name);v_email text:=lower(trim(p_customer_email));v_total numeric(12,2);v_items jsonb;v_id uuid;v_number text;v_expected int;
begin
 if length(v_name)<2 or length(v_name)>80 then raise exception 'INVALID_NAME' using errcode='22023';end if;
 if length(v_email)>254 or v_email!~*'^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'INVALID_EMAIL' using errcode='22023';end if;
 if (select count(*) from public.orders where lower(customer_email)=v_email and created_at>now()-interval '10 minutes')>=5 then raise exception 'RATE_LIMITED' using errcode='P0001';end if;
 if jsonb_typeof(p_cart)<>'array' or jsonb_array_length(p_cart)=0 or jsonb_array_length(p_cart)>30 then raise exception 'INVALID_CART' using errcode='22023';end if;
 if exists(select 1 from jsonb_to_recordset(p_cart)x(product_id bigint,quantity int) where product_id is null or quantity<1 or quantity>10) then raise exception 'INVALID_QUANTITY' using errcode='22023';end if;
 select count(distinct product_id) into v_expected from jsonb_to_recordset(p_cart)x(product_id bigint,quantity int);
 with requested as(select product_id,sum(quantity)::int quantity from jsonb_to_recordset(p_cart)x(product_id bigint,quantity int) group by product_id),priced as(select p.id,p.slug,p.brand,p.title,p.value,p.price,r.quantity,(p.price*r.quantity)::numeric(12,2) subtotal from requested r join public.products p on p.id=r.product_id and p.available where p.inventory is null or p.inventory>=r.quantity)
 select coalesce(sum(subtotal),0),coalesce(jsonb_agg(jsonb_build_object('product_id',id,'slug',slug,'brand',brand,'product_name',title,'product_value',value,'unit_price',price,'quantity',quantity,'subtotal',subtotal) order by title),'[]'::jsonb) into v_total,v_items from priced;
 if jsonb_array_length(v_items)<>v_expected then raise exception 'PRODUCT_UNAVAILABLE' using errcode='22023';end if;
 if v_total<100 then raise exception 'MINIMUM_ORDER_100' using errcode='22023';end if;
 v_number:='GL-'||to_char(clock_timestamp(),'YYYYMMDD')||'-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,8));
 insert into public.orders(order_number,customer_id,customer_name,customer_email,total,status,items) values(v_number,auth.uid(),v_name,v_email,v_total,'pending',v_items) returning id into v_id;
 insert into public.order_items(order_id,product_id,product_name,product_value,unit_price,quantity,subtotal) select v_id,(x->>'product_id')::bigint,x->>'product_name',(x->>'product_value')::numeric,(x->>'unit_price')::numeric,(x->>'quantity')::int,(x->>'subtotal')::numeric from jsonb_array_elements(v_items)x;
 return jsonb_build_object('success',true,'id',v_id,'order_number',v_number,'total',v_total,'status','pending');
end$$;

revoke all on function public.create_order_secure(text,text,jsonb) from public;
grant execute on function public.create_order_secure(text,text,jsonb) to anon,authenticated;
revoke all on function public.is_admin() from public;grant execute on function public.is_admin() to authenticated;

alter table public.products enable row level security;alter table public.orders enable row level security;alter table public.order_items enable row level security;alter table public.order_status_history enable row level security;alter table public.admin_users enable row level security;
drop policy if exists "public reads available products" on public.products;create policy "public reads available products" on public.products for select to anon,authenticated using(available or public.is_admin());
drop policy if exists "admins manage products" on public.products;create policy "admins manage products" on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins read orders" on public.orders;create policy "admins read orders" on public.orders for select to authenticated using(public.is_admin());
drop policy if exists "admins update orders" on public.orders;create policy "admins update orders" on public.orders for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins delete orders" on public.orders;create policy "admins delete orders" on public.orders for delete to authenticated using(public.is_admin());
drop policy if exists "admins read order items" on public.order_items;create policy "admins read order items" on public.order_items for select to authenticated using(public.is_admin());
drop policy if exists "admins read history" on public.order_status_history;create policy "admins read history" on public.order_status_history for select to authenticated using(public.is_admin());
drop policy if exists "admins read roles" on public.admin_users;create policy "admins read roles" on public.admin_users for select to authenticated using(public.is_admin());
grant select on public.products to anon,authenticated;grant select,update,delete on public.orders to authenticated;grant select on public.order_items,public.order_status_history,public.admin_users to authenticated;grant insert,update,delete on public.products to authenticated;
commit;
