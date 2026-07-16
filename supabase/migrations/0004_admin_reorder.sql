-- Reorden atómico de listas del backoffice (FAQs, reseñas, galería).
-- Renumera sort_order = posición (1-based) según el orden del array de ids,
-- en un único UPDATE (atómico), reemplazando el viejo esquema de swaps de a
-- pares desde el cliente que podía dejar órdenes a medio aplicar.

create or replace function public.admin_reorder(p_table text, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_table not in ('faqs', 'reviews', 'gallery_items') then
        raise exception 'tabla no permitida para reorden: %', p_table;
    end if;

    execute format(
        'update %I t set sort_order = u.ord from unnest($1) with ordinality as u(id, ord) where t.id = u.id',
        p_table
    ) using p_ids;
end;
$$;

-- Solo el backoffice (service_role vía requireAdmin) puede ejecutarla.
revoke execute on function public.admin_reorder(text, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_reorder(text, uuid[]) to service_role;
