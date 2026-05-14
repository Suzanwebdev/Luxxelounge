-- Optional name / phone with homepage newsletter signups.
alter table public.newsletter_subscribers add column if not exists full_name text;
alter table public.newsletter_subscribers add column if not exists phone text;
