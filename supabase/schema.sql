create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

create table if not exists restaurants (
  id text primary key,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_email text not null,
  full_name text not null,
  phone text not null,
  address text not null,
  address_label text,
  item jsonb,
  items jsonb not null,
  restaurant jsonb not null,
  payment_method text not null,
  subtotal numeric,
  total numeric not null,
  delivery_fee numeric,
  platform_fee numeric,
  discount numeric,
  coupon_code text,
  delivery_note text,
  taxes_and_charges numeric,
  status text not null default 'confirmed',
  created_at timestamptz default now()
);

create index if not exists orders_user_email_idx on orders (user_email);
