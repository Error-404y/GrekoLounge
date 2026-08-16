# GrekoLounge

Redesigned storefront and protected Supabase order workflow.

## What is included

- Responsive, accessible storefront with filtering, search, persistent cart, checkout validation, policies, and order references.
- Database-backed product catalog. Browser-submitted prices are never trusted.
- Secure `create_order_secure` RPC that validates products, quantities, availability, minimum value, and recalculates totals.
- Row-level security for products, orders, administrators, and audit events.
- Role-backed administrator access and order-status audit history.
- Idempotent migration at `supabase/migrations/202608160001_complete_foundation.sql`.

## Important business details to replace

Support email: `grekofinal@gmail.com`. Before public launch, add the legal business name/address, confirm payment and fulfillment terms, and obtain professional legal review for policies.

## Local preview

Serve this directory with any static web server. For example: `python3 -m http.server 8080`.
