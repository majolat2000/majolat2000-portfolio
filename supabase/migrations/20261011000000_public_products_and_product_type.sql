-- Migration: Support product types (course, toolkit, product) and allow public browsing of active products
-- Run this in your Supabase SQL editor:

-- 1. Add 'type' column to products table if not present
alter table if exists public.products
  add column if not exists type text not null default 'course'
  check (type in ('course', 'toolkit', 'product'));

-- 2. Update read policy so anyone (including unauthenticated visitors) can view active products
drop policy if exists "products readable" on public.products;

create policy "products readable"
  on public.products for select
  to anon, authenticated
  using (active or public.is_admin());
