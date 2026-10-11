-- Activar o reactivar ADMIN. Ejecutar después de schema.sql.
-- Compatible con acceso público, login anterior y ejecución repetida.
-- Conserva todas las solicitudes. Solo ADMIN podrá usar la API.
begin;
drop policy if exists leer_solicitudes on public.solicitudes;
drop policy if exists crear_solicitudes on public.solicitudes;
drop policy if exists leer_comentarios on public.comentarios_solicitud;
drop policy if exists leer_historial on public.historial_estado;
create policy leer_solicitudes on public.solicitudes for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy crear_solicitudes on public.solicitudes for insert to authenticated with check ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy leer_comentarios on public.comentarios_solicitud for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
create policy leer_historial on public.historial_estado for select to authenticated using ((select auth.jwt()->>'email')='admin@solicitudes.internal');
revoke all on public.solicitudes,public.comentarios_solicitud,public.historial_estado from anon;
grant select on public.solicitudes,public.comentarios_solicitud,public.historial_estado to authenticated;
grant insert(departamento_solicitante,nombre_solicitante,area_atiende,tipo_solicitud,prioridad,fecha_requerida,descripcion,ubicacion,observaciones) on public.solicitudes to authenticated;
revoke insert(departamento_solicitante,nombre_solicitante,area_atiende,tipo_solicitud,prioridad,fecha_requerida,descripcion,ubicacion,observaciones) on public.solicitudes from anon;
-- El procedimiento original queda inaccesible desde la API pública.
do $$
 begin
  if to_regprocedure('public.registrar_seguimiento_interno(uuid,text,text,text,text)') is null then
   alter function public.registrar_seguimiento(uuid,text,text,text,text) rename to registrar_seguimiento_interno;
  end if;
 end; $$;
revoke all on function public.registrar_seguimiento_interno(uuid,text,text,text,text) from public,anon,authenticated;
create or replace function public.registrar_seguimiento(p_solicitud_id uuid,p_estado text,p_estado_esperado text,p_comentario text default null,p_autor text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if (auth.jwt()->>'email') is distinct from 'admin@solicitudes.internal' then
  raise exception 'Debes iniciar sesión como ADMIN' using errcode='42501';
 end if;
 perform public.registrar_seguimiento_interno(p_solicitud_id,p_estado,p_estado_esperado,p_comentario,p_autor);
end; $$;
revoke all on function public.registrar_seguimiento(uuid,text,text,text,text) from public,anon;
grant execute on function public.registrar_seguimiento(uuid,text,text,text,text) to authenticated;
commit;
