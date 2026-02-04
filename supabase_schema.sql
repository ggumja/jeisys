-- Supabase (PostgreSQL) Schema for Jeisys Medical B2B

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('admin', 'user');
create type approval_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type order_status as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
create type post_type as enum ('notice', 'faq', 'news', 'media');
create type inquiry_status as enum ('waiting', 'answered');

-- 1. Users Table (Extends auth.users)
-- Links to Supabase Auth. 'id' matches auth.users.id
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email varchar(255),
  name varchar(100) not null,
  hospital_name varchar(100),
  hospital_email varchar(255),
  tax_email varchar(255),
  phone varchar(20),
  mobile varchar(20),
  business_number varchar(50),
  zip_code varchar(10),
  address text,
  address_detail text,
  region varchar(100),
  business_certificate_url text,
  email_notification boolean default false,
  holiday_week varchar(50),
  holiday_day varchar(50),
  is_public_holiday boolean default false,
  role user_role default 'user',
  approval_status approval_status default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies for users
alter table public.users enable row level security;

-- 2. Equipments Table
create table public.equipments (
  id uuid default uuid_generate_v4() primary key,
  model_name varchar(100) not null,
  code varchar(50) unique,
  category varchar(50),
  image_url text,
  created_at timestamptz default now()
);

-- 3. Products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  sku varchar(100) unique not null,
  name varchar(255) not null,
  category varchar(50),
  subcategory varchar(50),
  description text,
  price decimal(12,2) default 0 not null,
  stock integer default 0 not null,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. User Equipments
create table public.user_equipments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  equipment_id uuid references public.equipments(id) on delete cascade not null,
  serial_number varchar(100),
  install_date date,
  warranty_end_date date,
  created_at timestamptz default now()
);

-- 5. Product Compatibility
create table public.product_compatibility (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  equipment_id uuid references public.equipments(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 6. Product Images
create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 7. Product Pricing Tiers
create table public.product_pricing_tiers (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  min_quantity integer not null,
  unit_price decimal(12,2) not null
);

-- 8. Cart Items
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1 not null,
  is_subscription boolean default false,
  created_at timestamptz default now()
);

-- 9. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  order_number varchar(100) unique not null,
  status order_status default 'pending',
  total_amount decimal(12,2) not null,
  payment_method varchar(50),
  delivery_address text,
  tracking_number varchar(100),
  ordered_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null,
  unit_price decimal(12,2) not null,
  total_price decimal(12,2) not null
);

-- 11. Posts
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  type post_type not null,
  title varchar(255) not null,
  content text,
  view_count integer default 0,
  is_visible boolean default true,
  image_url text,
  created_at timestamptz default now()
);

-- 12. Inquiries
create table public.inquiries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  type varchar(50) not null,
  title varchar(255) not null,
  content text not null,
  is_secret boolean default true,
  status inquiry_status default 'waiting',
  answer_content text,
  answered_at timestamptz,
  created_at timestamptz default now()
);

-- Triggers for updated_at
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_users_modtime
    before update on public.users
    for each row execute procedure update_modified_column();

create trigger update_orders_modtime
    before update on public.orders
    for each row execute procedure update_modified_column();
