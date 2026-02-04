-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (Modified to extend Supabase auth.users if needed, but keeping separate for business logic)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  user_id varchar not null unique, -- Login ID
  password_hash varchar not null, -- Stored securely
  name varchar not null,
  hospital_name varchar,
  hospital_email varchar,
  tax_email varchar,
  phone varchar,
  mobile varchar,
  business_number varchar,
  zip_code varchar,
  address text,
  address_detail text,
  region varchar,
  business_certificate_url text,
  email_notification boolean default false,
  holiday_week varchar,
  holiday_day varchar,
  is_public_holiday boolean default false,
  role varchar default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Equipments Table (Master Data)
create table public.equipments (
  id uuid primary key default uuid_generate_v4(),
  model_name varchar not null,
  code varchar unique,
  category varchar,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. User Equipments Table (Relation)
create table public.user_equipments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  equipment_id uuid references public.equipments(id) on delete cascade not null,
  serial_number varchar,
  install_date date,
  warranty_end_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Products Table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  sku varchar unique not null,
  name varchar not null,
  category varchar,
  subcategory varchar,
  description text,
  price integer default 0 not null,
  stock integer default 0 not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Product Images Table
create table public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  display_order integer default 0
);

-- 6. Product Pricing Tiers Table
create table public.product_pricing_tiers (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  min_quantity integer not null,
  unit_price integer not null
);

-- 7. Product Compatibility Table
create table public.product_compatibility (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  equipment_id uuid references public.equipments(id) on delete cascade not null
);

-- 8. Cart Items Table
create table public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1 not null,
  is_subscription boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Orders Table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  order_number varchar unique not null,
  status varchar default 'pending' check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount integer not null,
  payment_method varchar,
  delivery_address text,
  tracking_number varchar,
  ordered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Order Items Table
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null
);

-- 11. Posts Table (Notice, FAQ, News, Media)
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  type varchar not null check (type in ('notice', 'faq', 'news', 'media')),
  title varchar not null,
  content text,
  view_count integer default 0,
  is_visible boolean default true,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Inquiries Table (1:1 Support)
create table public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  type varchar not null,
  title varchar not null,
  content text not null,
  is_secret boolean default true,
  status varchar default 'waiting' check (status in ('waiting', 'answered')),
  answer_content text,
  answered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS Policies (Basic Setup)
alter table public.users enable row level security;
alter table public.user_equipments enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inquiries enable row level security;

-- Allow users to see their own data
create policy "Users can see their own data" on public.users for select using (auth.uid() = id);
create policy "Users can see their own equipment" on public.user_equipments for select using (auth.uid() = user_id);
create policy "Users can see their own cart" on public.cart_items for all using (auth.uid() = user_id);
create policy "Users can see their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can see their own inquiries" on public.inquiries for select using (auth.uid() = user_id);

-- Public access policies (Products, Posts)
alter table public.products enable row level security;
create policy "Anyone can view products" on public.products for select using (true);

alter table public.posts enable row level security;
create policy "Anyone can view posts" on public.posts for select using (is_visible = true);
