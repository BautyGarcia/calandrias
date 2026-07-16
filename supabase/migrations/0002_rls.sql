-- Deny-by-default: se habilita RLS en todo; solo se crean policies de LECTURA
-- pública sobre contenido publicado. NINGUNA policy de escritura: toda escritura
-- entra por service_role (server actions con requireAdmin()).
alter table cabins enable row level security;
alter table cabin_sync_config enable row level security;
alter table reservations enable row level security;
alter table faqs enable row level security;
alter table reviews enable row level security;
alter table gallery_items enable row level security;
alter table site_content enable row level security;
alter table site_settings enable row level security;

create policy "public read published cabins" on cabins
    for select to anon, authenticated using (is_published);
create policy "public read published faqs" on faqs
    for select to anon, authenticated using (is_published);
create policy "public read published reviews" on reviews
    for select to anon, authenticated using (is_published);
create policy "public read published gallery" on gallery_items
    for select to anon, authenticated using (is_published);
create policy "public read site content" on site_content
    for select to anon, authenticated using (true);
create policy "public read site settings" on site_settings
    for select to anon, authenticated using (true);
-- cabin_sync_config y reservations: SIN policies → invisibles fuera de service_role.

-- Storage: bucket público de solo lectura; escritura solo via service_role.
insert into storage.buckets (id, name, public) values ('images', 'images', true)
    on conflict (id) do nothing;
create policy "public read images" on storage.objects
    for select to anon, authenticated using (bucket_id = 'images');
