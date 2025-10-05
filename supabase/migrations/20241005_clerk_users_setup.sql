-- Create users table for Clerk integration
create table "public"."users" (
    "id" uuid default gen_random_uuid() primary key,
    "clerk_user_id" text unique not null,
    "email" text,
    "first_name" text,
    "last_name" text,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Enable RLS on users table
alter table "public"."users" enable row level security;

-- Create index for faster lookups
create index users_clerk_user_id_idx on "public"."users" (clerk_user_id);

-- Create a function to get the current user's clerk_user_id from JWT
create or replace function get_clerk_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'sub'
  );
$$;

-- RLS Policy: Allow all operations for now (we'll refine this once JWT template is configured)
create policy "Allow all operations for authenticated users"
on "public"."users"
as permissive
for all
to public
using (true)
with check (true);

-- Create a function to automatically update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_users_updated_at
    before update on "public"."users"
    for each row
    execute function update_updated_at_column();

-- Create an example related table (e.g., user_preferences)
create table "public"."user_preferences" (
    "id" uuid default gen_random_uuid() primary key,
    "user_id" uuid references "public"."users"(id) on delete cascade,
    "language" text default 'en',
    "theme" text default 'light',
    "notifications_enabled" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Enable RLS on user_preferences table
alter table "public"."user_preferences" enable row level security;

-- Create index for user_preferences
create index user_preferences_user_id_idx on "public"."user_preferences" (user_id);

-- RLS Policy: Allow all operations on preferences for now
create policy "Allow all operations for authenticated users on preferences"
on "public"."user_preferences"
as permissive
for all
to public
using (true)
with check (true);

-- Create trigger for user_preferences updated_at
create trigger update_user_preferences_updated_at
    before update on "public"."user_preferences"
    for each row
    execute function update_updated_at_column();

-- Create a function to create default preferences when a user is created
create or replace function create_user_preferences()
returns trigger as $$
begin
    insert into "public"."user_preferences" (user_id)
    values (new.id);
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically create preferences for new users
create trigger create_user_preferences_trigger
    after insert on "public"."users"
    for each row
    execute function create_user_preferences();