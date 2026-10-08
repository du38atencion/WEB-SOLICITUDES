-- Ejecutar una vez en el SQL Editor de un proyecto Supabase nuevo.
begin;
create table public.contadores_folio (anio integer primary key, ultimo bigint not null);
create table public.solicitudes (
 id uuid primary key default gen_random_uuid(),
 folio text unique not null,
 departamento_solicitante text not null check (length(trim(departamento_solicitante)) between 1 and 120),
 nombre_solicitante text not null check (length(trim(nombre_solicitante)) between 1 and 120),
 area_atiende text not null check (length(trim(area_atiende)) between 1 and 120),
 tipo_solicitud text not null check (length(trim(tipo_solicitud)) between 1 and 120),
 prioridad text not null check (prioridad in ('Baja','Media','Alta','Urgente')),
 fecha_requerida date not null,
 descripcion text not null check (length(trim(descripcion)) between 1 and 5000),
 ubicacion text not null check (length(trim(ubicacion)) between 1 and 200),
 observaciones text check (length(observaciones)<=5000),
 estado text not null default 'Pendiente' check (estado in ('Pendiente','En revisión','En proceso','Atendida','Cerrada','Rechazada')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.comentarios_solicitud (
 id uuid primary key default gen_random_uuid(), solicitud_id uuid not null references public.solicitudes(id),
 comentario text not null check (length(trim(comentario)) between 1 and 5000),
 autor text not null check (length(trim(autor)) between 1 and 120), created_at timestamptz not null default now()
);
create table public.historial_estado (
 id uuid primary key default gen_random_uuid(), solicitud_id uuid not null references public.solicitudes(id),
 estado_anterior text, estado_nuevo text not null, comentario text, created_at timestamptz not null default now()
);
create index solicitudes_created_idx on public.solicitudes(created_at desc);
create index comentarios_solicitud_idx on public.comentarios_solicitud(solicitud_id,created_at);
create index historial_estado_idx on public.historial_estado(solicitud_id,created_at);
create function public.preparar_solicitud() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_anio integer; v_numero bigint;
begin
 if TG_OP = 'INSERT' then
  v_anio := extract(year from now() at time zone 'America/Mexico_City');
  insert into public.contadores_folio(anio,ultimo) values(v_anio,1)
   on conflict(anio) do update set ultimo=public.contadores_folio.ultimo+1 returning ultimo into v_numero;
  new.folio := 'SOL-' || v_anio || '-' || lpad(v_numero::text,greatest(5,length(v_numero::text)),'0');
  new.estado := 'Pendiente'; new.created_at := now();
 end if;
 new.updated_at := now(); return new;
end; $$;
create trigger preparar_solicitud before insert or update on public.solicitudes for each row execute function public.preparar_solicitud();
create function public.auditar_estado() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if TG_OP='INSERT' then
  insert into public.historial_estado(solicitud_id,estado_anterior,estado_nuevo) values(new.id,null,new.estado);
 elsif old.estado is distinct from new.estado then
  insert into public.historial_estado(solicitud_id,estado_anterior,estado_nuevo) values(new.id,old.estado,new.estado);
 end if;
 return new;
end; $$;
create trigger auditar_estado after insert or update on public.solicitudes for each row execute function public.auditar_estado();
-- Estado y comentario se guardan en una única transacción; evita sobrescribir un cambio concurrente.
create function public.registrar_seguimiento(p_solicitud_id uuid,p_estado text,p_estado_esperado text,p_comentario text default null,p_autor text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_estado text;
begin
 select estado into v_estado from public.solicitudes where id=p_solicitud_id for update;
 if not found then raise exception 'La solicitud ya no existe'; end if;
 if v_estado is distinct from p_estado_esperado then raise exception 'El estado cambió. Actualiza el tablero e intenta de nuevo'; end if;
 if p_estado is null or p_estado not in ('Pendiente','En revisión','En proceso','Atendida','Cerrada','Rechazada') then raise exception 'Estado inválido'; end if;
 if p_estado=v_estado and nullif(trim(p_comentario),'') is null then raise exception 'No hay cambios para guardar'; end if;
 if nullif(trim(p_comentario),'') is not null then
  insert into public.comentarios_solicitud(solicitud_id,comentario,autor) values(p_solicitud_id,trim(p_comentario),trim(p_autor));
 end if;
 update public.solicitudes set estado=p_estado where id=p_solicitud_id;
 if p_estado is distinct from v_estado and nullif(trim(p_comentario),'') is not null then
  update public.historial_estado set comentario=trim(p_comentario) where solicitud_id=p_solicitud_id and created_at=now() and estado_anterior=v_estado and estado_nuevo=p_estado;
 end if;
end; $$;
alter table public.solicitudes enable row level security;
alter table public.comentarios_solicitud enable row level security;
alter table public.historial_estado enable row level security;
alter table public.contadores_folio enable row level security;
create policy leer_solicitudes on public.solicitudes for select to anon,authenticated using(true);
create policy crear_solicitudes on public.solicitudes for insert to anon,authenticated with check(true);
create policy leer_comentarios on public.comentarios_solicitud for select to anon,authenticated using(true);
create policy leer_historial on public.historial_estado for select to anon,authenticated using(true);
revoke all on public.solicitudes,public.comentarios_solicitud,public.historial_estado,public.contadores_folio from anon,authenticated;
grant select on public.solicitudes,public.comentarios_solicitud,public.historial_estado to anon,authenticated;
grant insert(departamento_solicitante,nombre_solicitante,area_atiende,tipo_solicitud,prioridad,fecha_requerida,descripcion,ubicacion,observaciones) on public.solicitudes to anon,authenticated;
revoke all on function public.preparar_solicitud(),public.auditar_estado(),public.registrar_seguimiento(uuid,text,text,text,text) from public;
grant execute on function public.registrar_seguimiento(uuid,text,text,text,text) to anon,authenticated;
alter publication supabase_realtime add table public.solicitudes,public.comentarios_solicitud,public.historial_estado;
commit;
