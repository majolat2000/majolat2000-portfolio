-- Add 'paystack' to the product_access source check constraint
-- Run this in Supabase SQL Editor

ALTER TABLE public.product_access
  DROP CONSTRAINT IF EXISTS product_access_source_check;

ALTER TABLE public.product_access
  ADD CONSTRAINT product_access_source_check
  CHECK (source IN ('manual', 'flutterwave', 'paystack'));
