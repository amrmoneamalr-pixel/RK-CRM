-- ============================================================
-- RK CRM — Supabase schema
-- نفّذ هذا الملف كامل في: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) جدول البروفايلات (يربط كل مستخدم باسمه ودوره)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'sales' check (role in ('admin', 'sales')),
  created_at timestamptz default now()
);

-- 2) جدول العملاء
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  phone text,
  project text,
  budget numeric,
  source text,
  stage text not null default 'new'
    check (stage in ('new','contacted','meeting','negotiation','won','lost')),
  notes text,
  next_follow_up date,
  closed_at date,
  created_at timestamptz default now()
);

-- 3) جدول المتابعات / الأنشطة
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('call','meeting','whatsapp','visit')),
  date date not null,
  notes text,
  created_at timestamptz default now()
);

-- 4) جدول الأهداف الشهرية
create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  month text not null, -- صيغة 'YYYY-MM'
  deals_target int default 0,
  meetings_target int default 0,
  unique (owner_id, month)
);

-- ============================================================
-- إنشاء بروفايل تلقائي عند تسجيل أي مستخدم جديد
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'sales');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- دالة مساعدة لمعرفة هل المستخدم الحالي أدمن (security definer لتجنب recursion)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- تفعيل Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.activities enable row level security;
alter table public.targets enable row level security;

-- profiles: كل مستخدم يشوف بروفايله، والأدمن يشوف الكل
create policy "select own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "admin select all profiles" on public.profiles
  for select using (public.is_admin());

-- clients: كل سيلز يدير عملاؤه فقط، والأدمن يشوف عملاء الكل (قراءة)
create policy "sales manage own clients" on public.clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin select all clients" on public.clients
  for select using (public.is_admin());

-- activities: نفس المنطق
create policy "sales manage own activities" on public.activities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin select all activities" on public.activities
  for select using (public.is_admin());

-- targets: نفس المنطق
create policy "sales manage own targets" on public.targets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin select all targets" on public.targets
  for select using (public.is_admin());

-- ============================================================
-- بعد إنشاء حسابك الأول من التطبيق، نفّذ السطر التالي
-- (غيّر البريد الإلكتروني لبريدك) لتحويل حسابك إلى أدمن:
-- ============================================================
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'your-email@example.com');
